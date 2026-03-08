import React, { useState, useEffect } from 'react'
import { uploadIncrementalExcelFiles, getExistingDateRanges, DateRange, MergeSummary } from '@/services/incrementalUpload.service'

interface IncrementalUploadModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export const IncrementalUploadModal: React.FC<IncrementalUploadModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
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
    const [existingRanges, setExistingRanges] = useState<{
        followers: DateRange
        visitors: DateRange
        content: DateRange
    } | null>(null)
    const [loadingRanges, setLoadingRanges] = useState(false)
    const [uploadComplete, setUploadComplete] = useState(false)
    const [mergeSummary, setMergeSummary] = useState<{
        followers: MergeSummary
        visitors: MergeSummary
        content: MergeSummary
    } | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchExistingRanges()
        }
    }, [isOpen])

    const fetchExistingRanges = async () => {
        setLoadingRanges(true)
        try {
            const response = await getExistingDateRanges()
            if (response.success) {
                setExistingRanges(response.data)
            }
        } catch (err: any) {
            console.error('Error fetching date ranges:', err)
        } finally {
            setLoadingRanges(false)
        }
    }

    const validateFileName = (fileName: string, expectedType: 'followers' | 'visitors' | 'content'): { valid: boolean; error?: string } => {
        // Remove file extension for checking
        const nameWithoutExt = fileName.toLowerCase().replace(/\.(xlsx|xls)$/i, '')

        // Define keywords for each file type
        const fileTypeKeywords = {
            followers: ['follower', 'followers'],
            visitors: ['visitor', 'visitors'],
            content: ['content', 'post', 'posts']
        }

        // Check if filename contains the expected keyword
        const expectedKeywords = fileTypeKeywords[expectedType]
        const hasExpectedKeyword = expectedKeywords.some(keyword => nameWithoutExt.includes(keyword))

        if (!hasExpectedKeyword) {
            // Check if it contains keywords from other types
            const otherTypes = Object.keys(fileTypeKeywords).filter(t => t !== expectedType) as Array<'followers' | 'visitors' | 'content'>

            for (const otherType of otherTypes) {
                const otherKeywords = fileTypeKeywords[otherType]
                const hasOtherKeyword = otherKeywords.some(keyword => nameWithoutExt.includes(keyword))

                if (hasOtherKeyword) {
                    return {
                        valid: false,
                        error: `Wrong file! This appears to be a ${otherType} file. Please upload it in the ${otherType.toUpperCase()} slot instead.`
                    }
                }
            }

            // Generic error if no keywords found
            return {
                valid: false,
                error: `Cannot verify file type. Please ensure the filename contains "${expectedKeywords[0]}" for ${expectedType} data.`
            }
        }

        return { valid: true }
    }

    const handleFileChange = (type: 'followers' | 'visitors' | 'content', file: File | null) => {
        if (!file) {
            setFiles((prev) => ({ ...prev, [type]: file }))
            setError(null)
            return
        }

        // Validate filename matches the expected type
        const validationResult = validateFileName(file.name, type)

        if (!validationResult.valid) {
            setError(validationResult.error || 'Invalid file')
            // Don't set the file if validation fails
            return
        }

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
            setUploadProgress('Processing and merging data...')
            const response = await uploadIncrementalExcelFiles(
                files.followers!,
                files.visitors!,
                files.content!
            )

            if (response.success) {
                setUploadProgress('Data merged successfully!')
                setMergeSummary(response.data?.merge_summary || null)
                setUploadComplete(true)

                // Call onSuccess callback after a short delay
                setTimeout(() => {
                    if (onSuccess) onSuccess()
                }, 2000)
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

    const handleClose = () => {
        if (!uploading) {
            // Reset state
            setFiles({ followers: null, visitors: null, content: null })
            setError(null)
            setUploadProgress('')
            setUploadComplete(false)
            setMergeSummary(null)
            onClose()
        }
    }

    if (!isOpen) return null

    const FileUploadBox = ({
        type,
        label,
        file,
    }: {
        type: 'followers' | 'visitors' | 'content'
        label: string
        file: File | null
    }) => (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-[#0d569e] transition-all duration-200">
            <label className="block">
                <div className="flex flex-col items-center justify-center cursor-pointer">
                    <svg
                        className="w-10 h-10 text-gray-400 mb-2"
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
                    <span className="text-sm font-semibold text-gray-700 mb-1">{label}</span>
                    {file ? (
                        <span className="text-xs text-[#0d569e] font-medium">{file.name}</span>
                    ) : (
                        <span className="text-xs text-gray-500">Click to browse</span>
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
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose}></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Feed More Data</h2>
                            <p className="text-sm text-gray-600 mt-1">Upload additional LinkedIn analytics to merge with existing data</p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={uploading}
                            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
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
                            </h3>
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
                                    <span>Select the Date Range to filter <strong>Analytics</strong></span>
                                </li>
                                <li className="flex items-start">
                                    <span className="font-semibold mr-2 flex-shrink-0">Step 4:</span>
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
                                    <span className="font-semibold mr-2 flex-shrink-0">Step 5:</span>
                                    <span className="bg-yellow-100 px-2 py-1 rounded">
                                        <strong>IMPORTANT:</strong> Do NOT rename the downloaded files. Upload them with their <strong>original file names as it is</strong>
                                    </span>
                                </li>
                            </ol>
                        </div>

                        {/* Existing Date Ranges */}
                        {loadingRanges ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0d569e] mr-3"></div>
                                    <span className="text-sm text-blue-800">Loading existing date ranges...</span>
                                </div>
                            </div>
                        ) : existingRanges ? (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Existing Data Coverage
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Followers</div>
                                        <div className="text-sm font-semibold text-gray-900">{existingRanges.followers.range}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Visitors</div>
                                        <div className="text-sm font-semibold text-gray-900">{existingRanges.visitors.range}</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3">
                                        <div className="text-xs font-medium text-gray-500 mb-1">Content</div>
                                        <div className="text-sm font-semibold text-gray-900">{existingRanges.content.range}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-700 mt-3">
                                    💡 New data with overlapping dates will replace existing data. New date ranges will be added.
                                </p>
                            </div>
                        ) : null}

                        {/* Upload Complete Summary */}
                        {uploadComplete && mergeSummary ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                                <div className="flex items-center mb-4">
                                    <svg className="w-6 h-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h3 className="text-lg font-bold text-green-900">Data Merged Successfully!</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.entries(mergeSummary).map(([type, summary]) => (
                                        <div key={type} className="bg-white rounded-lg p-4">
                                            <div className="text-sm font-semibold text-gray-700 mb-2 capitalize">{type}</div>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Replaced:</span>
                                                    <span className="font-semibold text-orange-600">{summary.replaced}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Added:</span>
                                                    <span className="font-semibold text-green-600">{summary.added}</span>
                                                </div>
                                                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                                                    <span className="text-gray-700 font-medium">Total:</span>
                                                    <span className="font-bold text-gray-900">{summary.total}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Upload Progress */}
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

                        {/* File Upload Form */}
                        {!uploadComplete && (
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <FileUploadBox type="followers" label="Followers Data" file={files.followers} />
                                    <FileUploadBox type="visitors" label="Visitors Data" file={files.visitors} />
                                    <FileUploadBox type="content" label="Content Data" file={files.content} />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={uploading}
                                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={uploading || !files.followers || !files.visitors || !files.content}
                                        className="px-6 py-2.5 bg-[#ff6700] text-white font-semibold rounded-lg hover:bg-[#e55d00] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {uploading ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                                            'Upload & Merge Data'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Close button after success */}
                        {uploadComplete && (
                            <div className="flex justify-end">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2.5 bg-[#0d569e] text-white font-semibold rounded-lg hover:bg-[#0a4580] transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default IncrementalUploadModal
