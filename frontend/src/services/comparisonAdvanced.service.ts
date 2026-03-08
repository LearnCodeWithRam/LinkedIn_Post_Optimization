import api from './api';

export interface CompareWithAnalysisRequest {
    user_post_id?: string;
    user_post_content: string;
    viral_post_id?: string;
    viral_post_content: string;
    force_refresh?: boolean;
}

export interface CompareWithAnalysisResponse {
    success: boolean;
    message: string;
    user_post_analysis: any; // Full analysis data
    viral_post_analysis: any; // Full analysis data
    comparison_result: any; // Comparison data
    cached: {
        user_post_analysis: boolean;
        viral_post_analysis: boolean;
        comparison: boolean;
    };
    processing_time_ms: number;
}

/**
 * Advanced comparison endpoint that performs all analyses in parallel
 */
export const compareWithAnalysis = async (
    request: CompareWithAnalysisRequest
): Promise<CompareWithAnalysisResponse> => {
    try {
        const response = await api.post('/post-comparison/compare-with-analysis/', request);
        return response.data;
    } catch (error: any) {
        console.error('Error in compare with analysis:', error);
        throw error;
    }
};
