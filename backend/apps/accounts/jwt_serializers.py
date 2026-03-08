from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
import json
from uuid import UUID

User = get_user_model()


class UUIDEncoder(json.JSONEncoder):
    """Custom JSON encoder for UUID objects."""
    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)


class EmailTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Find user by email
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})
        
        # Check password
        if not user.check_password(password):
            raise serializers.ValidationError({'detail': 'Invalid email or password.'})
        
        # Check if active
        if not user.is_active:
            raise serializers.ValidationError({'detail': 'User account is disabled.'})
        
        # Generate tokens with proper string conversion
        try:
            # Create refresh token
            refresh = RefreshToken()
            refresh['user_id'] = str(user.id)  # Always string
            refresh['email'] = user.email
            
            # Create access token from refresh
            access = refresh.access_token
            access['user_id'] = str(user.id)  # Always string
            access['email'] = user.email
            
            return {
                'refresh': str(refresh),
                'access': str(access),
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'first_name': user.first_name or '',
                    'last_name': user.last_name or '',
                    'role': str(user.role),
                }
            }
        except Exception as e:
            raise serializers.ValidationError({'detail': f'Token generation failed: {str(e)}'})


class EmailTokenObtainPairView(TokenObtainPairView):
    """Custom token view that uses EmailTokenObtainPairSerializer."""
    serializer_class = EmailTokenObtainPairSerializer
