import api from './api';

export interface OnboardingStatus {
    onboarding_completed: boolean;
    data_uploaded: boolean;
    needs_onboarding: boolean;
    needs_data_upload: boolean;
    onboarding_completed_at: string | null;
    data_uploaded_at: string | null;
}

/**
 * Get the current user's onboarding status from the server
 */
export const getOnboardingStatus = async (): Promise<OnboardingStatus> => {
    try {
        const response = await api.get('/accounts/onboarding-status/');
        return response.data;
    } catch (error: any) {
        console.error('Error fetching onboarding status:', error);
        throw error;
    }
};

/**
 * Mark onboarding as completed for the current user
 */
export const completeOnboarding = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.post('/accounts/complete-onboarding/');
        return response.data;
    } catch (error: any) {
        console.error('Error completing onboarding:', error);
        throw error;
    }
};

/**
 * Mark data upload as completed for the current user
 */
export const markDataUploaded = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await api.post('/accounts/mark-data-uploaded/');
        return response.data;
    } catch (error: any) {
        console.error('Error marking data uploaded:', error);
        throw error;
    }
};
