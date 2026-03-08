"""
LinkedIn Post Analyzer - URL Configuration
"""
from django.urls import path
from .views import PostAnalyzerAPIView, ViralPostAnalyzerAPIView, HealthCheckAPIView

app_name = 'post_analyser'

urlpatterns = [
    path('analyze/', PostAnalyzerAPIView.as_view(), name='analyze-post'),
    path('viralpost-analyze/', ViralPostAnalyzerAPIView.as_view(), name='analyze-viral-post'),
    # path('health/', HealthCheckAPIView.as_view(), name='health-check'),
]