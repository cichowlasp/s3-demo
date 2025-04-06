import { NextResponse } from 'next/server';
import {
	SQSClient,
	ReceiveMessageCommand as SQSReceiveMessageCommand,
} from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({
	region: process.env.AWS_REGION || 'us-east-1',
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
	},
});

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL || '';

export async function GET() {
	try {
		// Log environment variables (without sensitive values)
		console.log('Environment check:', {
			region: process.env.AWS_REGION || 'not set',
			hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
			hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
			queueUrl: SQS_QUEUE_URL ? 'configured' : 'not configured',
		});

		// If using SQS to subscribe to the SNS topic (recommended approach)
		if (SQS_QUEUE_URL) {
			console.log('Attempting to fetch messages from SQS queue');

			try {
				const command = new SQSReceiveMessageCommand({
					QueueUrl: SQS_QUEUE_URL,
					MaxNumberOfMessages: 10,
					WaitTimeSeconds: 1,
					AttributeNames: ['All'],
					MessageAttributeNames: ['All'],
				});

				const response = await sqsClient.send(command);
				console.log(
					'SQS response received:',
					response.Messages
						? `${response.Messages.length} messages`
						: 'No messages'
				);

				if (!response.Messages || response.Messages.length === 0) {
					return NextResponse.json({ success: true, logs: [] });
				}

				// Process the messages from SQS
				const logs = [];
				for (const message of response.Messages) {
					try {
						console.log(`Processing message ${message.MessageId}`);

						// SNS messages are wrapped in SQS, so we need to parse the body
						const body = JSON.parse(message.Body || '{}');
						const snsMessage = JSON.parse(body.Message || '{}');

						logs.push({
							id: message.MessageId || `msg-${logs.length}`,
							timestamp:
								body.Timestamp || new Date().toISOString(),
							level: determineLogLevel(snsMessage),
							message:
								snsMessage.message ||
								body.Message ||
								'No message content',
							lambdaFunction: snsMessage.function || 'unknown',
							requestId:
								snsMessage.requestId ||
								body.MessageId ||
								'unknown',
						});

						// Message deletion code has been removed
					} catch (messageError) {
						console.error(
							'Error processing message:',
							messageError
						);
						logs.push({
							id: message.MessageId || `msg-${logs.length}`,
							timestamp: new Date().toISOString(),
							level: 'ERROR' as const,
							message:
								'Error parsing message: ' +
								(message.Body
									? message.Body.substring(0, 100) + '...'
									: 'No content'),
							lambdaFunction: 'parser',
							requestId: message.MessageId || 'unknown',
						});
					}
				}

				return NextResponse.json({ success: true, logs });
			} catch (sqsError) {
				console.error('SQS error:', sqsError);
				throw new Error(
					`SQS error: ${
						sqsError instanceof Error
							? sqsError.message
							: 'Unknown error'
					}`
				);
			}
		}

		// Fallback to mock data if no queue URL is provided
		console.log('No SQS URL configured, returning mock data');
		const mockLogs = [
			{
				id: '1',
				timestamp: new Date().toISOString(),
				level: 'INFO',
				message:
					'This is mock data. Please configure SQS_QUEUE_URL in your environment variables.',
				lambdaFunction: 'mockGenerator',
				requestId: 'mock-req-123',
			},
			{
				id: '2',
				timestamp: new Date().toISOString(),
				level: 'WARN',
				message:
					'SQS_QUEUE_URL environment variable is missing. Check your .env.local file.',
				lambdaFunction: 'configChecker',
				requestId: 'mock-req-124',
			},
		];

		return NextResponse.json({ success: true, logs: mockLogs });
	} catch (error) {
		console.error('Error in logs API route:', error);
		return NextResponse.json(
			{
				success: false,
				message:
					error instanceof Error
						? `Failed to fetch logs: ${error.message}`
						: 'Failed to fetch logs: Unknown error',
			},
			{ status: 500 }
		);
	}
}

// Helper function to determine log level based on message content
function determineLogLevel(message: {
	level?: string;
	message?: string;
	[key: string]: unknown;
}): 'INFO' | 'WARN' | 'ERROR' {
	if (!message) return 'INFO';

	// If the message has an explicit level field, use it
	if (message.level) {
		const level =
			typeof message.level === 'string'
				? message.level.toUpperCase()
				: '';
		if (level === 'ERROR' || level === 'WARN' || level === 'INFO') {
			return level as 'INFO' | 'WARN' | 'ERROR';
		}
	}

	// Otherwise try to determine from content
	const messageStr = JSON.stringify(message).toLowerCase();
	if (
		messageStr.includes('error') ||
		messageStr.includes('exception') ||
		messageStr.includes('fail')
	) {
		return 'ERROR';
	} else if (messageStr.includes('warn') || messageStr.includes('caution')) {
		return 'WARN';
	}

	return 'INFO';
}
