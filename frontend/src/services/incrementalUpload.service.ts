import api from './api'

export interface DateRange {
    start: string | null
    end: string | null
    range: string
}

export interface DateRangesResponse {
    success: boolean
    data: {
        followers: DateRange
        visitors: DateRange
        content: DateRange
    }
}

export interface MergeSummary {
    replaced: number
    added: number
    total: number
}

export interface DateAnalysis {
    existing_range: string
    new_range: string
    has_overlap: boolean
    is_extension: boolean
}

export interface IncrementalUploadResponse {
    success: boolean
    message: string
    data?: {
        log_id: string
        session_id: string
        date_analysis: {
            followers: DateAnalysis
            visitors: DateAnalysis
            content: DateAnalysis
        }
        merge_summary: {
            followers: MergeSummary
            visitors: MergeSummary
            content: MergeSummary
        }
        output_files: string[]
    }
    error?: string
}

export const getExistingDateRanges = async (): Promise<DateRangesResponse> => {
    const response = await api.get('/upload-excel/existing-date-ranges/')
    return response.data
}

export const uploadIncrementalExcelFiles = async (
    followersFile: File,
    visitorsFile: File,
    contentFile: File
): Promise<IncrementalUploadResponse> => {
    const formData = new FormData()
    formData.append('followers_file', followersFile)
    formData.append('visitors_file', visitorsFile)
    formData.append('content_file', contentFile)

    const response = await api.post('/upload-excel/upload-incremental/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })

    return response.data
}
