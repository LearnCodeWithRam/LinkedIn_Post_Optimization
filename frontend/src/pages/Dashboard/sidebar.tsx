import UsersIcon from '@heroicons/react/16/solid/UsersIcon';
import ChartBarIcon from '@heroicons/react/24/outline/ChartBarIcon';
import ClipboardDocumentListIcon from '@heroicons/react/24/outline/ClipboardDocumentListIcon';
import Cog6ToothIcon from '@heroicons/react/24/outline/Cog6ToothIcon';
import DocumentChartBarIcon from '@heroicons/react/24/outline/DocumentChartBarIcon';
import HashtagIcon from '@heroicons/react/24/outline/HashtagIcon';
import PhotoIcon from '@heroicons/react/24/outline/PhotoIcon';
import PlusCircleIcon from '@heroicons/react/24/outline/PlusCircleIcon';
import VideoCameraIcon from '@heroicons/react/24/outline/VideoCameraIcon';
import React from 'react';

interface SidebarProps {
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: {
    type: 'premium' | 'add';
  };
  isActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab = 'linkedin', onNavigate }) => {
  const mainNavItems: NavItem[] = [
    // { id: 'summary', label: 'Social Media Summary', icon: ClipboardDocumentListIcon },
    { id: 'linkedin', label: 'LinkedIn', icon: ChartBarIcon, badge: { type: 'premium' } },
    // { id: 'instagram', label: 'Instagram', icon: PhotoIcon, badge: { type: 'add' } },
    // { id: 'facebook', label: 'Facebook', icon: UsersIcon, badge: { type: 'add' } },
    // { id: 'tiktok', label: 'TikTok', icon: VideoCameraIcon, badge: { type: 'add' } },
    // { id: 'youtube', label: 'YouTube', icon: VideoCameraIcon, badge: { type: 'add' } },
  ];

  // const bottomNavItems: NavItem[] = [
  //   { id: 'reports', label: 'Reports', icon: DocumentChartBarIcon },
  //   { id: 'hashtag', label: 'Hashtag Tracker', icon: HashtagIcon },
  //   { id: 'settings', label: 'Brand settings', icon: Cog6ToothIcon },
  // ];

  const handleItemClick = (id: string) => {
    // Show coming soon alert for these features
    if (id === 'reports' || id === 'hashtag' || id === 'settings') {
      alert('Coming Soon! 🚀\n\nThis feature is currently under development and will be available soon.');
      return;
    }

    if (onNavigate) {
      onNavigate(id);
    }
  };

  const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = activeTab === item.id;

    return (
      <button
        onClick={() => handleItemClick(item.id)}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-lg
          transition-all duration-200 group
          ${isActive
            ? 'bg-[#0d569e] text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-100'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
          <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}>
            {item.label}
          </span>
        </div>

        {item.badge && (
          <div className="flex items-center">
            {item.badge.type === 'premium' ? (
              <div className="relative w-6 h-6">
                <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-[#0a4278]' : 'bg-[#0d569e]/10'}`} />
                <svg className={`absolute inset-0 w-6 h-6 ${isActive ? 'text-[#4a9eff]' : 'text-[#0d569e]'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            ) : (
              <PlusCircleIcon className="w-5 h-5 text-gray-400 opacity-50" />
            )}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#77838F]/30 backdrop-blur-sm border-r border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-lg font-semibold">Social Media Summary</h2>
      </div>
      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItemComponent key={item.id} item={item} />
          ))}
        </nav>

        {/* More Connections Button */}
        <div className="mt-6 px-1">
          <button className="w-full bg-[#ff6700] text-white rounded-lg py-2.5 px-4 hover:bg-[#e55d00] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center space-x-2">
            <PlusCircleIcon className="w-5 h-5" />
            <span className="text-sm font-medium">More connections</span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="px-3">
        <div className="border-t border-gray-200" />
      </div>

      {/* Bottom Navigation */}
      <div className="px-3 py-4">
        {/* <nav className="space-y-1">
          {bottomNavItems.map((item) => (
            <NavItemComponent key={item.id} item={item} />
          ))}
        </nav> */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold">Powered by - <br /> FeediSight For professionals!</h2>
        </div>

      </div>
    </div>
  );
};