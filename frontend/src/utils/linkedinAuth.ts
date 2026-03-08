/**
 * LinkedIn OAuth Helper with Session Cookie Support
 * 
 * IMPORTANT: All fetch requests include credentials: 'include' to send session cookies
 * This is required for OAuth state validation on the backend.
 */

const getApiBaseUrl = (): string => {
    return (import.meta as any).env?.VITE_API_URL || '/api';
};

/**
 * Initiate LinkedIn OAuth sign-in
 * Stores state in backend session via cookie
 */
export const initiateLinkedInSignIn = async (): Promise<string> => {
    const apiUrl = getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/accounts/linkedin/signin/`, {
        credentials: 'include',  // CRITICAL: Send cookies for session
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error(`Failed to initiate sign-in: ${response.statusText}`);
    }

    const data = await response.json();
    return data.auth_url;
};

/**
 * Handle LinkedIn OAuth callback
 * Validates state from backend session via cookie
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
    const apiUrl = getApiBaseUrl();
    const url = `${apiUrl}/api/v1/accounts/linkedin/signin/callback/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

    const response = await fetch(url, {
        credentials: 'include',  // CRITICAL: Send cookies for session validation
        method: 'GET',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Callback failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Store tokens
    if (data.tokens) {
        localStorage.setItem('authToken', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
    }

    return data;
};
