"""
URL configuration for Viral Post Scraping API
"""

from django.urls import path
from .views import (
    ScrapeViralPostsView,
    CacheStatsView,
    ClearCacheView,
    CacheDetailView,
    LinkedInPostsView
)

app_name = 'viralpost_scraping'

urlpatterns = [
    # Scraping endpoint
    path('linkedin-posts/', LinkedInPostsView.as_view(), name='linkedin_posts'),
    path('scrape/', ScrapeViralPostsView.as_view(), name='scrape_viral_posts'),
    
    # Cache management endpoints
    path('cache/stats/', CacheStatsView.as_view(), name='cache_stats'),
    path('cache/clear/', ClearCacheView.as_view(), name='clear_cache'),
    path('cache/<str:post_id>/', CacheDetailView.as_view(), name='cache_detail'),
]