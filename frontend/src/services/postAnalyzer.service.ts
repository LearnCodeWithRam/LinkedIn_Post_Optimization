import axios from 'axios';
import { analysisCacheService } from './analysisCache.service';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const ANALYZE_ENDPOINT = `${API_BASE}/v1/post-analyzer/analyze/`;

export interface PostAnalyzerRequest {
  post_content: string;
  post_id?: string;
  force_refresh?: boolean;
}

export interface StructureAnalysis {
  hook_length: number;
  hook_quality: string;
  rehook_present: boolean;
  main_content_length: number;
  has_wrap_up: boolean;
  has_cta: boolean;
  structure_score: string;
  recommendations: string[];
}

export interface HashtagAnalysis {
  hashtags_found: string[];
  hashtag_count: number;
  relevance_score: string;
  spam_risk: string;
  has_broad_hashtags: boolean;
  has_niche_hashtags: boolean;
  placement_quality: string;
  recommendations: string[];
}

export interface EngagementAnalysis {
  overall_sentiment: string;
  engagement_potential: string;
  expected_impressions: string;
  expected_engagement_rate: string;
  content_type: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
}

export interface TaggingAnalysis {
  tags_found: string[];
  tag_count: number;
  tagging_quality: string;
  has_context: boolean;
  spam_risk: string;
  recommendations: string[];
}

export interface ToneAnalysis {
  friendly_score: number;
  persuasive_score: number;
  formal_score: number;
  tone_recommendation: string;
  needs_simplification: boolean;
}

export interface KeywordOptimization {
  primary_keywords: string[];
  keyword_density: Record<string, number>;
  trending_keywords: string[];
  trending_keyword_count: number;
  seo_score: string;
  keyword_relevance: string;
  search_visibility_score: number;
  tone_analysis: ToneAnalysis;
  missing_keywords: string[];
  keyword_placement_quality: string;
  recommendations: string[];
}

export interface AIAnalysisData {
  structure: StructureAnalysis;
  hashtags: HashtagAnalysis;
  analytics: EngagementAnalysis;
  tagging: TaggingAnalysis;
  keywords: KeywordOptimization;
  overall_score: string;
  virality_score: number;
  priority_actions: string[];
}

export interface PostAnalyzerResponse {
  success: boolean;
  message: string;
  data: AIAnalysisData;
  cached?: boolean;
}

/**
 * Analyze a post with caching support
 * 
 * @param postId - Unique identifier for the post
 * @param postContent - Content of the post to analyze
 * @param forceRefresh - If true, bypass cache and fetch fresh analysis
 * @returns Promise<AIAnalysisData>
 */
export const analyzePost = async (
  postId: string,
  postContent: string,
  forceRefresh: boolean = false
): Promise<AIAnalysisData> => {
  try {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cachedAnalysis = analysisCacheService.getCachedAnalysis(postId);
      if (cachedAnalysis) {
        console.log(`✓ Using cached analysis for post ${postId}`);
        return cachedAnalysis;
      }
    }

    // No cache or force refresh - call API
    console.log(`→ Fetching ${forceRefresh ? 'fresh' : 'new'} analysis for post ${postId}...`);
    const token = localStorage.getItem('authToken');

    const requestBody: PostAnalyzerRequest = {
      post_content: postContent,
      post_id: postId,
      force_refresh: forceRefresh
    };

    const response = await axios.post<PostAnalyzerResponse>(
      ANALYZE_ENDPOINT,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );

    if (response.data.success && response.data.data) {
      const analysisData = response.data.data;
      const wasCachedOnBackend = response.data.cached;

      // Cache the result in frontend (if not already cached on backend)
      if (!wasCachedOnBackend) {
        analysisCacheService.setCachedAnalysis(postId, postContent, analysisData);
        console.log(`✓ Analysis complete and cached (frontend + backend) for post ${postId}`);
      } else {
        // Also cache in frontend for consistency
        analysisCacheService.setCachedAnalysis(postId, postContent, analysisData);
        console.log(`✓ Analysis retrieved from backend cache for post ${postId}`);
      }

      return analysisData;
    } else {
      throw new Error(response.data.message || 'Analysis failed');
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Failed to analyze post');
  }
};

/**
 * Clear cached analysis for a specific post
 */
export const clearPostAnalysisCache = (postId: string): void => {
  analysisCacheService.removeCachedAnalysis(postId);
};

/**
 * Check if post has cached analysis
 */
export const hasAnalysisCache = (postId: string): boolean => {
  return analysisCacheService.hasCachedAnalysis(postId);
};

/**
 * Clear all cached analyses
 */
export const clearAllAnalysisCache = (): void => {
  analysisCacheService.clearCache();
};

/**
 * Get cache statistics
 */
export const getAnalysisCacheStats = () => {
  return analysisCacheService.getCacheStats();
};

// POST OPTIMIZATION
// ============================================

const OPTIMIZE_ENDPOINT = `${API_BASE}/v1/new_post/generate/optimized/`;

export interface OptimizePostRequest {
  original_post: string;
  analysis_data: AIAnalysisData;
  post_id?: string;
}

export interface OptimizePostResponse {
  success: boolean;
  data: {
    optimized_post: string;
    improvements_made: string[];
    original_post: string;
  };
  cached?: boolean;
}

/**
 * Optimize a post based on AI analysis recommendations
 * 
 * @param originalPost - Original post content
 * @param analysisData - Complete AI analysis data
 * @param postId - Optional post ID for caching
 * @returns Promise with optimized post and improvements
 */
export const optimizePost = async (
  originalPost: string,
  analysisData: AIAnalysisData,
  postId?: string
): Promise<OptimizePostResponse['data'] & { cached?: boolean }> => {
  try {
    console.log(`→ Optimizing post${postId ? ` (ID: ${postId})` : ''}...`);
    const token = localStorage.getItem('authToken');

    const requestBody: OptimizePostRequest = {
      original_post: originalPost,
      analysis_data: analysisData,
      post_id: postId
    };

    const response = await axios.post<OptimizePostResponse>(
      OPTIMIZE_ENDPOINT,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      }
    );

    if (response.data.success && response.data.data) {
      const wasCached = response.data.cached;
      console.log(`✓ Post optimization ${wasCached ? '(cached)' : 'complete'}`);
      return {
        ...response.data.data,
        cached: wasCached
      };
    } else {
      throw new Error('Optimization failed');
    }
  } catch (error: any) {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'Failed to optimize post');
  }
};
