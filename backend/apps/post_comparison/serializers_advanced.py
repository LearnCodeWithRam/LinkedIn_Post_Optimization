"""
Serializers for advanced post comparison with analysis.
"""
from rest_framework import serializers


class CompareWithAnalysisRequestSerializer(serializers.Serializer):
    """Request serializer for compare-with-analysis endpoint."""
    user_post_id = serializers.CharField(required=False, allow_blank=True, help_text="ID of user's post for caching")
    user_post_content = serializers.CharField(required=True, help_text="User's LinkedIn post content")
    viral_post_id = serializers.CharField(required=False, allow_blank=True, help_text="ID of viral post for caching")
    viral_post_content = serializers.CharField(required=True, help_text="Viral post content")
    force_refresh = serializers.BooleanField(required=False, default=False, help_text="Force refresh all caches")


class CompareWithAnalysisResponseSerializer(serializers.Serializer):
    """Response serializer for compare-with-analysis endpoint."""
    success = serializers.BooleanField()
    message = serializers.CharField()
    user_post_analysis = serializers.DictField(help_text="Analysis of user's post")
    viral_post_analysis = serializers.DictField(help_text="Analysis of viral post")
    comparison_result = serializers.DictField(help_text="Comparison between both posts")
    cached = serializers.DictField(help_text="Cache status for each analysis")
    processing_time_ms = serializers.IntegerField(help_text="Total processing time in milliseconds")
