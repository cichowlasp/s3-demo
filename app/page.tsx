'use client';

import { useState } from 'react';
import UploadView from '../components/UploadView';
import ManageFilesView from '../components/ManageFilesView';
import LogsView from '../components/LogsView';

export default function Home() {
	const [activeView, setActiveView] = useState<'upload' | 'manage' | 'logs'>(
		'upload'
	);

	return (
		<div className='min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
			<header className='mb-8'>
				<h1 className='text-2xl font-bold mb-4'>S3 Bucket Manager</h1>
				<div className='flex gap-4 border-b border-gray-200 pb-4'>
					<button
						onClick={() => setActiveView('upload')}
						className={`px-4 py-2 rounded-md ${
							activeView === 'upload'
								? 'bg-blue-500 text-white'
								: 'bg-gray-100 hover:bg-gray-200'
						}`}>
						Upload Files
					</button>
					<button
						onClick={() => setActiveView('manage')}
						className={`px-4 py-2 rounded-md ${
							activeView === 'manage'
								? 'bg-blue-500 text-white'
								: 'bg-gray-100 hover:bg-gray-200'
						}`}>
						Manage Files
					</button>
					<button
						onClick={() => setActiveView('logs')}
						className={`px-4 py-2 rounded-md ${
							activeView === 'logs'
								? 'bg-blue-500 text-white'
								: 'bg-gray-100 hover:bg-gray-200'
						}`}>
						Lambda Logs
					</button>
				</div>
			</header>

			<main className='flex flex-col gap-[32px]'>
				{activeView === 'upload' && <UploadView />}
				{activeView === 'manage' && <ManageFilesView />}
				{activeView === 'logs' && <LogsView />}
			</main>

			<footer className='mt-16 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm'>
				<p>S3 Bucket Manager Demo App by Piotr Cichowlas</p>
			</footer>
		</div>
	);
}
