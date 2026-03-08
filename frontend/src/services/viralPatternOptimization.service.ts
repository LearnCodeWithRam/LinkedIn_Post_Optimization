import api from './api';

export interface ViralPatternOptimizationRequest {
    user_post_content: string;
    user_post_analysis: any;
    viral_post_content: string;
    viral_post_analysis: any;
    post_id?: string;
}

export interface ViralPatternOptimizationResponse {
    success: boolean;
    data: {
        optimized_post: string;
        improvements_made: string[];
        pattern_changes: {
            tone_shift: string;
            length_change: string;
            structure_adopted: string;
            hashtags_strategy: string;
        };
        original_length: number;
        optimized_length: number;
    };
    cached: boolean;
}

/**
 * Optimize user's post to match viral post patterns
 */
export const optimizeWithViralPattern = async (
    request: ViralPatternOptimizationRequest
): Promise<ViralPatternOptimizationResponse> => {
    try {
        const response = await api.post('/new_post/generate/optimized-with-viral-pattern/', request);
        return response.data;
    } catch (error: any) {
        console.error('Error in viral pattern optimization:', error);
        throw error;
    }
};
