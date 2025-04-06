'use client';

import { useState, useRef } from 'react';

export default function UploadView() {
	const [files, setFiles] = useState<File[]>([]);
	const [uploading, setUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState<{
		success: boolean;
		message: string;
	} | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const dropZoneRef = useRef<HTMLDivElement>(null);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) {
			setFiles(Array.from(e.target.files));
		}
	};

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (!isDragging) setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();

		// Only set isDragging to false if we're leaving the dropzone (not a child element)
		if (
			dropZoneRef.current &&
			!dropZoneRef.current.contains(e.relatedTarget as Node)
		) {
			setIsDragging(false);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);

		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			setFiles(Array.from(e.dataTransfer.files));
		}
	};

	const handleUpload = async () => {
		if (files.length === 0) {
			setUploadStatus({
				success: false,
				message: 'Please select at least one file to upload',
			});
			return;
		}

		setUploading(true);
		setUploadStatus(null);

		try {
			// Create FormData to send files to the API
			const formData = new FormData();
			files.forEach((file) => {
				formData.append('files', file);
			});

			// Send files to the S3 API endpoint
			const response = await fetch('/api/s3', {
				method: 'POST',
				body: formData,
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.message || 'Upload failed');
			}

			setUploadStatus({
				success: true,
				message:
					data.message ||
					`Successfully uploaded ${files.length} file(s)`,
			});
			setFiles([]);
		} catch (error) {
			console.error('Error uploading files:', error);
			setUploadStatus({
				success: false,
				message:
					error instanceof Error
						? error.message
						: 'Error uploading files. Please try again.',
			});
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className='bg-white p-6 rounded-lg shadow-md'>
			<h2 className='text-xl font-semibold mb-4'>Upload Files to S3</h2>

			<div
				ref={dropZoneRef}
				className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
					isDragging
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-300'
				}`}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}>
				<input
					type='file'
					multiple
					onChange={handleFileChange}
					className='hidden'
					id='fileInput'
				/>
				<label
					htmlFor='fileInput'
					className='cursor-pointer flex flex-col items-center justify-center'>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='h-12 w-12 text-gray-400 mb-3'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
						/>
					</svg>
					<p className='text-gray-600 mb-1'>
						Drag and drop files here or click to browse
					</p>
					<p className='text-gray-400 text-sm'>
						Supported file types: All files
					</p>
				</label>
			</div>

			{files.length > 0 && (
				<div className='mb-6'>
					<h3 className='text-md font-medium mb-2'>
						Selected Files ({files.length})
					</h3>
					<ul className='max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2'>
						{files.map((file, index) => (
							<li
								key={index}
								className='text-sm py-1 border-b border-gray-100 last:border-b-0'>
								{file.name} ({(file.size / 1024).toFixed(2)} KB)
							</li>
						))}
					</ul>
				</div>
			)}

			<button
				onClick={handleUpload}
				disabled={uploading || files.length === 0}
				className='w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors'>
				{uploading ? 'Uploading...' : 'Upload to S3'}
			</button>

			{uploadStatus && (
				<div
					className={`mt-4 p-3 rounded-md ${
						uploadStatus.success
							? 'bg-green-50 text-green-800'
							: 'bg-red-50 text-red-800'
					}`}>
					{uploadStatus.message}
				</div>
			)}

			<div className='mt-8 bg-gray-50 p-4 rounded-md'>
				<h3 className='text-md font-medium mb-2'>Documentation</h3>
				<p className='text-sm text-gray-600'>
					This view allows you to upload files to your S3 bucket.
					Select one or multiple files and click the upload button.
					The files will be stored in your configured S3 bucket and
					will be available for download in the &quot;Manage
					Files&quot; view.
				</p>
			</div>
		</div>
	);
}
