"""
URL Configuration for Viral Post Similarity API
"""
from django.urls import path
from .views import FindSimilarPostsView, RebuildIndexView, IndexStatsView

app_name = 'check_similarity'

urlpatterns = [
    path('find-similar/', FindSimilarPostsView.as_view(), name='find-similar'),
    path('rebuild-index/', RebuildIndexView.as_view(), name='rebuild-index'),
    path('index-stats/', IndexStatsView.as_view(), name='index-stats'),
]