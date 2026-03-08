/**
 * AI Analysis Cache Service
 * 
 * Manages caching of AI post analysis results in localStorage
 * to avoid redundant API calls for already analyzed posts.
 */

import { AIAnalysisData } from './postAnalyzer.service';

interface CachedAnalysis {
  postId: string;
  postContent: string;
  analysisData: AIAnalysisData;
  timestamp: number;
  expiresAt: number;
}

interface AnalysisCacheStorage {
  analyses: CachedAnalysis[];
  version: string;
}

const CACHE_KEY = 'ai_post_analysis_cache';
const CACHE_VERSION = '1.0.0';
const DEFAULT_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_CACHE_SIZE = 50; // Maximum number of cached analyses

class AnalysisCacheService {
  /**
   * Get cache storage from localStorage
   */
  private getCache(): AnalysisCacheStorage {
    try {
      const cacheStr = localStorage.getItem(CACHE_KEY);
      if (!cacheStr) {
        return { analyses: [], version: CACHE_VERSION };
      }

      const cache: AnalysisCacheStorage = JSON.parse(cacheStr);
      
      // Check version compatibility
      if (cache.version !== CACHE_VERSION) {
        console.log('Cache version mismatch, clearing cache');
        this.clearCache();
        return { analyses: [], version: CACHE_VERSION };
      }

      // Filter out expired entries
      const now = Date.now();
      cache.analyses = cache.analyses.filter(
        (analysis) => analysis.expiresAt > now
      );

      return cache;
    } catch (error) {
      console.error('Error reading cache:', error);
      return { analyses: [], version: CACHE_VERSION };
    }
  }

  /**
   * Save cache storage to localStorage
   */
  private saveCache(cache: AnalysisCacheStorage): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving cache:', error);
      // If storage is full, clear old entries and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearOldestEntries(10);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (retryError) {
          console.error('Failed to save cache after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Get cached analysis for a post ID
   */
  getCachedAnalysis(postId: string): AIAnalysisData | null {
    try {
      const cache = this.getCache();
      const cached = cache.analyses.find((item) => item.postId === postId);

      if (!cached) {
        console.log(`No cached analysis found for post ${postId}`);
        return null;
      }

      const now = Date.now();
      if (cached.expiresAt <= now) {
        console.log(`Cached analysis expired for post ${postId}`);
        this.removeCachedAnalysis(postId);
        return null;
      }

      console.log(`Using cached analysis for post ${postId}`);
      return cached.analysisData;
    } catch (error) {
      console.error('Error getting cached analysis:', error);
      return null;
    }
  }

  /**
   * Save analysis to cache
   */
  setCachedAnalysis(
    postId: string,
    postContent: string,
    analysisData: AIAnalysisData,
    cacheDuration: number = DEFAULT_CACHE_DURATION
  ): void {
    try {
      const cache = this.getCache();
      const now = Date.now();

      // Remove existing entry for this post if it exists
      cache.analyses = cache.analyses.filter((item) => item.postId !== postId);

      // Add new entry
      const newEntry: CachedAnalysis = {
        postId,
        postContent,
        analysisData,
        timestamp: now,
        expiresAt: now + cacheDuration,
      };

      cache.analyses.push(newEntry);

      // Sort by timestamp (newest first)
      cache.analyses.sort((a, b) => b.timestamp - a.timestamp);

      // Trim cache if it exceeds max size
      if (cache.analyses.length > MAX_CACHE_SIZE) {
        cache.analyses = cache.analyses.slice(0, MAX_CACHE_SIZE);
      }

      this.saveCache(cache);
      console.log(`Cached analysis for post ${postId}`);
    } catch (error) {
      console.error('Error saving cached analysis:', error);
    }
  }

  /**
   * Remove cached analysis for a specific post
   */
  removeCachedAnalysis(postId: string): void {
    try {
      const cache = this.getCache();
      cache.analyses = cache.analyses.filter((item) => item.postId !== postId);
      this.saveCache(cache);
      console.log(`Removed cached analysis for post ${postId}`);
    } catch (error) {
      console.error('Error removing cached analysis:', error);
    }
  }

  /**
   * Clear all cached analyses
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('Cleared all cached analyses');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear oldest entries from cache
   */
  private clearOldestEntries(count: number): void {
    try {
      const cache = this.getCache();
      if (cache.analyses.length > count) {
        cache.analyses = cache.analyses.slice(0, -count);
        this.saveCache(cache);
        console.log(`Cleared ${count} oldest cache entries`);
      }
    } catch (error) {
      console.error('Error clearing oldest entries:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    oldestEntry: number | null;
    newestEntry: number | null;
    totalSize: number;
  } {
    try {
      const cache = this.getCache();
      const cacheStr = localStorage.getItem(CACHE_KEY);
      
      return {
        totalEntries: cache.analyses.length,
        oldestEntry: cache.analyses.length > 0 
          ? cache.analyses[cache.analyses.length - 1].timestamp 
          : null,
        newestEntry: cache.analyses.length > 0 
          ? cache.analyses[0].timestamp 
          : null,
        totalSize: cacheStr ? new Blob([cacheStr]).size : 0,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        totalEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        totalSize: 0,
      };
    }
  }

  /**
   * Check if a post has cached analysis
   */
  hasCachedAnalysis(postId: string): boolean {
    const analysis = this.getCachedAnalysis(postId);
    return analysis !== null;
  }

  /**
   * Get all cached post IDs
   */
  getCachedPostIds(): string[] {
    try {
      const cache = this.getCache();
      return cache.analyses.map((item) => item.postId);
    } catch (error) {
      console.error('Error getting cached post IDs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const analysisCacheService = new AnalysisCacheService();
