"""
Post Analysis Cache Service
Manages caching of AI analysis results using JSON file storage.
Reduces redundant AI processing by storing and retrieving previous analyses.
"""

import json
import os
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any
import logging
logger = logging.getLogger(__name__)


class AnalysisCacheService:
    """
    Service for caching post analysis results to JSON file.
    """
    
    # Cache configuration
    CACHE_DIR = Path(__file__).parent / 'cache'
    CACHE_FILE = CACHE_DIR / 'analysis_cache.json'
    CACHE_VERSION = '1.0.0'
    DEFAULT_CACHE_DAYS = 7
    MAX_CACHE_ENTRIES = 200
    
    def __init__(self):
        """Initialize cache service and ensure cache directory exists."""
        self._ensure_cache_dir()
    
    def _ensure_cache_dir(self):
        """Create cache directory if it doesn't exist."""
        try:
            self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"Cache directory ready: {self.CACHE_DIR}")
        except Exception as e:
            logger.error(f"Failed to create cache directory: {e}")
    
    def _load_cache(self) -> Dict[str, Any]:
        """
        Load cache from JSON file.
        
        Returns:
            Dict containing cache data with version and analyses
        """
        try:
            if not self.CACHE_FILE.exists():
                return {
                    'version': self.CACHE_VERSION,
                    'analyses': {}
                }
            
            with open(self.CACHE_FILE, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            # Check version compatibility
            if cache_data.get('version') != self.CACHE_VERSION:
                logger.warning(f"Cache version mismatch. Clearing cache.")
                return {
                    'version': self.CACHE_VERSION,
                    'analyses': {}
                }
            
            # Clean expired entries
            cache_data['analyses'] = self._clean_expired_entries(
                cache_data.get('analyses', {})
            )
            
            return cache_data
        
        except json.JSONDecodeError as e:
            logger.error(f"Cache file corrupted: {e}. Creating new cache.")
            return {
                'version': self.CACHE_VERSION,
                'analyses': {}
            }
        except Exception as e:
            logger.error(f"Error loading cache: {e}")
            return {
                'version': self.CACHE_VERSION,
                'analyses': {}
            }
    
    def _save_cache(self, cache_data: Dict[str, Any]):
        """
        Save cache to JSON file.
        
        Args:
            cache_data: Dictionary containing cache data
        """
        try:
            # Limit cache size
            if len(cache_data.get('analyses', {})) > self.MAX_CACHE_ENTRIES:
                cache_data['analyses'] = self._trim_cache(cache_data['analyses'])
            
            with open(self.CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
            
            logger.debug(f"Cache saved: {len(cache_data.get('analyses', {}))} entries")
        
        except Exception as e:
            logger.error(f"Error saving cache: {e}")
    
    def _clean_expired_entries(self, analyses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove expired entries from cache.
        
        Args:
            analyses: Dictionary of cached analyses
            
        Returns:
            Dictionary with expired entries removed
        """
        now = datetime.now().isoformat()
        cleaned = {}
        removed_count = 0
        
        for post_id, data in analyses.items():
            expires_at = data.get('expires_at')
            if expires_at and expires_at > now:
                cleaned[post_id] = data
            else:
                removed_count += 1
        
        if removed_count > 0:
            logger.info(f"Removed {removed_count} expired cache entries")
        
        return cleaned
    
    def _trim_cache(self, analyses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trim cache to max size by removing oldest entries.
        
        Args:
            analyses: Dictionary of cached analyses
            
        Returns:
            Trimmed dictionary
        """
        # Sort by timestamp (newest first)
        sorted_analyses = sorted(
            analyses.items(),
            key=lambda x: x[1].get('timestamp', ''),
            reverse=True
        )
        
        # Keep only MAX_CACHE_ENTRIES
        trimmed = dict(sorted_analyses[:self.MAX_CACHE_ENTRIES])
        
        removed_count = len(analyses) - len(trimmed)
        if removed_count > 0:
            logger.info(f"Trimmed {removed_count} oldest cache entries")
        
        return trimmed
    
    def get_comparison_cache_key(self, user_post: str, viral_post: str) -> str:
        """
        Generate a unique cache key for a pair of posts.
        
        Args:
            user_post: Content of the user's post
            viral_post: Content of the viral post
            
        Returns:
            str: MD5 hash string to use as cache key
        """
        # Normalize content by stripping whitespace
        content = f"{user_post.strip()}|{viral_post.strip()}"
        return hashlib.md5(content.encode('utf-8')).hexdigest()

    def get_cached_analysis(self, post_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached analysis for a post ID.
        
        Args:
            post_id: Unique identifier for the post
            
        Returns:
            Cached analysis data or None if not found/expired
        """
        try:
            cache_data = self._load_cache()
            analyses = cache_data.get('analyses', {})
            
            cached_entry = analyses.get(post_id)
            
            if not cached_entry:
                logger.debug(f"No cache found for post_id: {post_id}")
                return None
            
            # Check expiration
            expires_at = cached_entry.get('expires_at')
            now = datetime.now().isoformat()
            
            if expires_at and expires_at <= now:
                logger.debug(f"Cache expired for post_id: {post_id}")
                self.remove_cached_analysis(post_id)
                return None
            
            logger.info(f"✓ Cache hit for post_id: {post_id}")
            return cached_entry.get('analysis_data')
        
        except Exception as e:
            logger.error(f"Error getting cached analysis: {e}")
            return None
    
    def set_cached_analysis(
        self,
        post_id: str,
        post_content: str,
        analysis_data: Dict[str, Any],
        cache_days: int = None
    ):
        """
        Save analysis to cache.
        
        Args:
            post_id: Unique identifier for the post
            post_content: Content of the post (for reference)
            analysis_data: Analysis result to cache
            cache_days: Number of days to cache (default: DEFAULT_CACHE_DAYS)
        """
        try:
            cache_data = self._load_cache()
            
            if cache_days is None:
                cache_days = self.DEFAULT_CACHE_DAYS
            
            now = datetime.now()
            expires_at = now + timedelta(days=cache_days)
            
            cache_entry = {
                'post_id': post_id,
                'post_content_preview': post_content[:200] if post_content else '',
                'analysis_data': analysis_data,
                'timestamp': now.isoformat(),
                'expires_at': expires_at.isoformat(),
                'cached_at': now.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            cache_data['analyses'][post_id] = cache_entry
            self._save_cache(cache_data)
            
            logger.info(f"✓ Cached analysis for post_id: {post_id} (expires: {expires_at.date()})")
        
        except Exception as e:
            logger.error(f"Error caching analysis: {e}")
    
    def remove_cached_analysis(self, post_id: str):
        """
        Remove cached analysis for a specific post.
        
        Args:
            post_id: Unique identifier for the post
        """
        try:
            cache_data = self._load_cache()
            
            if post_id in cache_data.get('analyses', {}):
                del cache_data['analyses'][post_id]
                self._save_cache(cache_data)
                logger.info(f"Removed cache for post_id: {post_id}")
        
        except Exception as e:
            logger.error(f"Error removing cached analysis: {e}")
    
    def clear_all_cache(self):
        """Clear all cached analyses."""
        try:
            cache_data = {
                'version': self.CACHE_VERSION,
                'analyses': {}
            }
            self._save_cache(cache_data)
            logger.info("Cleared all cached analyses")
        
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        try:
            cache_data = self._load_cache()
            analyses = cache_data.get('analyses', {})
            
            timestamps = [
                entry.get('timestamp', '')
                for entry in analyses.values()
            ]
            
            cache_size = 0
            if self.CACHE_FILE.exists():
                cache_size = self.CACHE_FILE.stat().st_size
            
            return {
                'total_entries': len(analyses),
                'cache_size_bytes': cache_size,
                'cache_size_kb': round(cache_size / 1024, 2),
                'oldest_entry': min(timestamps) if timestamps else None,
                'newest_entry': max(timestamps) if timestamps else None,
                'cached_post_ids': list(analyses.keys())
            }
        
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {
                'total_entries': 0,
                'cache_size_bytes': 0,
                'cache_size_kb': 0,
                'oldest_entry': None,
                'newest_entry': None,
                'cached_post_ids': []
            }
    
    def has_cached_analysis(self, post_id: str) -> bool:
        """
        Check if post has valid cached analysis.
        
        Args:
            post_id: Unique identifier for the post
            
        Returns:
            True if cached analysis exists and is not expired
        """
        return self.get_cached_analysis(post_id) is not None


# Singleton instance
analysis_cache_service = AnalysisCacheService()
