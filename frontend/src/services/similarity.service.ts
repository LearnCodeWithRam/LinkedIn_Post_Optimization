import api from './api';

export interface SimilarViralPost {
    post_id: string;
    similarity_score: number;
    label: string;
    post_content: string;
    author_name: string;
    likes: string;
    comments?: number;
    shares?: number;
    linkedin_url: string;
    time_posted?: string;
    profile_image_url?: string;
    post_image_url?: string;
}

export interface SimilarityResponse {
    success: boolean;
    query_text: string;
    recommendations: SimilarViralPost[];
    total_found: number;
    keywords?: string[];
    search_query?: string;
}

export interface IndexStats {
    total_posts: number;
    embedding_dimension: number;
    model_name: string;
    index_exists: boolean;
    metadata_exists: boolean;
}

/**
 * Find similar viral posts to a given post content
 */
export const findSimilarPosts = async (
    postContent: string,
    topK: number = 3
): Promise<SimilarityResponse> => {
    try {
        const response = await api.post('/check-similarity/find-similar/', {
            post_content: postContent,
            top_k: topK,
        });
        return response.data;
    } catch (error: any) {
        console.error('Error finding similar posts:', error);
        throw error;
    }
};

/**
 * Rebuild the vector index (admin function)
 */
export const rebuildVectorIndex = async (): Promise<{ success: boolean; message: string; stats: IndexStats }> => {
    try {
        const response = await api.post('/check-similarity/rebuild-index/');
        return response.data;
    } catch (error: any) {
        console.error('Error rebuilding index:', error);
        throw error;
    }
};

/**
 * Get vector index statistics
 */
export const getIndexStats = async (): Promise<IndexStats> => {
    try {
        const response = await api.get('/check-similarity/index-stats/');
        return response.data;
    } catch (error: any) {
        console.error('Error getting index stats:', error);
        throw error;
    }
};
