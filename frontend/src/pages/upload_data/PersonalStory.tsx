import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface PersonalStoryData {
    role: string;
    industry: string;
    seniority_level: string;
    company_size: string;
    interests: string[];
    content_topics: string[];
    job_description: string;
    career_goals: string;
    personal_story: string;
    content_tone: string;
    post_length_preference: string;
}

interface Choices {
    roles: string[];
    industries: string[];
    seniority_levels: string[];
    company_sizes: string[];
    interests: string[];
    content_topics: string[];
    content_tones: string[];
    post_length_preferences: string[];
}

export const PersonalStory: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [choices, setChoices] = useState<Choices | null>(null);
    const [formData, setFormData] = useState<PersonalStoryData>({
        role: '',
        industry: '',
        seniority_level: '',
        company_size: '',
        interests: [],
        content_topics: [],
        job_description: '',
        career_goals: '',
        personal_story: '',
        content_tone: '',
        post_length_preference: '',
    });

    useEffect(() => {
        fetchChoicesAndData();
    }, []);

    const fetchChoicesAndData = async () => {
        try {
            setLoading(true);

            // Fetch choices
            const choicesResponse = await api.get('/personal-story/choices/');
            if (choicesResponse.data.success) {
                setChoices(choicesResponse.data.data);
            }

            // Fetch existing personal story if any
            const storyResponse = await api.get('/personal-story/');
            if (storyResponse.data.success && storyResponse.data.data) {
                setFormData(storyResponse.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setSaving(true);
            const response = await api.post('/personal-story/', formData);

            if (response.data.success) {
                // Navigate to onboarding after successful save
                navigate('/onboarding');
            }
        } catch (error: any) {
            console.error('Error saving personal story:', error);
            alert(error.response?.data?.error || 'Failed to save personal story');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        // Skip to onboarding
        navigate('/onboarding');
    };

    const toggleArrayItem = (field: 'interests' | 'content_topics', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d569e]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h1>
                    <p className="text-lg text-gray-600">
                        Help us personalize your LinkedIn content recommendations
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Professional Information Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="bg-[#0d569e] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
                                Professional Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent"
                                    >
                                        <option value="">Select your role</option>
                                        {choices?.roles.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Industry */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Industry <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent"
                                    >
                                        <option value="">Select your industry</option>
                                        {choices?.industries.map((industry) => (
                                            <option key={industry} value={industry}>{industry}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Seniority Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Seniority Level
                                    </label>
                                    <select
                                        value={formData.seniority_level}
                                        onChange={(e) => setFormData({ ...formData, seniority_level: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent"
                                    >
                                        <option value="">Select seniority level</option>
                                        {choices?.seniority_levels.map((level) => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Company Size */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Company Size
                                    </label>
                                    <select
                                        value={formData.company_size}
                                        onChange={(e) => setFormData({ ...formData, company_size: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent"
                                    >
                                        <option value="">Select company size</option>
                                        {choices?.company_sizes.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Interests Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="bg-[#0d569e] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
                                Interests & Topics
                            </h2>

                            {/* Interests */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    What are you interested in? (Select all that apply)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {choices?.interests.map((interest) => (
                                        <button
                                            key={interest}
                                            type="button"
                                            onClick={() => toggleArrayItem('interests', interest)}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${formData.interests.includes(interest)
                                                ? 'bg-[#0d569e] border-[#0d569e] text-white'
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-[#0d569e]'
                                                }`}
                                        >
                                            {interest}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Topics */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    What content topics do you want to see? (Select all that apply)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {choices?.content_topics.map((topic) => (
                                        <button
                                            key={topic}
                                            type="button"
                                            onClick={() => toggleArrayItem('content_topics', topic)}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${formData.content_topics.includes(topic)
                                                ? 'bg-[#0d569e] border-[#0d569e] text-white'
                                                : 'bg-white border-gray-300 text-gray-700 hover:border-[#0d569e]'
                                                }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Your Story Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="bg-[#0d569e] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
                                Your Story
                            </h2>

                            <div className="space-y-6">
                                {/* Job Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What do you do day-to-day?
                                    </label>
                                    <textarea
                                        value={formData.job_description}
                                        onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe your typical work activities..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Career Goals */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        What are your career goals?
                                    </label>
                                    <textarea
                                        value={formData.career_goals}
                                        onChange={(e) => setFormData({ ...formData, career_goals: e.target.value })}
                                        rows={3}
                                        placeholder="What are you working towards in your career?"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent resize-none"
                                    />
                                </div>

                                {/* Personal Story */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your unique story
                                    </label>
                                    <textarea
                                        value={formData.personal_story}
                                        onChange={(e) => setFormData({ ...formData, personal_story: e.target.value })}
                                        rows={4}
                                        placeholder="Share your professional journey, challenges overcome, or what makes you unique..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Preferences Section */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                                <span className="bg-[#0d569e] text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
                                Content Preferences
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Content Tone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preferred Content Tone
                                    </label>
                                    <select
                                        value={formData.content_tone}
                                        onChange={(e) => setFormData({ ...formData, content_tone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent"
                                    >
                                        <option value="">Select tone</option>
                                        {choices?.content_tones.map((tone) => (
                                            <option key={tone} value={tone}>{tone}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Post Length Preference */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preferred Post Length
                                    </label>
                                    <select
                                        value={formData.post_length_preference}
                                        onChange={(e) => setFormData({ ...formData, post_length_preference: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent"
                                    >
                                        <option value="">Select length</option>
                                        {choices?.post_length_preferences.map((length) => (
                                            <option key={length} value={length}>{length}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                            >
                                Skip for now
                            </button>

                            <button
                                type="submit"
                                disabled={saving || !formData.role || !formData.industry}
                                className="px-8 py-3 bg-[#ff6700] text-white font-semibold rounded-lg hover:bg-[#e55d00] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <span>Save & Continue</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700">
                                This information helps us find the most relevant viral LinkedIn posts for you. You can update this anytime from your profile settings.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
