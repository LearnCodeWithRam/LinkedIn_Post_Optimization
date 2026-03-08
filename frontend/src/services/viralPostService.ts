import axios from 'axios';

const API_BASE_URL = '/api/viralpost-scraping';

export interface ViralPost {
  id: string;
  author: string;
  timeAgo: string;
  preview: string;
  fullText: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  score: number;
  mediaType?: 'image' | 'video' | 'document' | 'none';
  hashtags?: string[];
  postUrl?: string;
  publishedAt?: string;
}

export const searchViralPosts = async (searchQuery: string, userRole: string = '', userTopics: string = ''): Promise<ViralPost[]> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scrape/`, {
      search_query: searchQuery,
      personalize: !!userRole || !!userTopics,
      user_role: userRole,
      user_topics: userTopics,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
    });
    
    // Transform the API response to match our frontend interface
    return response.data.posts?.map((post: any) => ({
      id: post.id,
      author: post.author_name,
      timeAgo: post.time_ago,
      preview: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
      fullText: post.content,
      engagement: {
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
      },
      score: post.engagement_score || 0,
      mediaType: post.media_type || 'none',
      hashtags: post.hashtags || [],
      postUrl: post.url,
      publishedAt: post.published_at,
    })) || [];
  } catch (error) {
    console.error('Error searching viral posts:', error);
    throw error;
  }
};
