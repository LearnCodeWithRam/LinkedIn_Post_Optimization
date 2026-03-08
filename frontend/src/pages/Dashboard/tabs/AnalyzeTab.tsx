import { VisitorDemographics } from '@/components/analytics/VisitorDemographics';
import api from '@/services/api';
import { UserGroupIcon } from '@heroicons/react/16/solid';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  HeartIcon,
  PaperAirplaneIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PostAnalysisView } from './PostAnalysisView';
import { IncrementalUploadModal } from '@/components/IncrementalUploadModal';

interface Summary {
  total_impressions: number;
  // followers_change: number;
  total_unique_impressions: number;
  impressions_change: number;
  total_likes: number;
  likes_change: number;
  total_comments: number;
  comments_change: number;
  total_shares: number;
  shares_change: number;
}

interface totalFollowers {
  totalFollowers: number;
  // followers_change: number;

}

interface Post {
  id: string;
  title: string;
  description: string;
  date: string;
  publish_time: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  reactions_comments_shares: number;
  total_clicks: number;
  photo_clicks: number;
  other_clicks: number;
  total_engagement: number;
  permalink: string;
  post_type: string;
  page_name: string;
}

interface AnalyticsData {
  summary: Summary;
  totalFollowers: totalFollowers;
  posts: Post[];
  total_posts: number;
  engagementTrends?: any[];
  followerTrends?: any[];
}

type SubTab = 'list' | 'details';

interface AnalyzeTabProps {
  selectedMedia?: string;
}

