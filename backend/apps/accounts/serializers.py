
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserPreference

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    is_linkedin_connected = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'role', 'title', 'phone_number',
            'profile_picture', 'linkedin_profile_picture', 'is_linkedin_connected',
            'organization_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=False)
    otp = serializers.CharField(write_only=True, required=True, min_length=6, max_length=6)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'otp'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password': "Password fields didn't match."
            })
            
        # Verify OTP
        from .utils import verify_otp
        if not verify_otp(attrs['email'], attrs['otp']):
            raise serializers.ValidationError({
                'otp': "Invalid or expired OTP."
            })
            
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('otp') # Remove OTP from data before creating user
        user = User.objects.create_user(**validated_data)
        
        # Create default preferences for user
        UserPreference.objects.create(user=user)
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password."""
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password': "Password fields didn't match."
            })
        return attrs


class UserPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for UserPreference model."""
    
    class Meta:
        model = UserPreference
        fields = [
            'id', 'email_notifications', 'push_notifications',
            'report_frequency', 'custom_report_time', 'timezone',
            'dashboard_layout', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user serializer for nested representations."""
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_picture']


class OnboardingStatusSerializer(serializers.Serializer):
    """Serializer for onboarding status response."""
    
    onboarding_completed = serializers.BooleanField()
    data_uploaded = serializers.BooleanField()
    needs_onboarding = serializers.BooleanField()
    needs_data_upload = serializers.BooleanField()
    onboarding_completed_at = serializers.DateTimeField(allow_null=True)
    data_uploaded_at = serializers.DateTimeField(allow_null=True)















# from rest_framework import serializers
# from django.contrib.auth.password_validation import validate_password
# from apps.accounts.models import User, UserPreference

# class UserPreferenceSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = UserPreference
#         fields = [
#             'id', 'email_notifications', 'push_notifications',
#             'report_frequency', 'custom_report_time', 'timezone',
#             'dashboard_layout'
#         ]

# class UserSerializer(serializers.ModelSerializer):
#     preferences = UserPreferenceSerializer(read_only=True)
#     full_name = serializers.SerializerMethodField()
    
#     class Meta:
#         model = User
#         fields = [
#             'id', 'email', 'username', 'first_name', 'last_name',
#             'role', 'profile_picture', 'phone_number', 'title',
#             'organization_id', 'organization_name', 'is_active',
#             'last_login', 'date_joined', 'preferences', 'full_name',
#             'is_linkedin_connected'
#         ]
#         read_only_fields = ['id', 'is_active', 'last_login', 'date_joined']

#     def get_full_name(self, obj):
#         return obj.get_full_name()

# class UserCreateSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     confirm_password = serializers.CharField(write_only=True, required=True)

#     class Meta:
#         model = User
#         fields = [
#             'email', 'username', 'password', 'confirm_password',
#             'first_name', 'last_name', 'role'
#         ]
#         extra_kwargs = {
#             'email': {'required': True},
#             'first_name': {'required': True},
#             'last_name': {'required': True},
#         }

#     def validate(self, attrs):
#         if attrs['password'] != attrs.pop('confirm_password'):
#             raise serializers.ValidationError({"password": "Password fields didn't match."})
#         return attrs

#     def create(self, validated_data):
#         user = User.objects.create_user(**validated_data)
#         UserPreference.objects.create(user=user)
#         return user

# class UserUpdateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = [
#             'username', 'first_name', 'last_name', 'profile_picture',
#             'phone_number', 'title'
#         ]

# class ChangePasswordSerializer(serializers.Serializer):
#     old_password = serializers.CharField(required=True)
#     new_password = serializers.CharField(required=True, validators=[validate_password])
#     confirm_new_password = serializers.CharField(required=True)

#     def validate(self, attrs):
#         if attrs['new_password'] != attrs['confirm_new_password']:
#             raise serializers.ValidationError({"new_password": "Password fields didn't match."})
#         return attrs

# class LinkedInTokenSerializer(serializers.Serializer):
#     code = serializers.CharField(required=True)
#     state = serializers.CharField(required=True)

# class TokenResponseSerializer(serializers.Serializer):
#     access = serializers.CharField()
#     refresh = serializers.CharField()
#     user = UserSerializer()

# class UserPreferenceUpdateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = UserPreference
#         fields = [
#             'email_notifications', 'push_notifications',
#             'report_frequency', 'custom_report_time', 'timezone',
#             'dashboard_layout'
#         ]
