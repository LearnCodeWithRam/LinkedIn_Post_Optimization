"""
App configuration for Viral Post Scraping.
"""

from django.apps import AppConfig


class ViralpostScrapingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.viralpost_scraping'
    verbose_name = 'Viral Post Scraping'
    
    def ready(self):
        """
        Perform initialization when the app is ready.
        """
        # Import cache service to initialize it
        # Singleton instance
        try:
            from .cache.cache_service import analysis_cache_service
            # Just referencing it to ensure it's initialized
            _ = analysis_cache_service
        except ImportError:
            pass
  