import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, ThumbsUp, Share2, Clock, Zap } from 'lucide-react';

interface CachedPost {
  post_id: string;
  post_content_preview: string;
  analysis_data: {
    structure: {
      recommendations: string[];
    };
    hashtags?: {
      hashtags_found?: string[];
    };
    analytics?: {
      expected_engagement_rate?: string;
      content_type?: string;
    };
  };
  timestamp: string;
}

interface ViralPost {
  id: string;
  title: string;
  preview: string;
  content: string;
  timeAgo: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  score: number;
  hashtags: string[];
  recommendations: string[];
  contentType: string;
}

// Function to calculate time ago from timestamp
const getTimeAgo = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

// Function to extract title from content preview
const extractTitle = (preview: string): { title: string; content: string } => {
  const titleMatch = preview.match(/Title: (.*?)(\n|$)/);
  if (titleMatch && titleMatch[1]) {
    return {
      title: titleMatch[1],
      content: preview.replace(`Title: ${titleMatch[1]}`, '').trim()
    };
  }
  return { title: 'Untitled', content: preview };
};

const ViralPosts: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<ViralPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format engagement numbers (e.g., 1200 -> 1.2k)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  // Generate random engagement metrics
  const generateEngagement = (): { likes: number; comments: number; shares: number } => {
    return {
      likes: Math.floor(Math.random() * 1000) + 100,
      comments: Math.floor(Math.random() * 100) + 10,
      shares: Math.floor(Math.random() * 200) + 20
    };
  };

  // Calculate viral score based on engagement
  const calculateScore = (engagementRate?: string): number => {
    if (!engagementRate) return Math.floor(Math.random() * 30) + 70; // 70-100
    const rate = parseFloat(engagementRate.replace('%', ''));
    return isNaN(rate) ? Math.floor(Math.random() * 30) + 70 : Math.min(100, Math.floor(rate * 10));
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real app, you would fetch this from your backend API
      // const response = await fetch('/api/viral-posts');
      // const data = await response.json();

      // For now, we'll use the local cache file
      const response = await fetch('/api/v1/viralpost-scraping/cache/analysis');
      const data = await response.json();

      const processedPosts: ViralPost[] = Object.values(data.analyses || {}).map((post: any) => {
        const { title, content } = extractTitle(post.post_content_preview);
        const engagement = generateEngagement();

        return {
          id: post.post_id,
          title,
          preview: content.length > 150 ? content.substring(0, 150) + '...' : content,
          content,
          timeAgo: getTimeAgo(post.timestamp || new Date().toISOString()),
          engagement,
          score: calculateScore(post.analysis_data?.analytics?.expected_engagement_rate),
          hashtags: post.analysis_data?.hashtags?.hashtags_found || [],
          recommendations: post.analysis_data?.structure?.recommendations || [],
          contentType: post.analysis_data?.analytics?.content_type || 'post'
        };
      });

      setPosts(processedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    try {
      // In a real app, you would make an API call to search
      // For now, we'll just filter the existing posts
      const filtered = posts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setPosts(filtered);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial posts
  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Viral Posts</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{post.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{post.timeAgo}</span>
                    {post.contentType && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {post.contentType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                  <Zap className="h-4 w-4 mr-1" />
                  <span>Viral Score: {post.score}%</span>
                </div>
              </div>

              <p className="my-3 whitespace-pre-line">{post.preview}</p>

              {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 my-2">
                  {post.hashtags.map((tag) => (
                    <span key={tag} className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 space-y-2">
                {post.recommendations.slice(0, 2).map((rec, idx) => (
                  <div key={idx} className="flex items-start text-sm text-gray-600">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span>{rec.replace(/\d+:\.?\s*/, '')}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t">
                <div className="flex items-center text-gray-500">
                  <div className="flex items-center mr-4">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span>{formatNumber(post.engagement.likes)}</span>
                  </div>
                  <div className="flex items-center mr-4">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span>{formatNumber(post.engagement.comments)}</span>
                  </div>
                  <div className="flex items-center">
                    <Share2 className="h-4 w-4 mr-1" />
                    <span>{formatNumber(post.engagement.shares)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {post.hashtags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                  {post.hashtags.length > 2 && (
                    <span className="text-gray-500 text-xs">+{post.hashtags.length - 2} more</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViralPosts;
