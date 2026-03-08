from django.urls import path
from .views import PostComparisonView, HealthCheckView
from .views_advanced import CompareWithAnalysisView


app_name = 'post_comparison'

urlpatterns = [
    path('compare/', PostComparisonView.as_view(), name='compare-posts'),
    path('compare-with-analysis/', CompareWithAnalysisView.as_view(), name='compare-with-analysis'),
    path('health/', HealthCheckView.as_view(), name='health-check'),
]