export const AnalyzeTab: React.FC<AnalyzeTabProps> = ({ selectedMedia = 'linkedin' }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('list');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [visitorMetrics, setVisitorMetrics] = useState<any[]>([]);
  const [isCached, setIsCached] = useState(false);
  const [showIncrementalUpload, setShowIncrementalUpload] = useState(false);

  // Cache configuration
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  const CACHE_KEY_PREFIX = 'analytics_cache_';

  // Generate cache key based on filters
  const getCacheKey = () => {
    return `${CACHE_KEY_PREFIX}${selectedMedia}_${startDate || 'all'}_${endDate || 'all'}`;
  };

  // Check if cached data is still valid
  const getCachedData = (): AnalyticsData | null => {
    try {
      const cacheKey = getCacheKey();
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is still valid (within 5 minutes)
      if (now - timestamp < CACHE_DURATION) {
        console.log('✓ Using cached analytics data');
        setIsCached(true);
        return data;
      } else {
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
        return null;
      }
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  };

  // Save data to cache
  const setCachedData = (data: AnalyticsData) => {
    try {
      const cacheKey = getCacheKey();
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      console.log('✓ Cached analytics data');
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const handleViewDetails = (post: Post) => {
    setSelectedPost(post);
    setActiveSubTab('details');
  };

  const handleBackToList = () => {
    setActiveSubTab('list');
    setSelectedPost(null);
  };

  const handleIncrementalUploadSuccess = () => {
    // Refresh analytics data after successful upload
    fetchAnalytics();
    setShowIncrementalUpload(false);
  };

  // Initialize default 3-month date range on mount
  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(today.getDate() - 90);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const defaultStartDate = formatDate(threeMonthsAgo);
    const defaultEndDate = formatDate(today);

    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setTempStartDate(defaultStartDate);
    setTempEndDate(defaultEndDate);
  }, []); // Run only once on mount

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMedia, startDate, endDate]); // Refetch when media or dates change

  // Convert YYYY-MM-DD to MM/DD/YYYY
  const convertToUSDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setIsCached(false);

      // Check cache first
      const cachedData = getCachedData();
      if (cachedData) {
        setAnalyticsData(cachedData);
        setError(null);
        setLoading(false);
        return;
      }

      // Use new MongoDB-based endpoints for LinkedIn
      if (selectedMedia === 'linkedin') {
        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) {
          params.append('start_date', startDate);
        }
        if (endDate) {
          params.append('end_date', endDate);
        }

        // Fetch from MongoDB dashboard endpoint with date filters
        const url = `/analytics/dashboard${params.toString() ? '?' + params.toString() : ''}`;
        console.log('📊 Fetching dashboard data from:', url);
        const response = await api.get(url);

        // Transform MongoDB response to match expected format
        const mongoData = response.data.data || response.data;
        const summary = mongoData.summary || {};
        const topPosts = mongoData.topPosts || [];
        const totalFollowers = mongoData.totalFollowers || {};
        const engagementTrends = mongoData.engagementTrends || [];
        const followerTrends = mongoData.followerTrends || [];

        // Convert MongoDB format to expected AnalyticsData format
        const transformedData: AnalyticsData = {
          summary: {
            total_impressions: summary.totalImpressions || 0,
            total_unique_impressions: summary.totalUniqueImpressions || 0,
            impressions_change: summary.impressionsChange || 0,
            total_likes: summary.totalLikes || summary.totalReactions || 0,
            likes_change: summary.reactionsChange || 0,
            total_comments: summary.totalComments || 0,
            comments_change: summary.commentsChange || 0,
            total_shares: summary.totalShares || summary.totalReposts || 0,
            shares_change: 0,

          },

          totalFollowers: {

            totalFollowers: totalFollowers.totalFollowers || 0,
          },

          posts: topPosts.map((post: any) => ({
            id: post.id || '',
            title: post.post_title || '',
            description: post.content || '',
            date: post.date || '',
            publish_time: post.date || '',
            impressions: post.impressions || 0,
            likes: post.likes || 0,
            comments: post.comments || 0,
            shares: post.reposts || 0,
            reactions_comments_shares: (post.likes || 0) + (post.comments || 0) + (post.reposts || 0),
            total_clicks: post.clicks || 0,
            photo_clicks: 0,
            other_clicks: 0,
            total_engagement: post.total_engagement || 0,
            permalink: post.post_link || '',
            post_type: post.post_type || '',
            page_name: '',
          })),
          total_posts: topPosts.length,
          engagementTrends,
          followerTrends,
        };

        // Cache the transformed data
        setCachedData(transformedData);
        setAnalyticsData(transformedData);
        setError(null);

        // Fetch visitor metrics
        await fetchVisitorMetrics();
      } else {
        // For other media types, use the old endpoint (if exists)
        const params = new URLSearchParams();

        if (startDate) {
          const formattedStart = convertToUSDate(startDate);
          params.append('start_date', formattedStart);
        }
        if (endDate) {
          const formattedEnd = convertToUSDate(endDate);
          params.append('end_date', formattedEnd);
        }

        const endpoint = `/analytics/${selectedMedia}-analytics/`;
        const url = `${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
        console.log('Fetching:', url, 'for media:', selectedMedia);

        const response = await api.get(url);
        const data = response.data;

        // Cache the data
        setCachedData(data);
        setAnalyticsData(data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || err.message || 'Failed to fetch analytics. Please upload LinkedIn analytics files first.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowDatePicker(false);
  };

  const handleClearFilter = () => {
    // Reset to default 3-month range
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(today.getDate() - 90);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const defaultStartDate = formatDate(threeMonthsAgo);
    const defaultEndDate = formatDate(today);

    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setTempStartDate(defaultStartDate);
    setTempEndDate(defaultEndDate);
    setShowDatePicker(false);
  };

  const handleOpenDatePicker = () => {
    // Sync temp dates with current dates when opening
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowDatePicker(true);
  };

  const fetchVisitorMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      const url = `/analytics/visitors${params.toString() ? '?' + params.toString() : ''}`;
      console.log('Fetching visitor metrics from:', url);
      const response = await api.get(url);
      console.log('Visitor metrics response:', response.data);

      if (response.data.success) {
        const metrics = response.data.data.metrics || [];
        console.log('Setting visitor metrics:', metrics.length, 'records');
        setVisitorMetrics(metrics);
      } else {
        console.warn('Visitor metrics fetch unsuccessful:', response.data);
        setVisitorMetrics([]);
      }
    } catch (err: any) {
      console.error('Error fetching visitor metrics:', err);
      console.error('Error details:', err.response?.data);
      setVisitorMetrics([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d569e]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Failed to load analytics</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchAnalytics}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  const { summary, posts } = analyticsData;
  const StatCard = ({
    icon: Icon,
    title,
    value,
    change,
    iconBg,
    iconColor
  }: {
    icon: React.ElementType;
    title: string;
    value: number;
    change: number;
    iconBg: string;
    iconColor: string;
  }) => {
    const isPositive = change >= 0;
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <div className={`flex items-center text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change).toFixed(2)}%
              </div>
            </div>
          </div>
          <div className={`${iconBg} p-4 rounded-xl`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </div>
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDateDisplay = () => {
    if (!startDate && !endDate) return 'Select date range';
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    return 'Select date range';
  };


  // Transform engagement trends data for charts
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Growth Chart Data - from engagement trends
  const growthChartData = analyticsData?.engagementTrends?.map((trend: any) => ({
    date: formatDate(trend.date),
    followers: analyticsData.totalFollowers?.totalFollowers || 0,
    pageViews: 0, // Not available in current data
    content: posts.length,
  })) || [];

  // Followers Balance Data - from follower trends
  const followersBalanceData = analyticsData?.followerTrends?.map((trend: any) => ({
    date: formatDate(trend.date),
    gained: trend.organicFollowers + trend.sponsoredFollowers,
    lost: 0, // Not available in current data
  })) || [];

  // Account Activity Data - from engagement trends
  const accountActivityData = analyticsData?.engagementTrends?.map((trend: any) => ({
    date: formatDate(trend.date),
    impressions: trend.impressions || 0,
    reactions: trend.reactions || 0,
    comments: trend.comments || 0,
    shares: trend.shares || 0,
    clicks: trend.clicks || 0,
  })) || [];

  // Posts Summary Data - from engagement trends
  const postsSummaryData = analyticsData?.engagementTrends?.map((trend: any) => ({
    date: formatDate(trend.date),
    engagement: trend.engagementRate || 0,
    interactions: (trend.reactions || 0) + (trend.comments || 0) + (trend.shares || 0),
    impressions: trend.impressions || 0,
    posts: posts.length,
  })) || [];

  // Interactions Data - from engagement trends
  const interactionsData = analyticsData?.engagementTrends?.map((trend: any) => ({
    date: formatDate(trend.date),
    reactions: trend.reactions || 0,
    comments: trend.comments || 0,
    clicks: trend.clicks || 0,
    shares: trend.shares || 0,
  })) || [];

  // Visitor Metrics Data - from visitor API
  const visitorMetricsChartData = visitorMetrics.map((metric: any) => ({
    date: formatDate(metric.date),
    pageViewsDesktop: metric.pageViewsDesktop || 0,
    pageViewsMobile: metric.pageViewsMobile || 0,
    pageViewsTotal: metric.pageViewsTotal || 0,
    uniqueVisitorsDesktop: metric.uniqueVisitorsDesktop || 0,
    uniqueVisitorsMobile: metric.uniqueVisitorsMobile || 0,
    uniqueVisitorsTotal: metric.uniqueVisitorsTotal || 0,
  }));

  // Calculate visitor totals
  const visitorTotals = {
    totalPageViews: visitorMetrics.reduce((sum, m) => sum + (m.pageViewsTotal || 0), 0),
    totalUniqueVisitors: visitorMetrics.reduce((sum, m) => sum + (m.uniqueVisitorsTotal || 0), 0),
    avgPageViewsPerDay: visitorMetrics.length > 0
      ? (visitorMetrics.reduce((sum, m) => sum + (m.pageViewsTotal || 0), 0) / visitorMetrics.length).toFixed(2)
      : '0',
    avgVisitorsPerDay: visitorMetrics.length > 0
      ? (visitorMetrics.reduce((sum, m) => sum + (m.uniqueVisitorsTotal || 0), 0) / visitorMetrics.length).toFixed(2)
      : '0',
  };

  // Calculate analytics metrics
  const calculateMetrics = () => {
    const trends = analyticsData?.engagementTrends || [];
    const followerTrends = analyticsData?.followerTrends || [];
    const numDays = trends.length || 1;
    const totalFollowers = analyticsData?.totalFollowers?.totalFollowers || 0;
    const totalPosts = posts.length || 1;

    // Calculate totals from trends
    const totalImpressions = trends.reduce((sum, t) => sum + (t.impressions || 0), 0);
    const totalReactions = trends.reduce((sum, t) => sum + (t.reactions || 0), 0);
    const totalComments = trends.reduce((sum, t) => sum + (t.comments || 0), 0);
    const totalShares = trends.reduce((sum, t) => sum + (t.shares || 0), 0);
    const totalClicks = trends.reduce((sum, t) => sum + (t.clicks || 0), 0);
    const totalNewFollowers = followerTrends.reduce((sum, t) => sum + (t.organicFollowers || 0) + (t.sponsoredFollowers || 0), 0);

    // Calculate averages and rates
    const avgEngagement = trends.length > 0
      ? (trends.reduce((sum, t) => sum + (t.engagementRate || 0), 0) / trends.length).toFixed(2)
      : '0.00';

    const totalInteractions = totalReactions + totalComments + totalShares;

    const dailyReactions = numDays > 0 ? (totalReactions / numDays).toFixed(2) : '0.00';
    const reactionsPerPost = totalPosts > 0 ? (totalReactions / totalPosts).toFixed(2) : '0.00';
    const dailyComments = numDays > 0 ? (totalComments / numDays).toFixed(2) : '0.00';
    const commentsPerPost = totalPosts > 0 ? (totalComments / totalPosts).toFixed(2) : '0.00';
    const dailyClicks = numDays > 0 ? (totalClicks / numDays).toFixed(2) : '0.00';
    const clicksPerPost = totalPosts > 0 ? (totalClicks / totalPosts).toFixed(2) : '0.00';
    const dailyFollowers = numDays > 0 ? (totalNewFollowers / numDays).toFixed(2) : '0.00';
    const followersPerPost = totalPosts > 0 ? (totalNewFollowers / totalPosts).toFixed(2) : '0.00';
    const dailyPosts = numDays > 0 ? (totalPosts / numDays).toFixed(2) : '0.00';

    return {
      totalImpressions,
      totalReactions,
      totalComments,
      totalShares,
      totalClicks,
      totalFollowers,
      totalNewFollowers,
      totalInteractions,
      avgEngagement,
      dailyReactions,
      reactionsPerPost,
      dailyComments,
      commentsPerPost,
      dailyClicks,
      clicksPerPost,
      dailyFollowers,
      followersPerPost,
      dailyPosts,
      hasData: trends.length > 0
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Content based on active sub-tab */}
      {activeSubTab === 'list' ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Track and Analyze your posts performance</h2>
              {isCached && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  ⚡ Cached
                </span>
              )}
            </div>
            <div className="flex items-center space-x-8">
              {/* Feed More Data Button */}
              <button
                onClick={() => setShowIncrementalUpload(true)}
                className="px-4 py-2 bg-[#ff6700] text-white font-semibold rounded-lg hover:bg-[#e55d00] transition-all duration-200 flex items-center space-x-2 shadow-sm"
              >
                + Feed More Data
              </button>
              {/* <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200">

              </div> */}

              {/* Enhanced Date Range Filter */}
              <div className="relative">
                <button
                  onClick={handleOpenDatePicker}
                  className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-700">{formatDateDisplay()}</span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Date Picker Popup */}
                {showDatePicker && (
                  <>
                    {/* Backdrop - only captures clicks, doesn't block pointer events */}
                    <div
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setShowDatePicker(false)}
                      style={{ pointerEvents: 'auto' }}
                    ></div>

                    <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-w-[400px]" style={{ pointerEvents: 'auto' }}>
                      <div className="p-4 space-y-4">
                        {/* Custom Date Range */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Select Date Range</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                              <input
                                type="date"
                                value={tempStartDate}
                                onChange={(e) => setTempStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">End Date</label>
                              <input
                                type="date"
                                value={tempEndDate}
                                onChange={(e) => setTempEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d569e] focus:border-transparent text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 pt-2">
                          <button
                            onClick={handleDateFilter}
                            className="flex-1 px-3 py-2 bg-[#ff6700] text-white rounded-lg hover:bg-[#e55d00] transition-colors font-medium text-sm"
                          >
                            Apply
                          </button>
                          <button
                            onClick={handleClearFilter}
                            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={EyeIcon}
              title="Total Impressions"
              value={summary.total_impressions}
              change={summary.impressions_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
            <StatCard
              icon={UserGroupIcon}
              title="Total Unique Impression"
              value={summary.total_unique_impressions}
              change={summary.impressions_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
            <StatCard
              icon={UserGroupIcon}
              title="Total Follower"
              value={analyticsData.totalFollowers.totalFollowers}
              change={summary.impressions_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
            <StatCard
              icon={PaperAirplaneIcon}
              title="Total Posts"
              value={posts.length}
              change={summary.impressions_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
            <StatCard
              icon={HeartIcon}
              title="Total Likes"
              value={summary.total_likes}
              change={summary.likes_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
            <StatCard
              icon={ChatBubbleLeftIcon}
              title="Total Comments"
              value={summary.total_comments}
              change={summary.comments_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
            <StatCard
              icon={ShareIcon}
              title="Total Shares"
              value={summary.total_shares}
              change={summary.shares_change}
              iconBg="bg-[#0d569e]/10"
              iconColor="text-[#0d569e]"
            />
          </div>

          {/* Community Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Community</h3>

            {/* Growth Metrics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Growth</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalFollowers.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Followers</div>
                </div>
                <div className="bg-pink-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {visitorMetrics.length > 0 ? visitorTotals.avgVisitorsPerDay : '-'}
                  </div>
                  <div className="text-sm mt-1">Avg unique visitors</div>
                </div>
                <div className="bg-purple-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalClicks.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Total button clicks</div>
                </div>
                <div className="bg-cyan-400 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {visitorMetrics.length > 0 ? visitorTotals.totalPageViews.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Page views</div>
                </div>
                <div className="bg-yellow-500 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{posts.length}</div>
                  <div className="text-sm mt-1">Total content</div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-52 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                {growthChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={growthChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="followers" stroke="#10b981" strokeWidth={2} name="Followers" />
                      <Line type="monotone" dataKey="pageViews" stroke="#3b82f6" strokeWidth={2} name="Page Views" />
                      <Line type="monotone" dataKey="content" stroke="#f59e0b" strokeWidth={2} name="Content" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm">No data available for selected date range</p>
                )}
              </div>

              {/* Delta boxes */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.totalNewFollowers.toLocaleString() : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">New Followers</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.dailyFollowers : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Daily followers</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.followersPerPost : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Followers per post</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.dailyPosts : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Daily posts</div>
                </div>
              </div>
            </div>

            {/* Balance of Followers */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Balance of Followers</h4>
                <div className="bg-emerald-500 text-black rounded-lg px-6 py-2 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalNewFollowers.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm">New Followers</div>
                </div>
              </div>
              <div className="h-52 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                {followersBalanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={followersBalanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="gained" stackId="1" stroke="#10b981" fill="#10b981" name="Gained" />
                      <Area type="monotone" dataKey="lost" stackId="1" stroke="#ef4444" fill="#ef4444" name="Lost" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm">No data available for selected date range</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Account</h3>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Content viewed in period</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalImpressions.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Impressions</div>
                </div>
                <div className="bg-emerald-500 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalReactions.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Reactions</div>
                </div>
                <div className="bg-pink-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalComments.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Comments</div>
                </div>
                <div className="bg-purple-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalShares.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Shares</div>
                </div>
                <div className="bg-cyan-400 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalClicks.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Clicks</div>
                </div>
              </div>
              <div className="h-52 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                {accountActivityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountActivityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="impressions" fill="#3b82f6" name="Impressions" />
                      <Bar dataKey="reactions" fill="#10b981" name="Reactions" />
                      <Bar dataKey="comments" fill="#ec4899" name="Comments" />
                      <Bar dataKey="shares" fill="#8b5cf6" name="Shares" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm">No data available for selected date range</p>
                )}
              </div>
            </div>
          </div>

          {/* Demographics Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Visitor Analytics</h3>

            {/* Visitor Metrics Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Visitor Metrics</h4>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {visitorMetrics.length > 0 ? visitorTotals.totalPageViews.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Total Page Views</div>
                </div>
                <div className="bg-emerald-500 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {visitorMetrics.length > 0 ? visitorTotals.totalUniqueVisitors.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Total Unique Visitors</div>
                </div>
                <div className="bg-purple-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {visitorMetrics.length > 0 ? visitorTotals.avgPageViewsPerDay : '-'}
                  </div>
                  <div className="text-sm mt-1">Avg Page Views/Day</div>
                </div>
                <div className="bg-cyan-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {visitorMetrics.length > 0 ? visitorTotals.avgVisitorsPerDay : '-'}
                  </div>
                  <div className="text-sm mt-1">Avg Visitors/Day</div>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                {visitorMetricsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitorMetricsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="pageViewsTotal" stroke="#3b82f6" strokeWidth={2} name="Total Page Views" />
                      <Line type="monotone" dataKey="uniqueVisitorsTotal" stroke="#10b981" strokeWidth={2} name="Unique Visitors" />
                      <Line type="monotone" dataKey="pageViewsDesktop" stroke="#8b5cf6" strokeWidth={2} name="Desktop Views" />
                      <Line type="monotone" dataKey="pageViewsMobile" stroke="#ec4899" strokeWidth={2} name="Mobile Views" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">No visitor data available for selected date range</p>
                    <p className="text-gray-400 text-xs mt-2">Check browser console for details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Demographics */}
            <VisitorDemographics source="visitors" />
          </div>

          {/* Posts Published Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Posts published in period</h3>

            {/* Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-500 text-white rounded-lg p-4 text-center relative">
                  <button className="absolute top-2 right-2 text-white hover:text-gray-200">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? `${metrics.avgEngagement}%` : '-'}
                  </div>
                  <div className="text-sm mt-1">Engagement</div>
                </div>
                <div className="bg-emerald-500 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalInteractions.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Interactions</div>
                </div>
                <div className="bg-purple-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{summary.total_impressions.toLocaleString()}</div>
                  <div className="text-sm mt-1">Impressions</div>
                </div>
                <div className="bg-yellow-600 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{posts.length}</div>
                  <div className="text-sm mt-1">Posts</div>
                </div>
              </div>
              <div className="h-52 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                {postsSummaryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={postsSummaryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={2} name="Engagement" />
                      <Line yAxisId="right" type="monotone" dataKey="interactions" stroke="#10b981" strokeWidth={2} name="Interactions" />
                      <Line yAxisId="right" type="monotone" dataKey="impressions" stroke="#8b5cf6" strokeWidth={2} name="Impressions" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm">No data available for selected date range</p>
                )}
              </div>
            </div>

            {/* Interactions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Interactions</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{summary.total_likes.toLocaleString()}</div>
                  <div className="text-sm mt-1">Reactions</div>
                </div>
                <div className="bg-emerald-500 text-black rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{summary.total_comments}</div>
                  <div className="text-sm mt-1">Comments</div>
                </div>
                <div className="bg-pink-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">
                    {metrics.hasData ? metrics.totalClicks.toLocaleString() : '-'}
                  </div>
                  <div className="text-sm mt-1">Clicks</div>
                </div>
                <div className="bg-purple-500 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{summary.total_shares}</div>
                  <div className="text-sm mt-1">Shares</div>
                </div>
                <div className="bg-yellow-600 text-white rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">{posts.length}</div>
                  <div className="text-sm mt-1">Posts</div>
                </div>
              </div>
              <div className="h-52 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 mb-6">
                {interactionsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={interactionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="reactions" fill="#3b82f6" name="Reactions" />
                      <Bar dataKey="comments" fill="#10b981" name="Comments" />
                      <Bar dataKey="clicks" fill="#ec4899" name="Clicks" />
                      <Bar dataKey="shares" fill="#8b5cf6" name="Shares" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm">No data available for selected date range</p>
                )}
              </div>

              {/* Delta boxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.dailyReactions : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">Daily reactions</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.reactionsPerPost : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">Reactions per content</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.dailyComments : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">Daily comments</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.commentsPerPost : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">Comments per content</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.dailyClicks : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">Daily clicks</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.hasData ? metrics.clicksPerPost : '-'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 leading-tight">Clicks per content</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub-navigation */}
          <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setActiveSubTab('list')}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 ${activeSubTab === 'list'
                ? 'bg-gradient-to-br from-[#0d569e] to-[#0a4278] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              All Posts
            </button>
            <button
              onClick={() => selectedPost && setActiveSubTab('details')}
              disabled={!selectedPost}
              className={`px-6 py-2 rounded-md font-medium text-sm transition-all duration-200 ${activeSubTab === 'details'
                ? 'bg-emerald-500 text-white shadow-sm'
                : selectedPost
                  ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  : 'text-gray-400 cursor-not-allowed'
                }`}
            >
              Post Analysis
            </button>
          </div>

          {/* Posts Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Post TITLE
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Publish Time
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      POST TYPE
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Impressions
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Likes
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Comments
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reposts
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total Clicks
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post, index) => (
                    <tr key={post.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          {post.title && (
                            <img
                              src={`https://via.placeholder.com/48`}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {post.title || truncateText(post.description, 60)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{post.page_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {post.publish_time || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {post.post_type === 'Photos' ? 'Visual' : post.post_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {post.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {post.likes.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {post.comments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {post.shares.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {post.total_clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetails(post)}
                          className="px-4 py-2 bg-[#ff6700] text-white font-semibold rounded-lg hover:bg-[#e55d00] transition-all duration-200 flex items-center space-x-2 shadow-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Post Details View */
        selectedPost && <PostAnalysisView post={selectedPost} onBack={handleBackToList} />
      )}

      {/* Incremental Upload Modal */}
      <IncrementalUploadModal
        isOpen={showIncrementalUpload}
        onClose={() => setShowIncrementalUpload(false)}
        onSuccess={handleIncrementalUploadSuccess}
      />
    </div>
  );
};





































