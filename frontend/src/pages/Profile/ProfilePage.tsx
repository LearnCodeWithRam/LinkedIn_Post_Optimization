import { useAppSelector } from '@/store';
import { UserIcon, EnvelopeIcon, BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();

    // Get user data from localStorage
    const user = React.useMemo(() => {
        try {
            const userData = localStorage.getItem('user');
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }, []);

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No user data found. Please sign in.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 px-6 py-2 bg-[#0d569e] text-white rounded-lg hover:bg-[#0a4278]"
                    >
                        Sign In
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-[#0d569e] hover:text-[#0a4278] font-medium flex items-center space-x-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Profile Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-r from-[#0d569e] to-[#0a4278]"></div>

                    {/* Profile Info */}
                    <div className="relative px-6 pb-6">
                        {/* Profile Picture */}
                        <div className="flex justify-center -mt-16 mb-4">
                            {user.linkedin_profile_picture ? (
                                <img
                                    src={user.linkedin_profile_picture}
                                    alt={user.full_name || user.email}
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#0d569e] to-[#0a4278] flex items-center justify-center border-4 border-white shadow-xl">
                                    <span className="text-white font-bold text-4xl">
                                        {user.first_name?.[0] || user.email?.[0] || 'U'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Name and Title */}
                        <div className="text-center mb-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'}
                            </h1>
                            {user.title && (
                                <p className="text-lg text-gray-600">{user.title}</p>
                            )}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {/* Email */}
                            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                <EnvelopeIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-base text-gray-900 truncate">{user.email || 'Not provided'}</p>
                                </div>
                            </div>

                            {/* Username */}
                            {user.username && (
                                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                    <UserIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-500">Username</p>
                                        <p className="text-base text-gray-900">{user.username}</p>
                                    </div>
                                </div>
                            )}

                            {/* Role */}
                            {user.role && (
                                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                    <BriefcaseIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-500">Role</p>
                                        <p className="text-base text-gray-900 capitalize">{user.role}</p>
                                    </div>
                                </div>
                            )}

                            {/* Organization */}
                            {user.organization_name && (
                                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                    <BriefcaseIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-500">Organization</p>
                                        <p className="text-base text-gray-900">{user.organization_name}</p>
                                    </div>
                                </div>
                            )}

                            {/* Member Since */}
                            {user.created_at && (
                                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                    <CalendarIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-500">Member Since</p>
                                        <p className="text-base text-gray-900">
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* LinkedIn Connection Status */}
                        {user.is_linkedin_connected && (
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <svg className="w-6 h-6 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">LinkedIn Connected</p>
                                        <p className="text-xs text-blue-700">Your account is linked with LinkedIn</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-8 flex justify-center space-x-4">
                            <button
                                onClick={() => navigate('/settings')}
                                className="px-6 py-2 bg-[#0d569e] text-white font-medium rounded-lg hover:bg-[#0a4278] transition-colors"
                            >
                                Edit Profile
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
