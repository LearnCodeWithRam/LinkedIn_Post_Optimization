from datetime import datetime
from django.utils import timezone
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import authentication, exceptions

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that handles token validation and refresh.
    """
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except TokenError as e:
            try:
                # Try to get the refresh token from the cookie
                refresh_token = request.COOKIES.get('refresh_token')
                if not refresh_token:
                    raise InvalidToken('No valid token found')

                # Validate and refresh the token
                refresh = RefreshToken(refresh_token)
                if refresh['exp'] < datetime.timestamp(timezone.now()):
                    raise InvalidToken('Refresh token has expired')

                # Get the user from the refresh token
                user = refresh.user
                if not user.is_active:
                    raise InvalidToken('User is inactive')

                # Generate new access token
                access_token = str(refresh.access_token)
                request.META['HTTP_AUTHORIZATION'] = f'Bearer {access_token}'

                return super().authenticate(request)
            except Exception:
                raise InvalidToken('Token is invalid or expired')
