"""
Serializers for viral pattern post optimization.
"""
from rest_framework import serializers


class ViralPatternOptimizationRequestSerializer(serializers.Serializer):
    """Request serializer for viral pattern optimization."""
    user_post_content = serializers.CharField(
        required=True,
        max_length=10000,
        help_text="User's original LinkedIn post content"
    )
    
    user_post_analysis = serializers.JSONField(
        required=True,
        help_text="AI analysis data of user's post"
    )
    
    viral_post_content = serializers.CharField(
        required=True,
        max_length=10000,
        help_text="Viral post content to emulate"
    )
    
    viral_post_analysis = serializers.JSONField(
        required=True,
        help_text="AI analysis data of viral post"
    )
    
    post_id = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        help_text="Optional ID for caching (e.g., 'user_123_viral_456')"
    )


class ViralPatternOptimizationResponseSerializer(serializers.Serializer):
    """Response serializer for viral pattern optimization."""
    success = serializers.BooleanField()
    data = serializers.DictField(child=serializers.CharField())
    cached = serializers.BooleanField(default=False)
