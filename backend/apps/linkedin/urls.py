from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# router.register(r'posts', views.PostViewSet, basename='post')
# router.register(r'connections', views.ConnectionViewSet, basename='connection')

app_name = 'linkedin'

urlpatterns = [
    path('', include(router.urls)),
    # path('sync/', views.SyncPostsView.as_view(), name='sync_posts'),
    # path('stats/', views.LinkedInStatsView.as_view(), name='stats'),
]