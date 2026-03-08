import api from './api'

export interface UploadResponse {
	success: boolean
	message: string
	data?: {
		log_id: number
		session_id: string
		output_files: {
			followers: string
			visitors: string
			content: string
		}
		records_count: {
			followers: number
			visitors: number
			content: number
		}
		db_records_saved: {
			followers: number
			visitors: number
			content: number
		}
	}
	error?: string
}

export const uploadExcelFiles = async (
	followersFile: File,
	visitorsFile: File,
	contentFile: File
): Promise<UploadResponse> => {
	const formData = new FormData()
	formData.append('followers_file', followersFile)
	formData.append('visitors_file', visitorsFile)
	formData.append('content_file', contentFile)

	const response = await api.post('/upload-excel/upload/', formData, {
		headers: {
			'Content-Type': 'multipart/form-data',
		},
	})

	return response.data
}

export const getUploadLogs = async () => {
	const response = await api.get('/upload-excel/logs/')
	return response.data
}

export const getUploadLogDetail = async (logId: number) => {
	const response = await api.get(`/upload-excel/logs/${logId}/`)
	return response.data
}
