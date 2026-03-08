import { AlertCircle, ArrowRight, BarChart3, CheckCircle, ChevronDown, ChevronUp, Clock, Copy, Eye, FileText, GitCompare, Hash, History, MessageSquare, RefreshCw, Search, Share2, ThumbsUp, TrendingUp, X, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { compareWithAnalysis } from '../../../services/comparisonAdvanced.service';
import { optimizeWithViralPattern } from '../../../services/viralPatternOptimization.service';
import { AIAnalysisView } from './AIAnalysisView';

interface Post {
  id: string;
  post_id?: string; // For recommended posts from similarity API
  author_name: string;
  profile_image_url?: string;
  time_posted: string;
  post_content: string;
  post_image_url?: string;
  linkedin_url: string;
  likes: string;
  engagement_rate?: string;
  comments?: number;
  shares?: number;
  similarity_score?: number; // For recommended posts
  label?: string; // "Recommended" label
}

interface ComparisonResult {
  virality_score: number;
  virality_status: string;
  structure: {
    user_word_count: number;
    viral_word_count: number;
    word_count_difference: number;
    user_hook_quality: string;
    viral_hook_quality: string;
    user_has_cta: boolean;
    viral_has_cta: boolean;
    structure_recommendation: string;
    optimal_length: string;
  };
  tone: {
    user_tone: string;
    viral_tone: string;
    friendly_score: number;
    persuasive_score: number;
    formal_score: number;
    tone_recommendation: string;
    needs_simplification: boolean;
  };
  hashtags: {
    user_hashtags: string[];
    viral_hashtags: string[];
    user_hashtag_count: number;
    viral_hashtag_count: number;
    user_has_trending: boolean;
    viral_has_trending: boolean;
    missing_trending_tags: string[];
    hashtag_recommendation: string;
  };
  engagement: {
    user_engagement_rate: string;
    viral_engagement_rate: string;
    engagement_difference: string;
    user_content_type: string;
    viral_content_type: string;
    media_recommendation: string;
    posting_time_recommendation: string;
  };
  keywords: {
    user_primary_keywords: string[];
    viral_primary_keywords: string[];
    user_secondary_keywords: string[];
    viral_secondary_keywords: string[];
    missing_keywords: string[];
  };
  comparison_table: Array<{
    dimension: string;
    viral: string;
    user: string;
    difference: string;
    status: string;
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    icon: string;
  }>;
  strengths: string[];
  improvements: string[];
  priority_actions: string[];
}

interface LinkedInViralityAnalyzerProps {
  initialUserPost?: string;
  recommendedPosts?: Post[];
  extractedKeywords?: string[];
  generatedSearchQuery?: string;
  userPostId?: string;  // Add post ID for consistent caching
}

export default function LinkedInViralityAnalyzer({ initialUserPost = '', recommendedPosts = [], extractedKeywords = [], generatedSearchQuery = '', userPostId }: LinkedInViralityAnalyzerProps) {
  const [currentPage, setCurrentPage] = useState('input');
  const [myPost, setMyPost] = useState(initialUserPost);
  const [viralPost, setViralPost] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViralPost, setSelectedViralPost] = useState<Post | null>(null);

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  // New state for 3-tab structure
  const [activeTab, setActiveTab] = useState<'linkedin' | 'viral' | 'comparison'>('comparison');
  const [userPostAnalysis, setUserPostAnalysis] = useState<any>(null);
  const [viralPostAnalysis, setViralPostAnalysis] = useState<any>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  // State for viral pattern optimization
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPost, setOptimizedPost] = useState<string | null>(null);
  const [improvementsMade, setImprovementsMade] = useState<string[]>([]);
  const [showOptimizedView, setShowOptimizedView] = useState(false);
  const [patternChanges, setPatternChanges] = useState<any>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  // State for keywords and search query (can be passed as props or fetched)
  const [keywords, setKeywords] = useState<string[]>(extractedKeywords);
  const [searchQuerySuggestion, setSearchQuerySuggestion] = useState<string>(generatedSearchQuery);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Fetch keywords and search query when component mounts with initial data
  useEffect(() => {
    const fetchKeywordsAndQuery = async () => {
      // Only fetch if we have initialUserPost and recommendedPosts but no keywords yet
      if (initialUserPost && recommendedPosts.length > 0 && keywords.length === 0) {
        try {
          const { findSimilarPosts } = await import('../../../services/similarity.service');
          const result = await findSimilarPosts(initialUserPost, 3);

          if (result.keywords) {
            setKeywords(result.keywords);
            console.log('✓ Fetched keywords:', result.keywords);
          }
          if (result.search_query) {
            setSearchQuerySuggestion(result.search_query);
            console.log('✓ Fetched search query:', result.search_query);
          }
        } catch (error) {
          console.error('Error fetching keywords:', error);
        }
      }
    };

    fetchKeywordsAndQuery();
  }, [initialUserPost, recommendedPosts.length]);

  // Update keywords when props change
  useEffect(() => {
    if (extractedKeywords.length > 0) {
      setKeywords(extractedKeywords);
    }
    if (generatedSearchQuery) {
      setSearchQuerySuggestion(generatedSearchQuery);
    }
  }, [extractedKeywords, generatedSearchQuery]);

  const fetchPostsFromJSON = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/v1/viralpost-scraping/linkedin-posts/`);

      if (!response.ok) {
        throw new Error('Failed to load posts');
      }

      const postsData = await response.json();
      const processedPosts = postsData.map((post: any, index: number) => ({
        ...post,
        id: post.id || String(index),
        likes: post.likes || '0',
        comments: post.comments || 0,
        shares: post.shares || 0,
        engagement_rate: post.engagement_rate || 'High'
      }));

      // Merge recommended posts with fetched posts
      const mergedPosts = [...recommendedPosts, ...processedPosts];

      // Remove duplicates based on post_content
      const uniquePosts = mergedPosts.filter((post, index, self) =>
        index === self.findIndex((p) => p.post_content === post.post_content)
      );

      setPosts(uniquePosts);
      setFilteredPosts(uniquePosts);

      console.log(`✓ Loaded ${uniquePosts.length} posts (${recommendedPosts.length} recommended)`);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrapeViralPosts = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsScraping(true);
    setError(null);

    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/v1/viralpost-scraping/scrape/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          search_query: searchQuery,
          personalize: false,
          user_role: '',
          user_topics: ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search posts');
      }

      const result = await response.json();

      if (result.success) {
        await fetchPostsFromJSON();
      } else {
        throw new Error(result.error || 'Scraping failed');
      }
    } catch (err) {
      console.error('Error searching posts:', err);
      setError('Failed to search viral posts. Please try again.');
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    fetchPostsFromJSON();
  }, []);

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    scrapeViralPosts();
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSelectedFilter(tag);
    const filtered = posts.filter(post =>
      post.post_content?.toLowerCase().includes(tag.toLowerCase())
    );
    setFilteredPosts(filtered);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
    setFilteredPosts(posts);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e as any);
    }
  };

  const handleSelectViralPost = (post: Post) => {
    setSelectedViralPost(post);
    setViralPost(post.post_content);
  };

  const handleCompare = async () => {
    if (myPost && viralPost) {
      setIsComparing(true);
      setComparisonError(null);

      try {
        // Use the provided userPostId if available, otherwise generate from content
        const userPostIdToUse = userPostId || `:${Math.abs(myPost.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0))}`;

        const viralPostId = selectedViralPost?.id || selectedViralPost?.post_id || `:${Math.abs(viralPost.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0))}`;

        console.log('🚀 Calling advanced comparison API...');
        console.log('📝 User Post ID:', userPostIdToUse);
        console.log('⭐ Viral Post ID:', viralPostId);
        const startTime = Date.now();

        // Call the advanced comparison API (parallel processing on backend)
        const result = await compareWithAnalysis({
          user_post_id: userPostIdToUse,
          user_post_content: myPost,
          viral_post_id: viralPostId,
          viral_post_content: viralPost,
          force_refresh: false
        });

        const clientTime = Date.now() - startTime;
        console.log(`✓ Comparison complete in ${clientTime}ms (backend: ${result.processing_time_ms}ms)`);
        console.log(`Cache hits: ${Object.values(result.cached).filter(Boolean).length}/3`);

        // Set all analysis data
        setUserPostAnalysis(result.user_post_analysis);
        setViralPostAnalysis(result.viral_post_analysis);
        setComparisonResult(result.comparison_result);
        setProcessingTime(result.processing_time_ms);
        setCacheStatus(result.cached);

        // Debug: Log the viral post analysis to check structure
        console.log('📊 Viral Post Analysis Data:', result.viral_post_analysis);
        console.log('📊 User Post Analysis Data:', result.user_post_analysis);

        // Set active tab to comparison by default
        setActiveTab('comparison');
        setCurrentPage('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });

      } catch (err) {
        console.error('Comparison error:', err);
        setComparisonError(err instanceof Error ? err.message : 'Failed to compare posts');
      } finally {
        setIsComparing(false);
      }
    }
  };

  const handleOptimize = async () => {
    if (!userPostAnalysis || !viralPostAnalysis || !myPost || !viralPost) {
      alert('Please run comparison first to get analysis data');
      return;
    }

    setIsOptimizing(true);
    try {
      // Generate post ID for caching
      const userPostId = `user_${Math.abs(myPost.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0))}`;

      const viralPostId = selectedViralPost?.id || selectedViralPost?.post_id || `viral_${Math.abs(viralPost.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0))}`;

      const postId = `${userPostId}_${viralPostId}`;

      console.log('🚀 Optimizing post with viral patterns...');
      const result = await optimizeWithViralPattern({
        user_post_content: myPost,
        user_post_analysis: userPostAnalysis,
        viral_post_content: viralPost,
        viral_post_analysis: viralPostAnalysis,
        post_id: postId
      });

      console.log('✓ Optimization complete:', result);

      setOptimizedPost(result.data.optimized_post);
      setImprovementsMade(result.data.improvements_made);
      setPatternChanges(result.data.pattern_changes);
      setShowOptimizedView(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Optimization error:', err);
      alert('Failed to optimize post. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleBackToInput = () => {
    setCurrentPage('input');
    setShowOptimizedView(false);
  };

  // Intelligent Comparison Function
  const generateIntelligentComparison = () => {
    if (!userPostAnalysis || !viralPostAnalysis || !comparisonResult) return null;

    const userScore = userPostAnalysis.virality_score || 0;
    const viralScore = viralPostAnalysis.virality_score || 0;

    const betterPost = userScore >= viralScore ? 'user' : 'viral';
    const betterAnalysis = betterPost === 'user' ? userPostAnalysis : viralPostAnalysis;
    const worseAnalysis = betterPost === 'user' ? viralPostAnalysis : userPostAnalysis;
    const scoreDifference = Math.abs(userScore - viralScore);

    // Extract best practices from better post
    const dos: string[] = [];

    if (betterAnalysis.structure?.hook_effectiveness === 'Strong' || betterAnalysis.structure?.hook_effectiveness === 'Excellent') {
      dos.push(`Use ${betterPost === 'user' ? 'your' : 'the viral post\'s'} compelling hook strategy - it immediately grabs attention`);
    }

    if (betterAnalysis.keywords?.tone_analysis?.friendly_score && betterAnalysis.keywords.tone_analysis.friendly_score > 70) {
      dos.push(`Maintain a friendly and approachable tone (${betterAnalysis.keywords.tone_analysis.friendly_score}% friendly score)`);
    }

    if (betterAnalysis.keywords?.tone_analysis?.persuasive_score && betterAnalysis.keywords.tone_analysis.persuasive_score > 70) {
      dos.push(`Keep the persuasive elements that drive action (${betterAnalysis.keywords.tone_analysis.persuasive_score}% persuasive score)`);
    }

    if (betterAnalysis.hashtags?.trending_hashtags?.length > 0) {
      dos.push(`Include trending hashtags like: ${betterAnalysis.hashtags.trending_hashtags.slice(0, 3).join(', ')}`);
    }

    if (betterAnalysis.structure?.has_call_to_action || betterAnalysis.structure?.has_cta) {
      dos.push(`Include a clear call-to-action to drive engagement`);
    }

    if (betterAnalysis.keywords?.primary_keywords?.length > 0) {
      dos.push(`Focus on key themes: ${betterAnalysis.keywords.primary_keywords.slice(0, 3).join(', ')}`);
    }

    // Extract weaknesses from worse post
    const donts: string[] = [];

    if (worseAnalysis.structure?.word_count && betterAnalysis.structure?.word_count && worseAnalysis.structure.word_count > betterAnalysis.structure.word_count + 100) {
      donts.push(`Avoid overly long posts - ${worseAnalysis.structure.word_count} words may lose reader attention`);
    }

    if (worseAnalysis.keywords?.tone_analysis?.formal_score && worseAnalysis.keywords.tone_analysis.formal_score > 70) {
      donts.push(`Don't be too formal (${worseAnalysis.keywords.tone_analysis.formal_score}% formal score) - it reduces engagement`);
    }

    if (worseAnalysis.hashtags?.hashtag_count > 10) {
      donts.push(`Don't overuse hashtags (${worseAnalysis.hashtags.hashtag_count} hashtags) - it looks spammy`);
    }

    if (!(worseAnalysis.structure?.has_call_to_action || worseAnalysis.structure?.has_cta) && (betterAnalysis.structure?.has_call_to_action || betterAnalysis.structure?.has_cta)) {
      donts.push(`Don't forget to include a call-to-action - it significantly boosts engagement`);
    }

    if (worseAnalysis.structure?.hook_effectiveness === 'Weak' || worseAnalysis.structure?.hook_effectiveness === 'Poor') {
      donts.push(`Avoid weak opening hooks - the first line must capture attention immediately`);
    }

    // Metric-by-metric comparison
    const metricComparison = [
      {
        metric: 'Virality Score',
        userValue: `${userScore}%`,
        viralValue: `${viralScore}%`,
        winner: betterPost,
        difference: `${scoreDifference.toFixed(1)}% ${betterPost === 'user' ? 'ahead' : 'behind'}`
      },
      {
        metric: 'Friendly Tone',
        userValue: `${userPostAnalysis.keywords?.tone_analysis?.friendly_score || 0}%`,
        viralValue: `${viralPostAnalysis.keywords?.tone_analysis?.friendly_score || 0}%`,
        winner: (userPostAnalysis.keywords?.tone_analysis?.friendly_score || 0) >= (viralPostAnalysis.keywords?.tone_analysis?.friendly_score || 0) ? 'user' : 'viral',
        difference: `${Math.abs((userPostAnalysis.keywords?.tone_analysis?.friendly_score || 0) - (viralPostAnalysis.keywords?.tone_analysis?.friendly_score || 0)).toFixed(1)}%`
      },
      {
        metric: 'Persuasiveness',
        userValue: `${userPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0}%`,
        viralValue: `${viralPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0}%`,
        winner: (userPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0) >= (viralPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0) ? 'user' : 'viral',
        difference: `${Math.abs((userPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0) - (viralPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0)).toFixed(1)}%`
      },
      {
        metric: 'Word Count',
        userValue: `${myPost.trim().split(/\s+/).length} words`,
        viralValue: `${viralPost.trim().split(/\s+/).length} words`,
        winner: Math.abs(myPost.trim().split(/\s+/).length - 150) <= Math.abs(viralPost.trim().split(/\s+/).length - 150) ? 'user' : 'viral',
        difference: `${Math.abs(myPost.trim().split(/\s+/).length - viralPost.trim().split(/\s+/).length)} words`
      },
      {
        metric: 'Hashtag Count',
        userValue: `${userPostAnalysis.hashtags?.hashtag_count || 0}`,
        viralValue: `${viralPostAnalysis.hashtags?.hashtag_count || 0}`,
        winner: Math.abs((userPostAnalysis.hashtags?.hashtag_count || 0) - 5) <= Math.abs((viralPostAnalysis.hashtags?.hashtag_count || 0) - 5) ? 'user' : 'viral',
        difference: `${Math.abs((userPostAnalysis.hashtags?.hashtag_count || 0) - (viralPostAnalysis.hashtags?.hashtag_count || 0))}`
      }
    ];

    return {
      betterPost,
      userScore,
      viralScore,
      scoreDifference,
      dos: dos.length > 0 ? dos : ['Continue with your current strategy - it\'s working well!'],
      donts: donts.length > 0 ? donts : ['No major issues detected'],
      metricComparison
    };
  };

  const intelligentComparison = generateIntelligentComparison();



  if (currentPage === 'results' && comparisonResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white shadow-sm border-b border-gray-100">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Comparison Results</h1>
                  <p className="text-sm text-gray-600">Analysis of your post vs viral post</p>
                </div>
              </div>
              <button onClick={handleBackToInput} className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all">
                ← Back to Compare
              </button>
            </div>
          </div>
        </div>

        {/* 3-Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('linkedin')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${activeTab === 'linkedin'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              📊 LinkedIn Post Analysis
            </button>
            <button
              onClick={() => setActiveTab('viral')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${activeTab === 'viral'
                ? 'border-b-2 border-purple-600 text-purple-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              ⭐ Viral Post Analysis
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-6 py-3 font-semibold text-sm transition-all ${activeTab === 'comparison'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              🔄 Comparison Analysis
            </button>
          </div>

          {/* Performance Info */}
          <div className="px-6 py-2 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>⚡ Processed in {processingTime}ms</span>
              {cacheStatus && (
                <span>
                  💾 Cache: {Object.values(cacheStatus).filter(Boolean).length}/3 hits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'linkedin' && userPostAnalysis && (
          <div className="p-6">
            <AIAnalysisView
              analysisData={userPostAnalysis}
              postContent={myPost}
              onBack={() => setActiveTab('comparison')}
            />
          </div>
        )}

        {activeTab === 'viral' && viralPostAnalysis && (
          <div className="p-6">
            <AIAnalysisView
              analysisData={viralPostAnalysis}
              postContent={viralPost}
              onBack={() => setActiveTab('comparison')}
            />
          </div>
        )}

        {activeTab === 'comparison' && (
          <>
            {/* here create three sub tabs for linkedinpost analysis, viralpost analysis and comparison analysis. for the ui part of the tabs linkedin post analysis and viralpost analysis use the this ui file:frontend\src\pages\Dashboard\tabs\AIAnalysisView.tsx and for the  comparison analysis use the existing ui of comparison analysis */}
            <div className="py-4 space-y-6">
              {intelligentComparison && (
                <>
                  {/* Intelligent Virality Score Comparison */}
                  <div className="bg-gradient-to-r from-[#ff6700] to-[#0d569e] rounded-xl shadow-lg p-6 text-white">
                    <h2 className="text-2xl font-bold mb-6">Intelligent Virality Comparison</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Your Post Score */}
                      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 ${intelligentComparison.betterPost === 'user' ? 'border-yellow-300' : 'border-white/20'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">Your LinkedIn Post</h3>
                          {intelligentComparison.betterPost === 'user' && (
                            <span className="text-3xl">🏆</span>
                          )}
                        </div>
                        <div className="text-5xl font-bold mb-2">{intelligentComparison.userScore}%</div>
                        <div className="text-sm opacity-90">Virality Score</div>
                      </div>

                      {/* Viral Post Score */}
                      <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 ${intelligentComparison.betterPost === 'viral' ? 'border-yellow-300' : 'border-white/20'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">Viral Post</h3>
                          {intelligentComparison.betterPost === 'viral' && (
                            <span className="text-3xl">🏆</span>
                          )}
                        </div>
                        <div className="text-5xl font-bold mb-2">{intelligentComparison.viralScore}%</div>
                        <div className="text-sm opacity-90">Virality Score</div>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-lg">
                        {intelligentComparison.betterPost === 'user'
                          ? `🎉 Your post is ${intelligentComparison.scoreDifference.toFixed(1)}% more viral!`
                          : `The viral post is ${intelligentComparison.scoreDifference.toFixed(1)}% ahead`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Do's and Don'ts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Do's - Best Practices */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border-2 border-green-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-500 rounded-full">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">✅ Do's</h3>
                          <p className="text-sm text-gray-600">
                            Best practices from the {intelligentComparison.betterPost === 'user' ? 'better-performing post (yours!)' : 'viral post'}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {intelligentComparison.dos.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-green-200">
                            <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700 flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Don'ts - Things to Avoid */}
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-lg border-2 border-red-200 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-red-500 rounded-full">
                          <X className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">❌ Don'ts</h3>
                          <p className="text-sm text-gray-600">
                            Things to avoid from the {intelligentComparison.betterPost === 'user' ? 'viral post' : 'lower-performing post (yours)'}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-3">
                        {intelligentComparison.donts.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg border border-red-200">
                            <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-gray-700 flex-1">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Metric-by-Metric Comparison */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <BarChart3 className="w-6 h-6 text-blue-600" />
                      <h2 className="text-2xl font-bold text-gray-900">Metric-by-Metric Analysis</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Metric</th>
                            <th className="text-left py-4 px-4 font-semibold text-blue-600">Your Post</th>
                            <th className="text-left py-4 px-4 font-semibold text-purple-600">Viral Post</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Winner</th>
                            <th className="text-left py-4 px-4 font-semibold text-gray-700">Difference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {intelligentComparison.metricComparison.map((row, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4 font-medium text-gray-900">{row.metric}</td>
                              <td className={`py-4 px-4 ${row.winner === 'user' ? 'text-blue-700 font-bold' : 'text-blue-600'}`}>
                                {row.userValue}
                                {row.winner === 'user' && <span className="ml-2">🏆</span>}
                              </td>
                              <td className={`py-4 px-4 ${row.winner === 'viral' ? 'text-purple-700 font-bold' : 'text-purple-600'}`}>
                                {row.viralValue}
                                {row.winner === 'viral' && <span className="ml-2">🏆</span>}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${row.winner === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                  {row.winner === 'user' ? 'Your Post' : 'Viral Post'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-gray-600">{row.difference}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* Intelligent Tone Comparison */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Tone Comparison</h3>
                  <div className="space-y-6">
                    {intelligentComparison && [
                      {
                        label: 'Friendly',
                        userScore: userPostAnalysis.keywords?.tone_analysis?.friendly_score || 0,
                        viralScore: viralPostAnalysis.keywords?.tone_analysis?.friendly_score || 0,
                        color: 'blue'
                      },
                      {
                        label: 'Persuasive',
                        userScore: userPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0,
                        viralScore: viralPostAnalysis.keywords?.tone_analysis?.persuasive_score || 0,
                        color: 'pink'
                      },
                      {
                        label: 'Formal',
                        userScore: userPostAnalysis.keywords?.tone_analysis?.formal_score || 0,
                        viralScore: viralPostAnalysis.keywords?.tone_analysis?.formal_score || 0,
                        color: 'orange'
                      }
                    ].map((tone, i) => {
                      const winner = tone.userScore >= tone.viralScore ? 'user' : 'viral';
                      const winnerScore = winner === 'user' ? tone.userScore : tone.viralScore;
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm font-semibold text-${tone.color}-600`}>{tone.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Your: {tone.userScore}%</span>
                              <span className="text-xs text-gray-500">|</span>
                              <span className="text-xs text-gray-500">Viral: {tone.viralScore}%</span>
                              {winner === 'user' && <span className="text-sm">🏆</span>}
                            </div>
                          </div>
                          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`absolute h-full bg-${tone.color}-600 rounded-full transition-all duration-500`}
                              style={{ width: `${winnerScore}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-white drop-shadow">{winnerScore}%</span>
                            </div>
                          </div>
                          {winner === 'user' && (
                            <p className="text-xs text-green-600 font-medium">✓ Your post excels in {tone.label.toLowerCase()} tone</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Intelligent Engagement Insights */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Engagement Insights</h3>
                  <div className="space-y-4">
                    {intelligentComparison && (
                      <>
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-green-600">✨</span>
                            {intelligentComparison.betterPost === 'user' ? 'Your Strengths' : 'Learn from Viral Post'}
                          </h4>
                          <ul className="text-sm text-gray-700 space-y-2">
                            {intelligentComparison.dos.slice(0, 3).map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="text-amber-600">💡</span> Areas to Improve
                          </h4>
                          <ul className="text-sm text-gray-700 space-y-2">
                            {intelligentComparison.donts.slice(0, 3).map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Structural & Content Quality Comparison */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Structural & Content Quality</h2>
                </div>
                {intelligentComparison && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Hook Quality */}
                    <div className="p-5 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Hook Quality</h4>
                        <Zap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Post:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${userPostAnalysis.structure?.hook_quality === 'Excellent' ? 'bg-green-100 text-green-700' :
                            userPostAnalysis.structure?.hook_quality === 'Good' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {userPostAnalysis.structure?.hook_quality || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Viral Post:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${viralPostAnalysis.structure?.hook_quality === 'Excellent' ? 'bg-green-100 text-green-700' :
                            viralPostAnalysis.structure?.hook_quality === 'Good' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {viralPostAnalysis.structure?.hook_quality || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Call-to-Action */}
                    <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Call-to-Action</h4>
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Post:</span>
                          {(userPostAnalysis.structure?.has_cta || userPostAnalysis.structure?.has_call_to_action) ? (
                            <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                              <CheckCircle className="w-4 h-4" /> Present
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                              <X className="w-4 h-4" /> Missing
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Viral Post:</span>
                          {(viralPostAnalysis.structure?.has_cta || viralPostAnalysis.structure?.has_call_to_action) ? (
                            <span className="flex items-center gap-1 text-green-600 font-semibold text-sm">
                              <CheckCircle className="w-4 h-4" /> Present
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-600 font-semibold text-sm">
                              <X className="w-4 h-4" /> Missing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Content Length */}
                    <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Content Length</h4>
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Post:</span>
                          <span className="text-sm font-bold text-gray-900">
                            {userPostAnalysis.structure?.main_content_length || 0} chars
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Viral Post:</span>
                          <span className="text-sm font-bold text-gray-900">
                            {viralPostAnalysis.structure?.main_content_length || 0} chars
                          </span>
                        </div>
                        <div className="pt-2 border-t border-blue-200">
                          <span className="text-xs text-gray-500">
                            Optimal: 800-1200 characters
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* SEO & Keywords */}
                    <div className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">SEO Score</h4>
                        <Hash className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Post:</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
                            {userPostAnalysis.keywords?.seo_score || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Viral Post:</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700">
                            {viralPostAnalysis.keywords?.seo_score || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Potential */}
                    <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Engagement Potential</h4>
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Post:</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            {userPostAnalysis.analytics?.engagement_potential || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Viral Post:</span>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            {viralPostAnalysis.analytics?.engagement_potential || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Structure Score */}
                    <div className="p-5 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Structure Score</h4>
                        <Eye className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Your Post:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${userPostAnalysis.structure?.structure_score === 'Excellent' ? 'bg-green-100 text-green-700' :
                            userPostAnalysis.structure?.structure_score === 'Good' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {userPostAnalysis.structure?.structure_score || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Viral Post:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${viralPostAnalysis.structure?.structure_score === 'Excellent' ? 'bg-green-100 text-green-700' :
                            viralPostAnalysis.structure?.structure_score === 'Good' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                            {viralPostAnalysis.structure?.structure_score || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI-Powered Insights */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="w-6 h-6 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900">AI-Powered Insights</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {comparisonResult.insights.map((insight, idx) => (
                    <div key={idx} className={`p-6 rounded-xl border-2 transition-all hover:shadow-md ${insight.type === 'critical' ? 'bg-red-50 border-red-200 hover:border-red-300' : insight.type === 'important' ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300' : 'bg-blue-50 border-blue-200 hover:border-blue-300'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${insight.type === 'critical' ? 'bg-red-100' : insight.type === 'important' ? 'bg-yellow-100' : 'bg-blue-100'}`}>
                          {insight.icon === 'AlertCircle' ? <AlertCircle className={`w-5 h-5 ${insight.type === 'critical' ? 'text-red-600' : insight.type === 'important' ? 'text-yellow-600' : 'text-blue-600'}`} /> :
                            insight.icon === 'MessageSquare' ? <MessageSquare className={`w-5 h-5 ${insight.type === 'critical' ? 'text-red-600' : insight.type === 'important' ? 'text-yellow-600' : 'text-blue-600'}`} /> :
                              insight.icon === 'Hash' ? <Hash className={`w-5 h-5 ${insight.type === 'critical' ? 'text-red-600' : insight.type === 'important' ? 'text-yellow-600' : 'text-blue-600'}`} /> :
                                <TrendingUp className={`w-5 h-5 ${insight.type === 'critical' ? 'text-red-600' : insight.type === 'important' ? 'text-yellow-600' : 'text-blue-600'}`} />
                          }
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{insight.title}</h3>
                          <p className="text-sm text-gray-600">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords Analysis */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Keywords Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Primary Keywords (User)</h4>
                    <div className="flex flex-wrap gap-2">
                      {comparisonResult.keywords.user_primary_keywords.length > 0 ? (
                        comparisonResult.keywords.user_primary_keywords.map((kw, i) => <span key={i} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{kw}</span>)
                      ) : <span className="text-gray-500 text-sm">No primary keywords detected</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Missing Keywords (from Viral Post)</h4>
                    <div className="flex flex-wrap gap-2">
                      {comparisonResult.keywords.missing_keywords.length > 0 ? (
                        comparisonResult.keywords.missing_keywords.map((kw, i) => (
                          <span key={i} className="px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm">{kw}</span>
                        ))
                      ) : <span className="text-green-600 text-sm">Good keyword coverage!</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-100 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Optimize?</h3>
                    <p className="text-gray-600">Get AI-generated rewrites that match viral patterns</p>
                  </div>
                  <button
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                    className={`px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg ${isOptimizing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Zap className="w-5 h-5" />
                    {isOptimizing ? 'Optimizing...' : 'Optimize with AI'}
                  </button>
                </div>
              </div>

            </div>
            {/* Optimized View - Side by Side Comparison */}
            {showOptimizedView && optimizedPost && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">✨ Optimized Post</h2>
                    <p className="text-gray-600">Your post rewritten to match viral patterns</p>
                  </div>
                  <button
                    onClick={() => setShowOptimizedView(false)}
                    className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Close
                  </button>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Original Post */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Original Post
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                        <p className="text-gray-800 whitespace-pre-wrap">{myPost}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {myPost.split(/\s+/).length} words • {myPost.length} characters
                        </div>
                        <button
                          onClick={() => copyToClipboard(myPost)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Optimized Post */}
                  <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Optimized Post
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-green-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto border-2 border-green-200">
                        <p className="text-gray-800 whitespace-pre-wrap">{optimizedPost}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          {optimizedPost.split(/\s+/).length} words • {optimizedPost.length} characters
                        </div>
                        <button
                          onClick={() => copyToClipboard(optimizedPost)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pattern Changes */}
                {patternChanges && (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Pattern Changes Applied
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Tone Shift</div>
                        <div className="font-semibold text-gray-900">{patternChanges.tone_shift}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Length Change</div>
                        <div className="font-semibold text-gray-900">{patternChanges.length_change}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Structure</div>
                        <div className="font-semibold text-gray-900">{patternChanges.structure_adopted}</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Hashtags</div>
                        <div className="font-semibold text-gray-900">{patternChanges.hashtags_strategy}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Improvements Made */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Improvements Made ({improvementsMade.length})
                  </h3>
                  <ul className="space-y-3">
                    {improvementsMade.map((improvement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-gray-700 flex-1">{improvement}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LinkedIn Virality Analyzer</h1>
              <p className="text-sm text-gray-600">Compare your post against viral content and get AI-powered insights</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-2 py-2">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mb-4">
          {comparisonError && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-700 text-sm"><strong>Comparison Error:</strong> {comparisonError}</p>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-14 relative">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FileText className="w-4 h-4 inline mr-2" />
                My LinkedIn Post
              </label>
              <textarea value={myPost} onChange={(e) => setMyPost(e.target.value)} placeholder="Paste your LinkedIn post here..." className="w-full h-80 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none" />
              <p className="text-xs text-gray-500 mt-2">{myPost.split(/\s+/).filter(Boolean).length} words</p>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
              <button onClick={handleCompare} disabled={!myPost || !viralPost || isComparing} className="px-3 py-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold rounded-full hover:from-blue-700 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:scale-110 shadow-2xl" title="Compare Posts">
                {isComparing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <GitCompare className="w-6 h-6" />}
              </button>
              <br />
              <span className="text-xs font-semibold text-black-500">Compare</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Viral Post (for comparison)
              </label>
              <textarea value={viralPost} onChange={(e) => setViralPost(e.target.value)} placeholder="Select a viral post below or paste one here..." className="w-full h-80 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none" />
              <p className="text-xs text-gray-500 mt-2">{viralPost.split(/\s+/).filter(Boolean).length} words</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center md:hidden">
            <button onClick={handleCompare} disabled={!myPost || !viralPost || isComparing} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg">
              {isComparing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <GitCompare className="w-5 h-5" />}
              {isComparing ? 'Comparing...' : 'Compare Posts'}
              {!isComparing && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Viral LinkedIn Posts</h2>

          {/* Keywords and Search Query Section */}
          {(keywords.length > 0 || searchQuerySuggestion) && (
            <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Hash className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Extracted Themes & Keywords</h3>
              </div>

              {/* Keywords Display */}
              {keywords.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">Based on your LinkedIn post, we identified these key themes:</p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-white border-2 border-blue-300 text-blue-700 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Query Display */}
              {searchQuerySuggestion && (
                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-700">Recommended Search Query:</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(searchQuerySuggestion)}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-1 text-sm"
                      title="Copy search query"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  </div>
                  <p className="text-base font-mono text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    {searchQuerySuggestion}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Use this query to search for more viral posts with similar themes
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder="Enter search query to search viral posts..." className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" disabled={isScraping} />
            </div>
            <button onClick={handleSearch} disabled={isScraping || !searchQuery.trim()} className={`px-8 py-4 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg ${isScraping || !searchQuery.trim() ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              {isScraping ? <><RefreshCw className="w-5 h-5 animate-spin" />Searching...</> : <><Search className="w-5 h-5" />Search Posts</>}
            </button>
            <button onClick={clearFilters} className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all" disabled={isScraping}>Clear</button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {isScraping && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-6 animate-pulse">
              <div className="flex items-center">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Searching Viral Posts...</h3>
                  <p className="text-blue-700 text-sm mt-1">This may take a few moments. Please wait.</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-full flex items-center gap-2 shadow-md">
              <BarChart3 className="w-4 h-4" />
              Trending Topics
            </span>
            {['#marketing', '#technology', '#business', '#innovation', '#careers'].map(tag => (
              <button key={tag} onClick={() => handleTagClick(tag)} disabled={isScraping} className={`px-4 py-2 text-sm font-medium rounded-full transition-all hover:scale-105 ${selectedFilter === tag ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                {tag}
              </button>
            ))}
          </div>

          <div className="mb-6 text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredPosts.length}</span> of <span className="font-semibold text-gray-900">{posts.length}</span> posts
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Previously Searched Viral Posts</h3>
            </div>

            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
                <p className="text-gray-600 text-lg">Loading viral posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center p-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                <div className="flex flex-col items-center">
                  <div className="bg-gray-100 rounded-full p-6 mb-4">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-600 mb-6">Enter a search query and click "Search Posts" to find viral content</p>
                  <button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">Clear all filters</button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {filteredPosts.map((post) => (
                  <div key={post.id} onClick={() => handleSelectViralPost(post)} className={`border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${selectedViralPost?.id === post.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 bg-white'}`}>
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center flex-1">
                          {post.profile_image_url ? (
                            <img src={post.profile_image_url} alt={post.author_name} className="w-12 h-12 rounded-full mr-3 object-cover ring-2 ring-gray-100" onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'U')}&background=random`; }} />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg mr-3 ring-2 ring-gray-100">
                              {post.author_name?.charAt(0) || 'U'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-base truncate">{post.author_name || 'Unknown User'}</h3>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {post.time_posted || 'Recently'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center bg-gradient-to-r from-green-400 to-green-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-sm">
                          <Zap className="h-3 w-3 mr-1" />
                          Viral
                        </div>
                      </div>
                      {post.label === 'Recommended' && post.similarity_score && (
                        <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-black-300 text-[11px] px-2 py-1 rounded-full font-semibold shadow-md ml-1 whitespace-nowrap">
                          ⭐ Recommended for compare ({(post.similarity_score * 100).toFixed(0)}% match)
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-grow flex flex-col">

                      <div className={`mb-4 flex-grow text-gray-700 leading-relaxed ${expandedPosts[post.id] ? 'whitespace-pre-line' : 'line-clamp-4'}`}>
                        {post.post_content}
                      </div>
                      {post.post_content && post.post_content.length > 200 && (
                        <button onClick={(e) => { e.stopPropagation(); toggleExpand(post.id); }} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center self-start mb-4">
                          {expandedPosts[post.id] ? (
                            <>Show less <ChevronUp className="ml-1 h-4 w-4" /></>
                          ) : (
                            <>Read more <ChevronDown className="ml-1 h-4 w-4" /></>
                          )}
                        </button>
                      )}

                      {post.post_image_url && (
                        <div className="mb-4 rounded-xl overflow-hidden">
                          <img src={post.post_image_url} alt="Post content" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300" onError={(e) => { const target = e.target as HTMLImageElement; target.style.display = 'none'; }} />
                        </div>
                      )}
                    </div>

                    <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-gray-600 text-sm">
                          <span className="flex items-center hover:text-blue-600 transition-colors">
                            <ThumbsUp className="h-4 w-4 mr-1.5" />
                            <span className="font-semibold">{post.likes || '0'}</span>
                          </span>
                          {/* <span className="flex items-center hover:text-blue-600 transition-colors">
                            <MessageSquare className="h-4 w-4 mr-1.5" />
                            <span className="font-semibold">{post.comments || '0'}</span>
                          </span>
                          <span className="flex items-center hover:text-blue-600 transition-colors">
                            <Share2 className="h-4 w-4 mr-1.5" />
                            <span className="font-semibold">{post.shares || '0'}</span>
                          </span> */}
                        </div>
                        <a href={post.linkedin_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 text-sm font-semibold whitespace-nowrap hover:underline transition-colors">
                          View Post →
                        </a>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          {post.engagement_rate || 'High'} Engagement
                        </span>
                        {selectedViralPost?.id === post.id && (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
