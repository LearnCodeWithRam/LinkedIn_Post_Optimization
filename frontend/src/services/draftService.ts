import api from './api';

export interface DraftPost {
    id: string;
    content: string;
    media_files?: {
        type: string;
        url: string;
        name?: string;
    }[];
    status: 'draft' | 'published';
    scheduled_time?: string;
    poll_data?: {
        question: string;
        options: string[];
    };
    published_at?: string;
    created_at: string;
    updated_at: string;
}

export interface SaveDraftRequest {
    draft_id?: string;
    content: string;
    media_files?: any[];
    scheduled_time?: string;
    poll_data?: any;
}

class DraftService {
    /**
     * Save a new draft or update an existing one
     */
    async saveDraft(data: SaveDraftRequest): Promise<{ success: boolean; draft: DraftPost; message: string }> {
        try {
            const response = await api.post('/new_post/drafts/', data);
            return response.data;
        } catch (error: any) {
            console.error('Error saving draft:', error);
            throw error;
        }
    }

    /**
     * Get all drafts and published posts for the current user
     */
    async getDrafts(statusFilter: 'all' | 'draft' | 'published' = 'all'): Promise<{ success: boolean; posts: DraftPost[]; total_count: number }> {
        try {
            const response = await api.get(`/new_post/drafts/list/`, {
                params: { status: statusFilter }
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching drafts:', error);
            throw error;
        }
    }

    /**
     * Publish a draft post
     */
    async publishDraft(draftId: string): Promise<{ success: boolean; post: DraftPost; message: string }> {
        try {
            const response = await api.post(`/new_post/drafts/${draftId}/publish/`);
            return response.data;
        } catch (error: any) {
            console.error('Error publishing draft:', error);
            throw error;
        }
    }

    /**
     * Delete a draft post
     */
    async deleteDraft(draftId: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.delete(`/new_post/drafts/${draftId}/`);
            return response.data;
        } catch (error: any) {
            console.error('Error deleting draft:', error);
            throw error;
        }
    }
}

export const draftService = new DraftService();
