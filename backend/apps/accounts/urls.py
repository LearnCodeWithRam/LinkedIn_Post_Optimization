from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
# from . import simple_auth
from .jwt_serializers import EmailTokenObtainPairView

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'preferences', views.UserPreferenceViewSet, basename='preference')

app_name = 'accounts'

urlpatterns = [
    path('', include(router.urls)),
    
    # JWT Token endpoints (for frontend)
    path('token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # # SIMPLE Authentication endpoints (easy to use)
    # path('simple-register/', simple_auth.simple_signup, name='simple_register'),
    # path('simple-login/', simple_auth.simple_login, name='simple_login'),
    # path('simple-profile/', simple_auth.simple_profile, name='simple_profile'),
    
    # Complex Authentication endpoints (original)
    path('send-otp/', views.SendOTPView.as_view(), name='send_otp'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # LinkedIn Integration
    path('linkedin/connect/', views.LinkedInConnectView.as_view(), name='linkedin_connect'),
    path('linkedin/callback/', views.LinkedInCallbackView.as_view(), name='linkedin_callback'),
    path('linkedin/disconnect/', views.LinkedInDisconnectView.as_view(), name='linkedin_disconnect'),
    
    # LinkedIn Sign-In (OAuth Authentication)
    path('linkedin/signin/', views.LinkedInSignInView.as_view(), name='linkedin_signin'),
    path('linkedin/signin/callback/', views.LinkedInSignInCallbackView.as_view(), name='linkedin_signin_callback'),

    # Google Sign-In (OAuth Authentication)
    path('google/signin/', views.GoogleSignInView.as_view(), name='google_signin'),
    path('google/signin/callback/', views.GoogleSignInCallbackView.as_view(), name='google_signin_callback'),
    
    # Onboarding Status
    path('onboarding-status/', views.OnboardingStatusView.as_view(), name='onboarding_status'),
    path('complete-onboarding/', views.CompleteOnboardingView.as_view(), name='complete_onboarding'),
    path('mark-data-uploaded/', views.MarkDataUploadedView.as_view(), name='mark_data_uploaded'),
]