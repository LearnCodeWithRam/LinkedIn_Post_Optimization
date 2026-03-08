import { useNavigate } from 'react-router-dom';

interface User {
    full_name?: string;
    email?: string;
    profile_picture?: string;
}

export const useAuth = () => {
    const navigate = useNavigate();

    // Get user from localStorage
    const getUserFromStorage = (): User | null => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    };

    const user = getUserFromStorage();

    const logout = () => {
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to login
        navigate('/login');
    };

    return {
        user,
        logout,
        isAuthenticated: !!localStorage.getItem('authToken')
    };
};
