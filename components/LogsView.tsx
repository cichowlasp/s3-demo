'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
	id: string;
	timestamp: string;
	level: 'INFO' | 'WARN' | 'ERROR';
	message: string;
	lambdaFunction: string;
	requestId: string;
}

export default function LogsView() {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filter, setFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>(
		'ALL'
	);
	const [searchTerm, setSearchTerm] = useState('');

	useEffect(() => {
		// Simulate fetching logs from AWS Lambda
		const fetchLogs = async () => {
			setLoading(true);
			setError(null);

			try {
				// This would be replaced with actual AWS Lambda logs API call
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// Mock data
				const mockLogs: LogEntry[] = [
					{
						id: '1',
						timestamp: '2023-10-15T14:48:00Z',
						level: 'INFO',
						message: 'File upload initiated',
						lambdaFunction: 'fileUploadHandler',
						requestId: 'req-123456',
					},
					{
						id: '2',
						timestamp: '2023-10-15T14:49:30Z',
						level: 'INFO',
						message: 'File upload completed successfully',
						lambdaFunction: 'fileUploadHandler',
						requestId: 'req-123456',
					},
					{
						id: '3',
						timestamp: '2023-10-15T15:10:00Z',
						level: 'WARN',
						message: 'File size exceeds recommended limit',
						lambdaFunction: 'fileValidationHandler',
						requestId: 'req-789012',
					},
					{
						id: '4',
						timestamp: '2023-10-15T15:30:45Z',
						level: 'ERROR',
						message: 'Failed to delete file: permission denied',
						lambdaFunction: 'fileDeleteHandler',
						requestId: 'req-345678',
					},
					{
						id: '5',
						timestamp: '2023-10-15T16:05:12Z',
						level: 'INFO',
						message: 'User authenticated successfully',
						lambdaFunction: 'authHandler',
						requestId: 'req-901234',
					},
				];

				setLogs(mockLogs);
			} catch (error) {
				console.error('Error fetching logs:', error);
				setError(
					'Failed to fetch Lambda logs. Please try again later.'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchLogs();
	}, []);

	const filteredLogs = logs.filter((log) => {
		const matchesFilter = filter === 'ALL' || log.level === filter;
		const matchesSearch =
			searchTerm === '' ||
			log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
			log.lambdaFunction
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			log.requestId.toLowerCase().includes(searchTerm.toLowerCase());

		return matchesFilter && matchesSearch;
	});

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleString();
	};

	const getLevelColor = (level: 'INFO' | 'WARN' | 'ERROR'): string => {
		switch (level) {
			case 'INFO':
				return 'bg-blue-100 text-blue-800';
			case 'WARN':
				return 'bg-yellow-100 text-yellow-800';
			case 'ERROR':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	return (
		<div className='bg-white p-6 rounded-lg shadow-md'>
			<h2 className='text-xl font-semibold mb-4'>AWS Lambda Logs</h2>

			<div className='flex flex-col sm:flex-row gap-4 mb-6'>
				<div className='flex-1'>
					<input
						type='text'
						placeholder='Search logs...'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>
				<div>
					<select
						value={filter}
						onChange={(e) =>
							setFilter(
								e.target.value as
									| 'ALL'
									| 'INFO'
									| 'WARN'
									| 'ERROR'
							)
						}
						className='w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
						<option value='ALL'>All Levels</option>
						<option value='INFO'>Info Only</option>
						<option value='WARN'>Warnings Only</option>
						<option value='ERROR'>Errors Only</option>
					</select>
				</div>
			</div>

			{loading ? (
				<div className='flex justify-center items-center h-40'>
					<div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500'></div>
				</div>
			) : error ? (
				<div className='bg-red-50 text-red-800 p-4 rounded-md'>
					{error}
				</div>
			) : filteredLogs.length === 0 ? (
				<div className='text-center py-10 text-gray-500'>
					<p>No logs found matching your criteria</p>
				</div>
			) : (
				<div className='space-y-4'>
					{filteredLogs.map((log) => (
						<div
							key={log.id}
							className='border border-gray-200 rounded-md p-4'>
							<div className='flex justify-between items-start mb-2'>
								<span
									className={`px-2 py-1 rounded-md text-xs font-medium ${getLevelColor(
										log.level
									)}`}>
									{log.level}
								</span>
								<span className='text-xs text-gray-500'>
									{formatDate(log.timestamp)}
								</span>
							</div>
							<p className='text-gray-800 mb-2'>{log.message}</p>
							<div className='flex flex-col sm:flex-row gap-2 text-xs text-gray-500'>
								<span>Function: {log.lambdaFunction}</span>
								<span className='sm:ml-auto'>
									Request ID: {log.requestId}
								</span>
							</div>
						</div>
					))}
				</div>
			)}

			<div className='mt-8 bg-gray-50 p-4 rounded-md'>
				<h3 className='text-md font-medium mb-2'>Documentation</h3>
				<p className='text-sm text-gray-600'>
					This view displays logs from AWS Lambda functions that
					process your S3 operations. You can filter logs by level
					(INFO, WARN, ERROR) and search for specific text in the log
					messages, function names, or request IDs. These logs help
					you troubleshoot issues with your S3 operations.
				</p>
			</div>
		</div>
	);
}
