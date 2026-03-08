import { BarChart2, ChevronDown, ChevronUp, Clock, Filter, MessageSquare, RefreshCw, Search, Share2, Sparkles, ThumbsUp, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Post {
  id: string;
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
}



const ViralPostTab: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

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

      setPosts(processedPosts);
      setFilteredPosts(processedPosts);
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
        throw new Error('Failed to scrape posts');
      }

      const result = await response.json();

      if (result.success) {
        // After successful scraping, fetch the updated posts from JSON
        await fetchPostsFromJSON();
      } else {
        throw new Error(result.error || 'Scraping failed');
      }
    } catch (err) {
      console.error('Error scraping posts:', err);
      setError('Failed to scrape viral posts. Please try again.');
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

  const applyLocalFilters = () => {
    let filtered = [...posts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.post_content?.toLowerCase().includes(query) ||
        post.author_name?.toLowerCase().includes(query) ||
        post.linkedin_url?.toLowerCase().includes(query)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(post =>
        post.post_content?.toLowerCase().includes(selectedFilter.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
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

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading viral posts...</p>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-6 shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-bold text-red-800">Error Loading Posts</h3>
              <p className="text-red-700 mt-2">{error}</p>
              <button
                onClick={fetchPostsFromJSON}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Discover Viral LinkedIn Posts
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                Search viral posts or browse existing content
              </p>
            </div>
            <button
              onClick={fetchPostsFromJSON}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-all hover:scale-105"
              title="Refresh posts"
              disabled={isScraping}
            >
              <RefreshCw className={`h-5 w-5 ${isScraping ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Enter search query to scrape viral posts..."
                className="w-full pl-12 pr-4 py-3 md:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isScraping}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                disabled={isScraping || !searchQuery.trim()}
                className={`px-6 md:px-8 py-3 md:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-md flex-1 sm:flex-none ${isScraping || !searchQuery.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:scale-105'
                  }`}
              >
                {isScraping ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Search Posts</span>
                  </>
                )}
              </button>
              <button
                onClick={clearFilters}
                className="border-2 border-gray-300 hover:bg-gray-100 text-gray-700 px-4 py-3 md:py-4 rounded-xl font-semibold flex items-center gap-2 transition-all"
                disabled={isScraping}
              >
                <Filter className="h-5 w-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && posts.length > 0 && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Filter Tags */}
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-full flex items-center gap-2 shadow-md">
              <BarChart2 className="h-4 w-4" />
              Trending Topics
            </span>
            {['#marketing', '#technology', '#business', '#innovation', '#careers'].map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                disabled={isScraping}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all hover:scale-105 ${selectedFilter === tag
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredPosts.length}</span> of <span className="font-semibold text-gray-900">{posts.length}</span> posts
          </div>
        </div>

        {/* Scraping Progress Indicator */}
        {isScraping && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg mb-8 animate-pulse">
            <div className="flex items-center">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900">Scraping Viral Posts...</h3>
                <p className="text-blue-700 text-sm mt-1">This may take a few moments. Please wait.</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center p-16 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-6">Enter a search query and click "Scrape Posts" to find viral content</p>
              <button
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                {/* Post Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1">
                      {post.profile_image_url ? (
                        <img
                          src={post.profile_image_url}
                          alt={post.author_name}
                          className="w-12 h-12 rounded-full mr-3 object-cover ring-2 ring-gray-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'U')}&background=random`;
                          }}
                        />
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
                </div>

                {/* Post Content */}
                <div className="p-5 flex-grow flex flex-col">
                  <div className={`mb-4 flex-grow text-gray-700 leading-relaxed ${expandedPosts[post.id] ? 'whitespace-pre-line' : 'line-clamp-4'}`}>
                    {post.post_content}
                  </div>
                  {post.post_content && post.post_content.length > 200 && (
                    <button
                      onClick={() => toggleExpand(post.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center self-start mb-4"
                    >
                      {expandedPosts[post.id] ? (
                        <>
                          Show less <ChevronUp className="ml-1 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Read more <ChevronDown className="ml-1 h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}

                  {post.post_image_url && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <img
                        src={post.post_image_url}
                        alt="Post content"
                        className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Post Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-gray-600 text-sm">
                      <span className="flex items-center hover:text-blue-600 transition-colors">
                        <ThumbsUp className="h-4 w-4 mr-1.5" />
                        <span className="font-semibold">{post.likes || '0'}</span>
                      </span>
                      <span className="flex items-center hover:text-blue-600 transition-colors">
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        <span className="font-semibold">{post.comments || '0'}</span>
                      </span>
                      <span className="flex items-center hover:text-blue-600 transition-colors">
                        <Share2 className="h-4 w-4 mr-1.5" />
                        <span className="font-semibold">{post.shares || '0'}</span>
                      </span>
                    </div>
                    <a
                      href={post.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold whitespace-nowrap hover:underline transition-colors"
                    >
                      View Post →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViralPostTab;