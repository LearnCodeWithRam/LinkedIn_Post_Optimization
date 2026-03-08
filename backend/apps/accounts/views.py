from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.shortcuts import redirect
from django.conf import settings
from django.utils import timezone
import requests
import logging
import secrets

from .models import UserPreference
from .utils import send_otp_email, verify_otp
from .serializers import (
    UserSerializer,
    UserPreferenceSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    OnboardingStatusSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class SendOTPView(APIView):
    """Send OTP to the provided email address."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if send_otp_email(email):
            return Response({'message': 'OTP sent successfully'})
        else:
            return Response({'error': 'Failed to send OTP'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RegisterView(generics.CreateAPIView):

    """User registration endpoint."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    authentication_classes = [] # Disable authentication for registration
    
    def create(self, request, *args, **kwargs):
        # Add password_confirm if not present (for backward compatibility)
        data = request.data.copy()
        if 'password' in data and 'password_confirm' not in data:
            data['password_confirm'] = data['password']
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens with proper string conversion
        try:
            refresh = RefreshToken()
            refresh['user_id'] = str(user.id)
            refresh['email'] = user.email
            
            access = refresh.access_token
            access['user_id'] = str(user.id)
            access['email'] = user.email
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(access),
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # If token generation fails, still return the user but without tokens
            logger.error(f"Token generation failed: {str(e)}")
            return Response({
                'user': UserSerializer(user).data,
                'message': 'User created but token generation failed. Please login.',
            }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint."""
    permission_classes = [AllowAny]
    # authentication_classes = [] # Disable authentication for login
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        
        if user:
            refresh = RefreshToken.for_user(user)
            
            # Check if user has uploaded data
            from apps.upload_excel_to_json.models import ExcelUploadLog
            has_uploaded_data = ExcelUploadLog.objects.filter(
                user=user,
                status='success'
            ).exists()
            
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'has_uploaded_data': has_uploaded_data,
                'onboarding_completed': user.onboarding_completed,
                'data_uploaded': user.data_uploaded
            })
        
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(APIView):
    """User logout endpoint."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Successfully logged out'})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Change user password."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Old password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})


class UserViewSet(viewsets.ModelViewSet):
    """CRUD operations for users."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN:
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user details."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class UserPreferenceViewSet(viewsets.ModelViewSet):
    """CRUD operations for user preferences."""
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserPreference.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class LinkedInConnectView(APIView):
    """Initiate LinkedIn OAuth flow."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Build LinkedIn OAuth URL
        auth_url = (
            f"https://www.linkedin.com/oauth/v2/authorization?"
            f"response_type=code&"
            f"client_id={settings.LINKEDIN_CLIENT_ID}&"
            f"redirect_uri={settings.LINKEDIN_REDIRECT_URI}&"
            f"scope={' '.join(settings.LINKEDIN_SCOPE)}"
        )
        return Response({'auth_url': auth_url})


class LinkedInCallbackView(APIView):
    """Handle LinkedIn OAuth callback."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        code = request.GET.get('code')
        if not code:
            return Response(
                {'error': 'No authorization code provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Exchange code for access token
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': settings.LINKEDIN_REDIRECT_URI,
            'client_id': settings.LINKEDIN_CLIENT_ID,
            'client_secret': settings.LINKEDIN_CLIENT_SECRET,
        }
        
        try:
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            # Save tokens to user
            user = request.user
            user.linkedin_access_token = token_data.get('access_token')
            user.linkedin_refresh_token = token_data.get('refresh_token')
            user.save()
            
            return Response({
                'message': 'LinkedIn account connected successfully',
                'connected': True
            })
        
        except requests.exceptions.RequestException as e:
            logger.exception(f"LinkedIn OAuth error: {str(e)}")
            return Response(
                {'error': 'Failed to connect LinkedIn account'},
                status=status.HTTP_400_BAD_REQUEST
            )




class LinkedInDisconnectView(APIView):
    """Disconnect LinkedIn account."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        user.linkedin_access_token = None
        user.linkedin_refresh_token = None
        user.linkedin_id = None
        user.save()
        
        return Response({
            'message': 'LinkedIn account disconnected successfully',
            'connected': False
        })


