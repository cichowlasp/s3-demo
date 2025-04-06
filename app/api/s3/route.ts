import { NextResponse } from 'next/server';
import {
	S3Client,
	PutObjectCommand,
	ListObjectsV2Command,
	DeleteObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
	region: process.env.AWS_REGION || 'us-east-1',
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
	},
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const files = formData.getAll('files') as File[];
		const uploadResults = [];

		for (const file of files) {
			const buffer = Buffer.from(await file.arrayBuffer());
			const key = `uploads/${Date.now()}-${file.name}`;

			const command = new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
				Body: buffer,
				ContentType: file.type,
			});

			await s3Client.send(command);
			uploadResults.push({ fileName: file.name, key });
		}

		return NextResponse.json({
			success: true,
			message: `Successfully uploaded ${files.length} file(s)`,
			files: uploadResults,
		});
	} catch (error) {
		console.error('Error uploading files:', error);
		return NextResponse.json(
			{ success: false, message: 'Failed to upload files' },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const command = new ListObjectsV2Command({
			Bucket: BUCKET_NAME,
			Prefix: 'uploads/',
		});

		const response = await s3Client.send(command);

		if (!response.Contents) {
			return NextResponse.json({ success: true, files: [] });
		}

		// Generate presigned URLs for each file (valid for 1 hour)
		const files = await Promise.all(
			response.Contents.map(async (item) => {
				const getObjectCommand = new GetObjectCommand({
					Bucket: BUCKET_NAME,
					Key: item.Key,
				});

				const url = await getSignedUrl(s3Client, getObjectCommand, {
					expiresIn: 3600,
				});

				return {
					id: item.Key,
					name: item.Key?.split('/').pop() || '',
					size: item.Size || 0,
					lastModified: item.LastModified?.toISOString() || '',
					url: url,
				};
			})
		);

		return NextResponse.json({ success: true, files });
	} catch (error) {
		console.error('Error fetching files:', error);
		return NextResponse.json(
			{ success: false, message: 'Failed to fetch files' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { fileId } = await request.json();

		if (!fileId) {
			return NextResponse.json(
				{ success: false, message: 'File ID is required' },
				{ status: 400 }
			);
		}

		const command = new DeleteObjectCommand({
			Bucket: BUCKET_NAME,
			Key: fileId,
		});

		await s3Client.send(command);

		return NextResponse.json({
			success: true,
			message: 'File deleted successfully',
		});
	} catch (error) {
		console.error('Error deleting file:', error);
		return NextResponse.json(
			{ success: false, message: 'Failed to delete file' },
			{ status: 500 }
		);
	}
}
