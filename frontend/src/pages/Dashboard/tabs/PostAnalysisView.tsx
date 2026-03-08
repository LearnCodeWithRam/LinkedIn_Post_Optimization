import {
  ArrowLeftIcon,
  CalendarIcon,
  ChatBubbleBottomCenterIcon,
  ChatBubbleLeftIcon,
  CursorArrowRaysIcon,
  DocumentTextIcon,
  EyeIcon,
  HeartIcon,
  LinkIcon,
  PhotoIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { GitCompareIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AIAnalysisData, analyzePost, clearPostAnalysisCache, hasAnalysisCache } from '../../../services/postAnalyzer.service';
import { findSimilarPosts, SimilarViralPost } from '../../../services/similarity.service';
import { AIAnalysisView } from './AIAnalysisView';
import LinkedInViralityAnalyzer from './ViralpostAnalysis';

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

interface PostAnalysisViewProps {
  post: Post;
  onBack: () => void;
}

export const PostAnalysisView: React.FC<PostAnalysisViewProps> = ({ post, onBack }) => {
  const location = useLocation();
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisData, setAiAnalysisData] = useState<AIAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [showViralPost, setShowViralPost] = useState(false);
  const [recommendedPosts, setRecommendedPosts] = useState<SimilarViralPost[]>([]);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);
  const [generatedSearchQuery, setGeneratedSearchQuery] = useState<string>('');

  // State for handling generated posts
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [isGeneratedPost, setIsGeneratedPost] = useState(false);

  // Handle generated post from navigation state
  useEffect(() => {
    const generatedPostContent = location.state?.generatedPost;
    if (generatedPostContent && typeof generatedPostContent === 'string') {
      // Create a temporary post object for the generated content
      const tempPost: Post = {
        id: `generated_${Date.now()}`,
        title: '',
        description: generatedPostContent,
        date: new Date().toISOString().split('T')[0],
        publish_time: 'Just now',
        impressions: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        reactions_comments_shares: 0,
        total_clicks: 0,
        photo_clicks: 0,
        other_clicks: 0,
        total_engagement: 0,
        permalink: '',
        post_type: 'Generated Post',
        page_name: 'AI Generated'
      };
      setCurrentPost(tempPost);
      setIsGeneratedPost(true);

      // Clear the navigation state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Check if this post has cached analysis
  React.useEffect(() => {
    const cached = hasAnalysisCache(currentPost.id);
    setIsCached(cached);
  }, [currentPost.id]);

  const engagementRate = currentPost.impressions > 0
    ? ((currentPost.total_engagement / currentPost.impressions) * 100).toFixed(2)
    : '0.00';

  const handleAnalyzePost = async (forceRefresh: boolean = false) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      // Construct post content from available data
      const postContent = `
      Title: ${post.title || 'Untitled'}

      Content:
      ${post.description || 'No content available'}

      Post Type: ${post.post_type}
      Published: ${post.publish_time}

      Performance Metrics:
      - Impressions: ${post.impressions}
      - Likes: ${post.likes}
      - Comments: ${post.comments}
      - Shares: ${post.shares}
      - Total Engagement: ${post.total_engagement}
      - Engagement Rate: ${engagementRate}%
            `.trim();

      // Pass post ID for caching, and forceRefresh flag
      const analysisResult = await analyzePost(post.id, postContent, forceRefresh);
      setAiAnalysisData(analysisResult);
      setShowAIAnalysis(true);
      setIsCached(true); // Update cache status
    } catch (error: any) {
      setAnalysisError(error.message || 'Failed to analyze post');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRefreshAnalysis = () => {
    handleAnalyzePost(true); // Force refresh
  };

  const handleClearCache = () => {
    clearPostAnalysisCache(post.id);
    setIsCached(false);
    setAnalysisError(null);
  };

  const handleBackFromAI = () => {
    setShowAIAnalysis(false);
  };

  // Cache key for similarity results
  const getSimilarityCacheKey = (postId: string) => `similarity_cache_${postId}`;

  // Get cached similarity results
  const getCachedSimilarity = (postId: string): SimilarViralPost[] | null => {
    try {
      const cached = localStorage.getItem(getSimilarityCacheKey(postId));
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('✓ Using cached similarity results');
        return data;
      } else {
        localStorage.removeItem(getSimilarityCacheKey(postId));
        return null;
      }
    } catch (error) {
      console.error('Error reading similarity cache:', error);
      return null;
    }
  };

  // Save similarity results to cache
  const cacheSimilarityResults = (postId: string, results: SimilarViralPost[]) => {
    try {
      const cacheEntry = {
        data: results,
        timestamp: Date.now()
      };
      localStorage.setItem(getSimilarityCacheKey(postId), JSON.stringify(cacheEntry));
      console.log('✓ Cached similarity results');
    } catch (error) {
      console.error('Error caching similarity results:', error);
    }
  };

  // Handle compare with viral post - find similar posts
  const handleCompareWithViralPost = async () => {
    setIsFindingSimilar(true);
    setAnalysisError(null);

    try {
      // Check cache first
      const cachedResults = getCachedSimilarity(post.id);
      if (cachedResults && cachedResults.length > 0) {
        setRecommendedPosts(cachedResults);
        setShowViralPost(true);
        setIsFindingSimilar(false);
        return;
      }

      // Call similarity API
      const postContent = post.description || post.title || '';
      if (!postContent.trim()) {
        setAnalysisError('No post content available for comparison');
        setIsFindingSimilar(false);
        return;
      }

      console.log('🔍 Finding similar viral posts...');
      const result = await findSimilarPosts(postContent, 3);

      if (result.success && result.recommendations.length > 0) {
        setRecommendedPosts(result.recommendations);
        cacheSimilarityResults(post.id, result.recommendations);

        // Store keywords and search query
        if (result.keywords) {
          setExtractedKeywords(result.keywords);
          console.log('✓ Extracted keywords:', result.keywords);
        }
        if (result.search_query) {
          setGeneratedSearchQuery(result.search_query);
          console.log('✓ Generated search query:', result.search_query);
        }

        setShowViralPost(true);
        console.log(`✓ Found ${result.recommendations.length} similar posts`);
      } else {
        setAnalysisError('No similar viral posts found');
      }
    } catch (error: any) {
      console.error('Error finding similar posts:', error);
      setAnalysisError(error.message || 'Failed to find similar posts');
      // Still show viral post view even if similarity search fails
      setShowViralPost(true);
    } finally {
      setIsFindingSimilar(false);
    }
  };

  // If showing AI analysis, render that view instead
  if (showAIAnalysis && aiAnalysisData) {
    return (
      <AIAnalysisView
        analysisData={aiAnalysisData}
        postContent={post.description || post.title || 'No content'}
        onBack={handleBackFromAI}
      />
    );
  }

  // If showing compare viral post, render that view instead
  if (showViralPost) {
    // Map SimilarViralPost to Post format for ViralpostAnalysis
    const mappedRecommendedPosts = recommendedPosts.map(rec => ({
      id: rec.post_id,
      post_id: rec.post_id,
      author_name: rec.author_name,
      profile_image_url: rec.profile_image_url,
      time_posted: rec.time_posted || 'Recently',
      post_content: rec.post_content,
      post_image_url: rec.post_image_url,
      linkedin_url: rec.linkedin_url,
      likes: rec.likes,
      comments: rec.comments,
      shares: rec.shares,
      engagement_rate: 'High',
      similarity_score: rec.similarity_score,
      label: rec.label
    }));

    return (
      <div className="w-full">
        <button
          onClick={() => setShowViralPost(false)}
          className="flex items-center space-x-2 mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <LinkedInViralityAnalyzer
          initialUserPost={currentPost.description || currentPost.title || ''}
          recommendedPosts={mappedRecommendedPosts}
          extractedKeywords={extractedKeywords}
          generatedSearchQuery={generatedSearchQuery}
          userPostId={currentPost.id}  // Pass actual post ID for consistent caching
        />
      </div>
    );
  }


  const MetricCard = ({
    icon: Icon,
    label,
    value,
    color = 'emerald',
    subValue
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: string;
    subValue?: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">Analysis Failed</h3>
            <p className="text-sm text-red-700 mt-1">{analysisError}</p>
          </div>
          <button
            onClick={() => setAnalysisError(null)}
            className="flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">

        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="font-medium">Back to Analytics</span>
        </button>


        <div className="flex items-center space-x-3">
          {/* Cache indicator */}
          {isCached && !isAnalyzing && (
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cached</span>
              </span>
              <button
                onClick={handleClearCache}
                className="text-xs text-gray-500 hover:text-red-600 underline"
                title="Clear cache for this post"
              >
                Clear
              </button>
            </div>
          )}

          {/* Analyze button */}
          <button
            onClick={() => handleAnalyzePost(false)}
            disabled={isAnalyzing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isAnalyzing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600'
              } text-white`}
          >
            <ChatBubbleBottomCenterIcon className={`w-5 h-5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span className="font-medium">
              {isAnalyzing ? 'Analyzing...' : isCached ? 'View Analysis' : 'Analyze by AI'}
            </span>
          </button>

          {/* Refresh button (only show if cached) */}
          {isCached && !isAnalyzing && (
            <button
              onClick={handleRefreshAnalysis}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh analysis"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        {/* compare button will compare two posts */}
        <button
          onClick={handleCompareWithViralPost}
          disabled={isFindingSimilar}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isFindingSimilar
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
        >
          <GitCompareIcon className={`w-5 h-5 ${isFindingSimilar ? 'animate-spin' : ''}`} />
          <span className="font-medium">
            {isFindingSimilar ? 'Finding Similar Posts...' : 'Compare with Viral Post'}
          </span>
        </button>

        <a
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          <span>View Original Post</span>
        </a>
      </div>

      {/* Post Title Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {post.title || 'Untitled Post'}
            </h2>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {post.publish_time || 'N/A'}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                {post.post_type}
              </span>
              <span className="text-gray-400">•</span>
              <span>{post.page_name}</span>
            </div>
          </div>
        </div>

        {/* Post Description */}
        {post.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Post Content:</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{post.description}</p>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={EyeIcon}
            label="Total Impressions"
            value={post.impressions}
            color="emerald"
          />
          <MetricCard
            icon={HeartIcon}
            label="Reactions (Likes)"
            value={post.likes}
            color="pink"
          />
          <MetricCard
            icon={ChatBubbleLeftIcon}
            label="Comments"
            value={post.comments}
            color="blue"
          />
          <MetricCard
            icon={ShareIcon}
            label="Shares"
            value={post.shares}
            color="purple"
          />
        </div>
      </div>

      {/* Engagement Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Total Engagement</span>
              <span className="text-lg font-bold text-gray-900">{post.total_engagement}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Engagement Rate</span>
              <span className="text-lg font-bold text-emerald-600">{engagementRate}%</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-sm text-gray-600">Reactions, Comments & Shares</span>
              <span className="text-lg font-bold text-gray-900">{post.reactions_comments_shares}</span>
            </div>
          </div>
        </div>

        {/* Click Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CursorArrowRaysIcon className="w-5 h-5 mr-2 text-emerald-600" />
            Click Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-100 rounded flex items-center justify-center mr-3">
                  <CursorArrowRaysIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-600">Total Clicks</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{post.total_clicks}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                  <PhotoIcon className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Photo Clicks</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{post.photo_clicks}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center mr-3">
                  <LinkIcon className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600">Other Clicks</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{post.other_clicks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engagement Breakdown Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Breakdown</h3>
        <div className="space-y-4">
          {/* Likes Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <HeartIcon className="w-4 h-4 text-pink-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Likes</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{post.likes}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-pink-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(post.likes / post.total_engagement) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Comments Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ChatBubbleLeftIcon className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Comments</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{post.comments}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(post.comments / post.total_engagement) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Shares Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ShareIcon className="w-4 h-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Shares</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{post.shares}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(post.shares / post.total_engagement) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Post Info */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">i</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Post Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Post ID:</span> {post.id}</p>
              <p><span className="font-medium">Date Period:</span> {post.date}</p>
              <p><span className="font-medium">Post Type:</span> {post.post_type}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
