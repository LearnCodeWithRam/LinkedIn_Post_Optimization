from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from apps.accounts.jwt_serializers import EmailTokenObtainPairView

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),


    # LinkedIn Post Generator API
    path('api/v1/new_post/', include('apps.new_post.urls')),
    #API for post analyzer
    path('api/v1/post-analyzer/', include('apps.post_analyser.urls')),

    #API for post comparison with viral post
    path('api/v1/post-comparison/', include('apps.post_comparison.urls')),

    #api for scraping linkedin-posts
    path('api/v1/viralpost-scraping/', include('apps.viralpost_scraping.urls')),
    
    #api for viral post similarity search
    path('api/v1/check-similarity/', include('apps.check_similarity.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # JWT Authentication - v1
    path('api/v1/auth/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # API v1 Routes
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/linkedin/', include('apps.linkedin.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/predictions/', include('apps.predictions.urls')),
    path('api/v1/recommendations/', include('apps.recommendations.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/upload-excel/', include('apps.upload_excel_to_json.urls')),
    path('api/v1/personal-story/', include('apps.personal_story.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns

# Customize admin site
admin.site.site_header = "LinkedIn Analytics Admin"
admin.site.site_title = "LinkedIn Analytics"
admin.site.index_title = "Welcome to LinkedIn Analytics Administration"