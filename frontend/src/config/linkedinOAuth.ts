/**
 * LinkedIn OAuth Configuration
 * 
 * This file provides helper functions for LinkedIn OAuth sign-in.
 * All URLs are constructed from the VITE_API_URL environment variable.
 */

// Get API base URL from environment variable
const getApiBaseUrl = (): string => {
    return (import.meta as any).env?.VITE_API_URL || '/api';
};

/**
 * LinkedIn OAuth Endpoints
 */
export const linkedInOAuthEndpoints = {
    /**
     * Initiate LinkedIn sign-in flow
     * GET /api/v1/accounts/linkedin/signin/
     * Returns: { auth_url: string }
     */
    signIn: `${getApiBaseUrl()}/api/v1/accounts/linkedin/signin/`,

    /**
     * Handle LinkedIn OAuth callback
     * GET /api/v1/accounts/linkedin/signin/callback/?code=...&state=...
     * Returns: { user, tokens, onboarding_completed, data_uploaded, is_new_user }
     */
    signInCallback: `${getApiBaseUrl()}/api/v1/accounts/linkedin/signin/callback/`,

    /**
     * Connect LinkedIn to existing account (requires authentication)
     * GET /api/v1/accounts/linkedin/connect/
     */
    connect: `${getApiBaseUrl()}/api/v1/accounts/linkedin/connect/`,

    /**
     * Disconnect LinkedIn from account (requires authentication)
     * POST /api/v1/accounts/linkedin/disconnect/
     */
    disconnect: `${getApiBaseUrl()}/api/v1/accounts/linkedin/disconnect/`,
};

/**
 * Initiate LinkedIn OAuth sign-in flow
 * 
 * @returns Promise with the LinkedIn authorization URL
 */
export const initiateLinkedInSignIn = async (): Promise<string> => {
    try {
        const response = await fetch(linkedInOAuthEndpoints.signIn);

        if (!response.ok) {
            throw new Error(`Failed to initiate LinkedIn sign-in: ${response.statusText}`);
        }

        const data = await response.json();
        return data.auth_url;
    } catch (error) {
        console.error('Error initiating LinkedIn sign-in:', error);
        throw error;
    }
};

/**
 * Handle LinkedIn OAuth callback
 * 
 * @param code - Authorization code from LinkedIn
 * @param state - State parameter for CSRF protection
 * @returns Promise with user data, tokens, and onboarding status
 */
export const handleLinkedInCallback = async (
    code: string,
    state: string
): Promise<{
    user: any;
    tokens: { access: string; refresh: string };
    onboarding_completed: boolean;
    data_uploaded: boolean;
    is_new_user: boolean;
}> => {
    try {
        const url = `${linkedInOAuthEndpoints.signInCallback}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `LinkedIn callback failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Store tokens in localStorage
        if (data.tokens) {
            localStorage.setItem('authToken', data.tokens.access);
            localStorage.setItem('refreshToken', data.tokens.refresh);
        }

        return data;
    } catch (error) {
        console.error('Error handling LinkedIn callback:', error);
        throw error;
    }
};

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { initiateLinkedInSignIn, handleLinkedInCallback } from '@/config/linkedinOAuth';
 * 
 * // Sign-in button handler
 * const handleLinkedInSignIn = async () => {
 *   try {
 *     const authUrl = await initiateLinkedInSignIn();
 *     window.location.href = authUrl; // Redirect to LinkedIn
 *   } catch (error) {
 *     console.error('Failed to initiate sign-in:', error);
 *   }
 * };
 * 
 * // Callback page handler
 * const handleCallback = async () => {
 *   const urlParams = new URLSearchParams(window.location.search);
 *   const code = urlParams.get('code');
 *   const state = urlParams.get('state');
 *   
 *   if (!code || !state) {
 *     // Handle error
 *     return;
 *   }
 *   
 *   try {
 *     const data = await handleLinkedInCallback(code, state);
 *     
 *     // Route based on onboarding status
 *     if (!data.onboarding_completed) {
 *       router.push('/onboarding');
 *     } else {
 *       router.push('/dashboard');
 *     }
 *   } catch (error) {
 *     console.error('Callback failed:', error);
 *   }
 * };
 * ```
 */
