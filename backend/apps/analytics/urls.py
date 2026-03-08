from django.urls import path, include
from rest_framework import routers
from .views import (
    ContentAnalysisViewSet, 
    EngagementPredictionViewSet, 
    TimeSeriesAnalysisViewSet, 
    get_linkedin_analytics,
    get_dashboard_data,
    get_follower_analytics,
    get_visitor_analytics,
    get_demographics,
    get_all_posts,
)

router = routers.DefaultRouter()
router.register(r'content-analysis', ContentAnalysisViewSet, basename='content-analysis')
router.register(r'predictions', EngagementPredictionViewSet, basename='predictions')
router.register(r'time-series', TimeSeriesAnalysisViewSet, basename='time-series')

urlpatterns = [
    path('', include(router.urls)),
    path('linkedin-analytics/', get_linkedin_analytics, name='linkedin-analytics'),
    # MongoDB-based endpoints
    path('dashboard/', get_dashboard_data, name='dashboard-data'),
    path('followers/', get_follower_analytics, name='follower-analytics'),
    path('visitors/', get_visitor_analytics, name='visitor-analytics'),
    path('demographics/', get_demographics, name='demographics'),
    path('posts/', get_all_posts, name='all-posts'),
]
