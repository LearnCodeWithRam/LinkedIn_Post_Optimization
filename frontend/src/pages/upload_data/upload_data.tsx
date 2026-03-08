import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadExcelFiles } from '@/services/upload.service'

export const UploadData: React.FC = () => {
	const navigate = useNavigate()
	const [linkedinUrl, setLinkedinUrl] = useState('')
	const [files, setFiles] = useState<{
		followers: File | null
		visitors: File | null
		content: File | null
	}>({
		followers: null,
		visitors: null,
		content: null,
	})
	const [uploading, setUploading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [uploadProgress, setUploadProgress] = useState<string>('')
	const [uploadMethod, setUploadMethod] = useState<'url' | 'files'>('files')

	const handleFileChange = (type: 'followers' | 'visitors' | 'content', file: File | null) => {
		setFiles((prev) => ({ ...prev, [type]: file }))
		setError(null)
	}

	const validateFiles = () => {
		if (!files.followers || !files.visitors || !files.content) {
			setError('Please upload all three Excel files')
			return false
		}

		const validExtensions = ['.xlsx', '.xls']
		const filesArray = [
			{ name: 'Followers', file: files.followers },
			{ name: 'Visitors', file: files.visitors },
			{ name: 'Content', file: files.content },
		]

		for (const { name, file } of filesArray) {
			const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
			if (!validExtensions.includes(extension)) {
				setError(`${name} file must be an Excel file (.xlsx or .xls)`)
				return false
			}
		}

		return true
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!validateFiles()) return

		setUploading(true)
		setUploadProgress('Uploading files...')

		try {
			setUploadProgress('Processing Excel files...')
			const response = await uploadExcelFiles(
				files.followers!,
				files.visitors!,
				files.content!
			)

			if (response.success) {
				setUploadProgress('Data saved successfully!')
				localStorage.setItem('data_uploaded', 'true') // Keep for backward compatibility

				setTimeout(() => {
					// Navigate to personal story page after upload
					navigate('/upload-data/personal-story')
				}, 1000)
			} else {
				setError(response.message || 'Upload failed')
				setUploadProgress('')
			}
		} catch (err: any) {
			setError(err?.response?.data?.message || err?.message || 'Failed to upload files')
			setUploadProgress('')
		} finally {
			setUploading(false)
		}
	}

	const FileUploadBox = ({
		type,
		label,
		file,
	}: {
		type: 'followers' | 'visitors' | 'content'
		label: string
		file: File | null
	}) => (
		<div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#0d569e] transition-all duration-200">
			<label className="block">
				<div className="flex flex-col items-center justify-center cursor-pointer">
					<svg
						className="w-12 h-12 text-gray-400 mb-3"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>
					<span className="text-lg font-semibold text-gray-700 mb-1">{label}</span>
					{file ? (
						<span className="text-sm text-[#0d569e] font-medium">{file.name}</span>
					) : (
						<span className="text-sm text-gray-500">Click to browse or drag & drop</span>
					)}
				</div>
				<input
					type="file"
					accept=".xlsx,.xls"
					onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
					className="hidden"
					disabled={uploading}
				/>
			</label>
		</div>
	)

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<div className="bg-[#0d569e] text-white font-bold text-2xl px-6 py-3 rounded-2xl shadow-lg">
							FeediSight
						</div>
					</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Upload Your LinkedIn Data</h1>
					<p className="text-lg text-gray-600">
						Let's get started by uploading your LinkedIn analytics
					</p>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
					<h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
						<svg
							className="w-6 h-6 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						How to Export Your LinkedIn Analytics Data
					</h2>
					<ol className="space-y-3 text-sm text-blue-800">
						<li className="flex items-start">
							<span className="font-semibold mr-2 flex-shrink-0">Step 1:</span>
							<span>Log in to your <strong>LinkedIn Business profile</strong></span>
						</li>
						<li className="flex items-start">
							<span className="font-semibold mr-2 flex-shrink-0">Step 2:</span>
							<span>Navigate to your profile and click on <strong>Analytics</strong></span>
						</li>
						<li className="flex items-start">
							<span className="font-semibold mr-2 flex-shrink-0">Step 3:</span>
							<div>
								<div>Export the following three files:</div>
								<ul className="list-disc ml-5 mt-1 space-y-1">
									<li><strong>Content Analytics</strong> - Your posts performance data</li>
									<li><strong>Followers Analytics</strong> - Your follower demographics</li>
									<li><strong>Visitors Analytics</strong> - Profile visitor statistics</li>
								</ul>
							</div>
						</li>
						<li className="flex items-start">
							<span className="font-semibold mr-2 flex-shrink-0">Step 4:</span>
							<span className="bg-yellow-100 px-2 py-1 rounded">
								<strong>IMPORTANT:</strong> Do NOT rename the downloaded files. Upload them with their <strong>original filenames as-is</strong>
							</span>
						</li>
					</ol>
				</div>

				<form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8">
					<div className="mb-6">
						<div className="flex gap-4 justify-center">
							<button
								type="button"
								onClick={() => setUploadMethod('url')}
								className={`px-6 py-3 rounded-lg font-semibold transition-all ${uploadMethod === 'url'
									? 'bg-emerald-500 text-white shadow-lg'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}
							>
								LinkedIn Profile URL
							</button>
							<button
								type="button"
								onClick={() => setUploadMethod('files')}
								className={`px-6 py-3 rounded-lg font-semibold transition-all ${uploadMethod === 'files'
									? 'bg-[#0d569e] text-white shadow-lg'
									: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
									}`}
							>
								Upload Analytics Files
							</button>
						</div>
					</div>

					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
							{error}
						</div>
					)}

					{uploadProgress && (
						<div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center">
							<svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
									fill="none"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{uploadProgress}
						</div>
					)}

					{uploadMethod === 'url' ? (
						<div className="mb-8">
							<label className="block text-sm font-semibold text-gray-700 mb-3">
								LinkedIn Profile URL
							</label>
							<input
								type="url"
								value={linkedinUrl}
								onChange={(e) => setLinkedinUrl(e.target.value)}
								placeholder="https://www.linkedin.com/in/your-profile"
								className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0d569e] focus:border-[#0d569e]"
								disabled={uploading}
							/>
							<p className="text-xs text-gray-500 mt-2">
								Enter your LinkedIn profile URL to automatically fetch your analytics data
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							<FileUploadBox type="followers" label="Followers Data" file={files.followers} />
							<FileUploadBox type="visitors" label="Visitors Data" file={files.visitors} />
							<FileUploadBox type="content" label="Content Data" file={files.content} />
						</div>
					)}

					<div className="flex justify-between items-center">
						<button
							type="button"
							onClick={() => navigate('/')}
							disabled={uploading}
							className="px-6 py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
						>
							Skip for now
						</button>
						<button
							type="submit"
							disabled={
								uploading ||
								(uploadMethod === 'files' &&
									(!files.followers || !files.visitors || !files.content)) ||
								(uploadMethod === 'url' && !linkedinUrl)
							}
							className="flex items-center justify-center rounded-xl bg-[#ff6700] px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#e55d00] focus:outline-none focus:ring-2 focus:ring-[#ff6700] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
						>
							{uploading ? (
								<>
									<svg
										className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									Uploading...
								</>
							) : (
								<>
									Upload & Continue
									<svg
										className="ml-2 w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 7l5 5m0 0l-5 5m5-5H6"
										/>
									</svg>
								</>
							)}
						</button>
					</div>
				</form>

				<p className="text-center text-sm text-gray-500 mt-6">
					Your data is encrypted and secure. We never share your information.
				</p>
			</div>
		</div>
	)
}

export default UploadData