class LinkedInSignInView(APIView):
    """Initiate LinkedIn OAuth flow for sign-in (authentication)."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        # Generate secure random state parameter for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Sign the state with Django's SECRET_KEY and timestamp
        # This is more secure than sessions and works across domains
        from django.core.signing import TimestampSigner
        signer = TimestampSigner()
        signed_state = signer.sign(state)
        
        # Build LinkedIn OAuth URL with OpenID Connect scopes
        auth_url = (
            f"https://www.linkedin.com/oauth/v2/authorization?"
            f"response_type=code&"
            f"client_id={settings.LINKEDIN_CLIENT_ID}&"
            f"redirect_uri={settings.LINKEDIN_SIGNIN_REDIRECT_URI}&"
            f"scope=openid profile email w_member_social r_profile_basicinfo&"
            f"state={signed_state}"
        )
        
        logger.info(f"LinkedIn sign-in initiated from IP: {self.get_client_ip(request)}")
        
        return Response({'auth_url': auth_url})
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class LinkedInSignInCallbackView(APIView):
    """Handle LinkedIn OAuth callback for sign-in."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    # LinkedIn OAuth URLs
    TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
    USERINFO_URL = "https://api.linkedin.com/v2/userinfo"
    
    def get(self, request):
        # Get state and code from query parameters
        returned_state = request.GET.get('state')
        code = request.GET.get('code')
        error = request.GET.get('error')
        
        client_ip = self.get_client_ip(request)
        
        # Handle OAuth errors
        if error:
            logger.warning(f"LinkedIn OAuth error from IP {client_ip}: {error}")
            return Response(
                {'error': f'LinkedIn authorization failed: {error}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate state parameter (CSRF protection)
        if not returned_state:
            logger.warning(f"Missing state parameter from IP {client_ip}")
            return Response(
                {'error': 'Invalid state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the signed state token
        from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
        signer = TimestampSigner()
        
        try:
            # Verify signature and check if not expired (max_age=600 seconds = 10 minutes)
            original_state = signer.unsign(returned_state, max_age=600)
            logger.info(f"State validated successfully for IP {client_ip}")
        except SignatureExpired:
            logger.warning(f"State expired from IP {client_ip}")
            return Response(
                {'error': 'State parameter expired. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except BadSignature:
            logger.warning(f"Invalid state signature from IP {client_ip}")
            return Response(
                {'error': 'Invalid state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate authorization code
        if not code:
            logger.warning(f"Missing authorization code from IP {client_ip}")
            return Response(
                {'error': 'No authorization code provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Exchange code for access token
            redirect_uri = settings.LINKEDIN_SIGNIN_REDIRECT_URI
            logger.info(f"Exchanging code for token with redirect_uri: {redirect_uri}")
            
            token_response = requests.post(
                self.TOKEN_URL,
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': redirect_uri,
                    'client_id': settings.LINKEDIN_CLIENT_ID,
                    'client_secret': settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=10
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token request failed from IP {client_ip}: {token_response.text}")
                return Response(
                    {'error': 'Failed to obtain access token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            
            # Fetch user info from LinkedIn
            user_response = requests.get(
                self.USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
            
            if user_response.status_code != 200:
                logger.error(f"User info request failed from IP {client_ip}: {user_response.text}")
                return Response(
                    {'error': 'Failed to fetch user information'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_data = user_response.json()
            
            # Extract user information
            linkedin_id = user_data.get('sub')  # LinkedIn user ID
            email = user_data.get('email')
            name = user_data.get('name', '')
            picture = user_data.get('picture')
            
            # Validate required fields
            if not linkedin_id or not email:
                logger.error(f"Missing required user data from IP {client_ip}")
                return Response(
                    {'error': 'Incomplete user information from LinkedIn'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parse name into first and last name
            name_parts = name.split(' ', 1)
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            # Find or create user
            user = None
            is_new_user = False
            
            # Try to find by LinkedIn ID first
            try:
                user = User.objects.get(linkedin_id=linkedin_id)
                logger.info(f"Existing user found by LinkedIn ID: {email}")
            except User.DoesNotExist:
                # Try to find by email
                try:
                    user = User.objects.get(email=email)
                    logger.info(f"Existing user found by email: {email}")
                except User.DoesNotExist:
                    # Create new user
                    is_new_user = True
                    user = User.objects.create_user(
                        email=email,
                        first_name=first_name,
                        last_name=last_name,
                        linkedin_id=linkedin_id,
                        onboarding_completed=False,  # New users need onboarding
                        data_uploaded=False
                    )
                    logger.info(f"New user created via LinkedIn OAuth: {email} from IP {client_ip}")
            
            # Update user profile with LinkedIn data
            user.linkedin_id = linkedin_id
            user.linkedin_access_token = access_token
            user.linkedin_profile_picture = picture
            
            # Update name if not already set
            if not user.first_name and first_name:
                user.first_name = first_name
            if not user.last_name and last_name:
                user.last_name = last_name
            
            user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Prepare response data
            response_data = {
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'onboarding_completed': user.onboarding_completed,
                'data_uploaded': user.data_uploaded,
                'is_new_user': is_new_user
            }
            
            # Log successful sign-in
            logger.info(
                f"LinkedIn sign-in successful: {email} "
                f"(new_user={is_new_user}, onboarding={user.onboarding_completed}) "
                f"from IP {client_ip}"
            )
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except requests.exceptions.RequestException as e:
            logger.exception(f"LinkedIn OAuth request failed from IP {client_ip}: {str(e)}")
            return Response(
                {'error': 'Failed to communicate with LinkedIn'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.exception(f"Unexpected error during LinkedIn sign-in from IP {client_ip}: {str(e)}")
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip



class OnboardingStatusView(APIView):
    """Get current user's onboarding status."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Determine what the user needs to complete
        needs_data_upload = not user.data_uploaded
        needs_onboarding = not user.onboarding_completed
        
        data = {
            'onboarding_completed': user.onboarding_completed,
            'data_uploaded': user.data_uploaded,
            'needs_onboarding': needs_onboarding,
            'needs_data_upload': needs_data_upload,
            'onboarding_completed_at': user.onboarding_completed_at,
            'data_uploaded_at': user.data_uploaded_at,
        }
        
        serializer = OnboardingStatusSerializer(data)
        return Response(serializer.data)


class CompleteOnboardingView(APIView):
    """Mark onboarding as completed for the current user."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if not user.onboarding_completed:
            user.onboarding_completed = True
            user.onboarding_completed_at = timezone.now()
            user.save()
            
            return Response({
                'success': True,
                'message': 'Onboarding completed successfully',
                'onboarding_completed_at': user.onboarding_completed_at
            })
        
        return Response({
            'success': True,
            'message': 'Onboarding already completed',
            'onboarding_completed_at': user.onboarding_completed_at
        })


class MarkDataUploadedView(APIView):
    """Mark data upload as completed for the current user."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        if not user.data_uploaded:
            user.data_uploaded = True
            user.data_uploaded_at = timezone.now()
            user.save()
            
            return Response({
                'success': True,
                'message': 'Data upload marked as completed',
                'data_uploaded_at': user.data_uploaded_at
            })
        
        return Response({
            'success': True,
            'message': 'Data already uploaded',
            'data_uploaded_at': user.data_uploaded_at
        })


class GoogleSignInView(APIView):
    """Initiate Google OAuth flow for sign-in (authentication)."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        # Generate secure random state parameter for CSRF protection
        state = secrets.token_urlsafe(32)
        
        # Sign the state with Django's SECRET_KEY
        from django.core.signing import TimestampSigner
        signer = TimestampSigner()
        signed_state = signer.sign(state)
        
        # Build Google OAuth URL
        auth_url = (
            f"{settings.GOOGLE_AUTH_URL}?"
            f"response_type=code&"
            f"client_id={settings.GOOGLE_CLIENT_ID}&"
            f"redirect_uri={settings.GOOGLE_SIGNIN_REDIRECT_URI}&"
            f"scope={' '.join(settings.GOOGLE_SCOPE)}&"
            f"state={signed_state}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        
        logger.info(f"Google sign-in initiated from IP: {self.get_client_ip(request)}")
        
        return Response({'auth_url': auth_url})
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class GoogleSignInCallbackView(APIView):
    """Handle Google OAuth callback for sign-in."""
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        # Get state and code from query parameters
        returned_state = request.GET.get('state')
        code = request.GET.get('code')
        error = request.GET.get('error')
        
        client_ip = self.get_client_ip(request)
        
        # Handle OAuth errors
        if error:
            logger.warning(f"Google OAuth error from IP {client_ip}: {error}")
            return Response(
                {'error': f'Google authorization failed: {error}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate state parameter (CSRF protection)
        if not returned_state:
            logger.warning(f"Missing state parameter from IP {client_ip}")
            return Response(
                {'error': 'Invalid state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the signed state token
        from django.core.signing import TimestampSigner, SignatureExpired, BadSignature
        signer = TimestampSigner()
        
        try:
            # Verify signature and check if not expired (max_age=600 seconds = 10 minutes)
            original_state = signer.unsign(returned_state, max_age=600)
        except SignatureExpired:
            logger.warning(f"State expired from IP {client_ip}")
            return Response(
                {'error': 'State parameter expired. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except BadSignature:
            logger.warning(f"Invalid state signature from IP {client_ip}")
            return Response(
                {'error': 'Invalid state parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate authorization code
        if not code:
            logger.warning(f"Missing authorization code from IP {client_ip}")
            return Response(
                {'error': 'No authorization code provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Exchange code for access token
            redirect_uri = settings.GOOGLE_SIGNIN_REDIRECT_URI
            logger.info(f"Exchanging code for token with redirect_uri: {redirect_uri}")
            
            token_response = requests.post(
                settings.GOOGLE_TOKEN_URL,
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': redirect_uri,
                    'client_id': settings.GOOGLE_CLIENT_ID,
                    'client_secret': settings.GOOGLE_CLIENT_SECRET,
                },
                timeout=10
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token request failed from IP {client_ip}: {token_response.text}")
                return Response(
                    {'error': 'Failed to obtain access token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token_data = token_response.json()
            access_token = token_data.get('access_token')
            refresh_token = token_data.get('refresh_token')
            
            # Fetch user info from Google
            user_response = requests.get(
                settings.GOOGLE_USERINFO_URL,
                headers={'Authorization': f'Bearer {access_token}'},
                timeout=10
            )
            
            if user_response.status_code != 200:
                logger.error(f"User info request failed from IP {client_ip}: {user_response.text}")
                return Response(
                    {'error': 'Failed to fetch user information'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user_data = user_response.json()
            
            # Extract user information
            google_id = user_data.get('sub')
            email = user_data.get('email')
            email_verified = user_data.get('email_verified')
            name = user_data.get('name', '')
            given_name = user_data.get('given_name', '')
            family_name = user_data.get('family_name', '')
            picture = user_data.get('picture')
            
            # Validate required fields
            if not google_id or not email:
                logger.error(f"Missing required user data from IP {client_ip}")
                return Response(
                    {'error': 'Incomplete user information from Google'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Find or create user
            user = None
            is_new_user = False
            
            # Try to find by Google ID first
            try:
                user = User.objects.get(google_id=google_id)
                logger.info(f"Existing user found by Google ID: {email}")
            except User.DoesNotExist:
                # Try to find by email
                try:
                    user = User.objects.get(email=email)
                    logger.info(f"Existing user found by email: {email}")
                except User.DoesNotExist:
                    # Create new user
                    is_new_user = True
                    user = User.objects.create_user(
                        email=email,
                        first_name=given_name,
                        last_name=family_name,
                        google_id=google_id,
                        onboarding_completed=False,  # New users need onboarding
                        data_uploaded=False
                    )
                    logger.info(f"New user created via Google OAuth: {email} from IP {client_ip}")
            
            # Update user profile with Google data
            user.google_id = google_id
            user.google_access_token = access_token
            if refresh_token:
                user.google_refresh_token = refresh_token
            user.google_profile_picture = picture
            
            # Update name if not already set
            if not user.first_name and given_name:
                user.first_name = given_name
            if not user.last_name and family_name:
                user.last_name = family_name
            
            user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Prepare response data
            response_data = {
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'onboarding_completed': user.onboarding_completed,
                'data_uploaded': user.data_uploaded,
                'is_new_user': is_new_user
            }
            
            # Log successful sign-in
            logger.info(
                f"Google sign-in successful: {email} "
                f"(new_user={is_new_user}, onboarding={user.onboarding_completed}) "
                f"from IP {client_ip}"
            )
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except requests.exceptions.RequestException as e:
            logger.exception(f"Google OAuth request failed from IP {client_ip}: {str(e)}")
            return Response(
                {'error': 'Failed to communicate with Google'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            logger.exception(f"Unexpected error during Google sign-in from IP {client_ip}: {str(e)}")
            return Response(
                {'error': 'An unexpected error occurred'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip













# from django.contrib.auth import authenticate
# from django.utils.translation import gettext_lazy as _
# from rest_framework import generics, status, views
# from rest_framework.permissions import AllowAny, IsAuthenticated
# from rest_framework.response import Response
# from rest_framework_simplejwt.tokens import RefreshToken
# from rest_framework_simplejwt.views import TokenObtainPairView

# from apps.accounts.models import User, UserPreference
# from apps.accounts.permissions import IsAdmin, IsOwner
# from apps.accounts.serializers import (
#     UserSerializer, UserCreateSerializer, UserUpdateSerializer,
#     ChangePasswordSerializer, LinkedInTokenSerializer, TokenResponseSerializer,
#     UserPreferenceSerializer, UserPreferenceUpdateSerializer
# )

# class LoginView(TokenObtainPairView):
#     def post(self, request, *args, **kwargs):
#         email = request.data.get('email')
#         password = request.data.get('password')
        
#         user = authenticate(email=email, password=password)
#         if not user:
#             return Response(
#                 {'error': _('Invalid credentials')},
#                 status=status.HTTP_401_UNAUTHORIZED
#             )
        
#         refresh = RefreshToken.for_user(user)
#         response = Response({
#             'access': str(refresh.access_token),
#             'refresh': str(refresh),
#             'user': UserSerializer(user).data
#         })
        
#         # Set refresh token as an HTTP-only cookie
#         response.set_cookie(
#             'refresh_token',
#             str(refresh),
#             httponly=True,
#             samesite='Lax',
#             secure=not request.META.get('HTTP_HOST', '').startswith('localhost'),
#             max_age=7 * 24 * 60 * 60  # 7 days
#         )
        
#         return response

# class LogoutView(views.APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         try:
#             refresh_token = request.COOKIES.get('refresh_token')
#             token = RefreshToken(refresh_token)
#             token.blacklist()
            
#             response = Response(status=status.HTTP_205_RESET_CONTENT)
#             response.delete_cookie('refresh_token')
#             return response
#         except Exception:
#             return Response(status=status.HTTP_205_RESET_CONTENT)

# class LinkedInCallbackView(views.APIView):
#     permission_classes = [AllowAny]
#     serializer_class = LinkedInTokenSerializer

#     def post(self, request):
#         serializer = self.serializer_class(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         # TODO: Implement LinkedIn OAuth logic
#         return Response({'message': 'Not implemented'}, status=status.HTTP_501_NOT_IMPLEMENTED)

# class UserListCreateView(generics.ListCreateAPIView):
#     queryset = User.objects.all()
#     permission_classes = [IsAuthenticated, IsAdmin]
    
#     def get_serializer_class(self):
#         if self.request.method == 'POST':
#             return UserCreateSerializer
#         return UserSerializer

# class CurrentUserView(generics.RetrieveUpdateAPIView):
#     serializer_class = UserSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_object(self):
#         return self.request.user
    
#     def get_serializer_class(self):
#         if self.request.method in ['PUT', 'PATCH']:
#             return UserUpdateSerializer
#         return UserSerializer

# class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = User.objects.all()
#     permission_classes = [IsAuthenticated, IsOwner|IsAdmin]
    
#     def get_serializer_class(self):
#         if self.request.method in ['PUT', 'PATCH']:
#             return UserUpdateSerializer
#         return UserSerializer

# class ChangePasswordView(generics.UpdateAPIView):
#     serializer_class = ChangePasswordSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_object(self):
#         return self.request.user
    
#     def update(self, request, *args, **kwargs):
#         user = self.get_object()
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         # Check old password
#         if not user.check_password(serializer.validated_data['old_password']):
#             return Response(
#                 {'old_password': [_('Wrong password.')]},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         # Set new password
#         user.set_password(serializer.validated_data['new_password'])
#         user.save()
        
#         return Response(status=status.HTTP_204_NO_CONTENT)

# class UserPreferenceView(generics.RetrieveUpdateAPIView):
#     serializer_class = UserPreferenceSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_object(self):
#         preference, _ = UserPreference.objects.get_or_create(user=self.request.user)
#         return preference
    
#     def get_serializer_class(self):
#         if self.request.method in ['PUT', 'PATCH']:
#             return UserPreferenceUpdateSerializer
#         return UserPreferenceSerializer
