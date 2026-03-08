import { useAppDispatch } from '@/store';
import { logout } from '@/store/slices/authSlice';
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  LightBulbIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NewPostEditor from './new_post/New_post_editor';
import { Sidebar } from './sidebar';
import { AnalyzeTab } from './tabs/AnalyzeTab';
// import { IdeasTab } from './tabs/IdeasTab';
// import { PlanTab } from './tabs/PlanTab';
import { PostsTab } from './tabs/PostsTab';
import ViralPostTab from './tabs/ViralPostTab';

// type TabType = 'ideas' | 'plan' | 'analyze' | 'posts' | 'Viral Post';
type TabType =  'analyze' | 'posts' | 'Viral Post';
type MediaType = 'summary' | 'linkedin' | 'instagram' | 'facebook' | 'tiktok' | 'youtube';

interface Tab {
  id: TabType;
  name: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  // { id: 'ideas', name: 'Ideas', icon: LightBulbIcon },
  // { id: 'plan', name: 'Plan', icon: CalendarIcon },
  { id: 'analyze', name: 'Analyze', icon: ChartBarIcon },
  { id: 'posts', name: 'Posts', icon: DocumentTextIcon },
  { id: 'Viral Post', name: 'Viral Post', icon: DocumentTextIcon },
];

export const NewDashboard: React.FC = () => {
  // Load saved tab state from localStorage or use defaults
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('dashboard_active_tab');
    return (saved as TabType) || 'analyze';
  });

  const [selectedMedia, setSelectedMedia] = useState<MediaType>(() => {
    const saved = localStorage.getItem('dashboard_selected_media');
    return (saved as MediaType) || 'linkedin';
  });

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showNewPostEditor, setShowNewPostEditor] = useState(false);
  const [editPostData, setEditPostData] = useState<any>(null);

  // Get user data from localStorage
  const user = React.useMemo(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }, []);

  // Save tab state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('dashboard_active_tab', activeTab);
  }, [activeTab]);

  // Save media selection to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('dashboard_selected_media', selectedMedia);
  }, [selectedMedia]);

  // Listen for edit post events
  React.useEffect(() => {
    const handleOpenEditor = (event: any) => {
      const { postData } = event.detail;
      setEditPostData(postData);
      setShowNewPostEditor(true);
    };

    window.addEventListener('openPostEditor', handleOpenEditor);
    return () => {
      window.removeEventListener('openPostEditor', handleOpenEditor);
    };
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(logout());
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('onboarding_completed');
    navigate('/auth/login');
  };

  const handleMediaChange = (media: string) => {
    // Ignore coming soon features
    if (media === 'reports' || media === 'hashtag' || media === 'settings') {
      return;
    }
    setSelectedMedia(media as MediaType);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      // case 'ideas':
      //   return <IdeasTab />;
      // case 'plan':
      //   return <PlanTab />;
      case 'analyze':
        return <AnalyzeTab selectedMedia={selectedMedia} />;
      case 'posts':
        return <PostsTab selectedMedia={selectedMedia} />;
      case 'Viral Post':
        return <ViralPostTab />;
      default:
        return <AnalyzeTab selectedMedia={selectedMedia} />;
    }
  };

  return (
    <>
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#0d569e] to-[#0a4278] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Profile Information</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Profile Content */}
            <div className="p-6">
              {/* Profile Picture and Name */}
              <div className="flex flex-col items-center mb-6">
                {user?.linkedin_profile_picture ? (
                  <img
                    src={user.linkedin_profile_picture}
                    alt={user.full_name || user.email}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#0d569e] shadow-lg mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0d569e] to-[#0a4278] flex items-center justify-center border-4 border-white shadow-lg mb-4">
                    <span className="text-white font-bold text-3xl">
                      {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900">
                  {user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User'}
                </h3>
                {user?.title && (
                  <p className="text-gray-600 mt-1">{user.title}</p>
                )}
              </div>

              {/* Info Grid */}
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-base text-gray-900 break-all">{user?.email || 'Not provided'}</p>
                  </div>
                </div>

                {/* Username */}
                {user?.username && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <UserIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Username</p>
                      <p className="text-base text-gray-900">{user.username}</p>
                    </div>
                  </div>
                )}

                {/* Role */}
                {user?.role && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <p className="text-base text-gray-900 capitalize">{user.role}</p>
                    </div>
                  </div>
                )}

                {/* Organization */}
                {user?.organization_name && (
                  <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-[#0d569e] flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-500">Organization</p>
                      <p className="text-base text-gray-900">{user.organization_name}</p>
                    </div>
                  </div>
                )}

                {/* LinkedIn Connection Status */}
                {user?.is_linkedin_connected && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    navigate('/settings');
                  }}
                  className="px-6 py-2 bg-[#0d569e] text-white font-medium rounded-lg hover:bg-[#0a4278] transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Post Editor Modal - Moved to top level to avoid height constraints */}
      {showNewPostEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => {
                setShowNewPostEditor(false);
                setEditPostData(null); // Clear edit data when closing
              }}
              className="absolute top-4 right-4 z-[10000] p-2 bg-white hover:bg-gray-100 rounded-full shadow-lg"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6 text-gray-700" />
            </button>
            <div className="w-full h-full overflow-auto">
              <NewPostEditor editPostData={editPostData} />
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Sidebar activeTab={selectedMedia} onNavigate={handleMediaChange} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with Tabs */}
          <div className=" w-full bg-[#77838F]/30 backdrop-blur-sm border-b border-gray-200 ">
            <div className="px-3">
              <div className="flex items-center justify-between h-16">
                {/* Logo/Brand */}
                <div className="flex items-center space-x-3">
                  <img
                    src="/assets/feedisight-logo.png"
                    alt="FeediSight Logo"
                    className="w-20 h-20 rounded-lg object-contain"
                  />
                  {/* <h1 className="text-xl font-bold text-black">FeediSight</h1> */}
                </div>

                {/* Tabs Navigation */}
                <nav className="flex space-x-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                      flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                      ${isActive
                            ? 'text-[#0d569e] bg-[#0d569e]/10'
                            : 'text-gray-600 hover:text-black hover:bg-gray-50'
                          }
                    `}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#0d569e]' : 'text-gray-400'}`} />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <>
                    <button
                      onClick={() => setShowNewPostEditor(true)}
                      className="px-4 py-2 bg-[#ff6700] text-white font-semibold rounded-lg hover:bg-[#e55d00] transition-all duration-200 flex items-center space-x-2 shadow-sm"
                    >
                      <span>+</span>
                      <span>New Post</span>
                    </button>
                  </>

                  {/* Notification Icon */}
                  <button className="relative p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-all duration-200">
                    <BellIcon className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6700] rounded-full"></span>
                  </button>

                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                      {user?.linkedin_profile_picture ? (
                        <img
                          src={user.linkedin_profile_picture}
                          alt={user.full_name || user.email}
                          className="w-8 h-8 rounded-full object-cover border-2 border-[#0d569e]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0d569e] to-[#0a4278] flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.full_name || user?.first_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[120px]">
                          {user?.email || ''}
                        </p>
                      </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowProfileMenu(false)}
                        />

                        {/* Menu */}
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                          {/* User Info Header */}
                          <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                              {user?.linkedin_profile_picture ? (
                                <img
                                  src={user.linkedin_profile_picture}
                                  alt={user.full_name || user.email}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-[#0d569e]"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0d569e] to-[#0a4278] flex items-center justify-center">
                                  <span className="text-white font-bold text-lg">
                                    {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {user?.full_name || user?.first_name || 'User'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {user?.email || ''}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                setShowProfileModal(true);
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <UserIcon className="w-5 h-5 text-gray-400" />
                              <span>View Profile</span>
                            </button>

                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                navigate('/settings');
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                              <span>Settings</span>
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              onClick={() => {
                                setShowProfileMenu(false);
                                handleLogoutClick();
                              }}
                              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <ArrowRightOnRectangleIcon className="w-5 h-5" />
                              <span className="font-medium">Logout</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
