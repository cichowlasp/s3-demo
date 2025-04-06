'use client';

import { useState, useEffect } from 'react';

interface S3File {
	id: string;
	name: string;
	size: number;
	lastModified: string;
	url?: string; // Add URL for downloading files
}

export default function ManageFilesView() {
	const [files, setFiles] = useState<S3File[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<string | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
	const [actionStatus, setActionStatus] = useState<{
		success: boolean;
		message: string;
	} | null>(null);

	useEffect(() => {
		// Fetch files from S3 via API
		const fetchFiles = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch('/api/s3');
				const data = await response.json();

				if (!data.success) {
					throw new Error(data.message || 'Failed to fetch files');
				}

				setFiles(data.files);
			} catch (error) {
				console.error('Error fetching files:', error);
				setError(
					'Failed to fetch files from S3. Please try again later.'
				);
			} finally {
				setLoading(false);
			}
		};

		fetchFiles();
	}, []);

	const handleDownload = async (fileId: string, url?: string) => {
		setSelectedFile(fileId);
		setActionStatus(null);

		try {
			if (url) {
				// If we have a presigned URL, use it to download the file
				window.open(url, '_blank');
				setActionStatus({
					success: true,
					message: 'File download initiated',
				});
			} else {
				// Fallback if no URL is provided
				setActionStatus({
					success: false,
					message: 'Download URL not available',
				});
			}
		} catch (error) {
			console.error('Error downloading file:', error);
			setActionStatus({
				success: false,
				message: 'Error downloading file. Please try again.',
			});
		} finally {
			setSelectedFile(null);
		}
	};

	const handleDelete = async (fileId: string) => {
		if (deleteConfirm !== fileId) {
			setDeleteConfirm(fileId);
			return;
		}

		setSelectedFile(fileId);
		setActionStatus(null);

		try {
			// Call the API to delete the file
			const response = await fetch('/api/s3', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ fileId }),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.message || 'Failed to delete file');
			}

			// Remove file from the list
			setFiles(files.filter((file) => file.id !== fileId));

			setActionStatus({
				success: true,
				message: 'File deleted successfully',
			});
		} catch (error) {
			console.error('Error deleting file:', error);
			setActionStatus({
				success: false,
				message: 'Error deleting file. Please try again.',
			});
		} finally {
			setSelectedFile(null);
			setDeleteConfirm(null);
		}
	};

	const formatFileSize = (bytes: number): string => {
		if (bytes < 1024) return bytes + ' B';
		else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
		else return (bytes / 1048576).toFixed(1) + ' MB';
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleString();
	};

	return (
		<div className='bg-white p-6 rounded-lg shadow-md'>
			<h2 className='text-xl font-semibold mb-4'>Manage S3 Files</h2>

			{loading ? (
				<div className='flex justify-center items-center h-40'>
					<div className='animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500'></div>
				</div>
			) : error ? (
				<div className='bg-red-50 text-red-800 p-4 rounded-md'>
					{error}
				</div>
			) : files.length === 0 ? (
				<div className='text-center py-10 text-gray-500'>
					<p>No files found in your S3 bucket</p>
				</div>
			) : (
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th
									scope='col'
									className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									File Name
								</th>
								<th
									scope='col'
									className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Size
								</th>
								<th
									scope='col'
									className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Last Modified
								</th>
								<th
									scope='col'
									className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Actions
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{files.map((file) => (
								<tr key={file.id}>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm font-medium text-gray-900'>
											{file.name}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm text-gray-500'>
											{formatFileSize(file.size)}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap'>
										<div className='text-sm text-gray-500'>
											{formatDate(file.lastModified)}
										</div>
									</td>
									<td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
										<button
											onClick={() =>
												handleDownload(
													file.id,
													file.url
												)
											}
											disabled={selectedFile === file.id}
											className='text-blue-600 hover:text-blue-900 mr-4 disabled:text-blue-300'>
											{selectedFile === file.id
												? 'Downloading...'
												: 'Download'}
										</button>
										<button
											onClick={() =>
												handleDelete(file.id)
											}
											disabled={selectedFile === file.id}
											className={`${
												deleteConfirm === file.id
													? 'text-red-600 font-bold'
													: 'text-red-500'
											} hover:text-red-900 disabled:text-red-300`}>
											{selectedFile === file.id
												? 'Deleting...'
												: deleteConfirm === file.id
												? 'Confirm Delete?'
												: 'Delete'}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{actionStatus && (
				<div
					className={`mt-4 p-3 rounded-md ${
						actionStatus.success
							? 'bg-green-50 text-green-800'
							: 'bg-red-50 text-red-800'
					}`}>
					{actionStatus.message}
				</div>
			)}

			<div className='mt-8 bg-gray-50 p-4 rounded-md'>
				<h3 className='text-md font-medium mb-2'>Documentation</h3>
				<p className='text-sm text-gray-600'>
					This view allows you to manage files in your S3 bucket. You
					can download files to your local machine or delete them from
					the bucket. For deletion, you&apos;ll need to confirm the
					action by clicking the delete button twice.
				</p>
			</div>
		</div>
	);
}
