"""
Serializers for Viral Post Scraping API
"""

from rest_framework import serializers


class ScrapeRequestSerializer(serializers.Serializer):
    """
    Serializer for scraping request data.
    """
    search_query = serializers.CharField(
        max_length=500,
        required=True,
        help_text="Search query for finding viral posts"
    )
    personalize = serializers.BooleanField(
        default=False,
        required=False,
        help_text="Enable personalized search results"
    )
    user_role = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="User's role or position (used for personalization)"
    )
    user_topics = serializers.CharField(
        max_length=1000,
        required=False,
        allow_blank=True,
        help_text="Topics user usually posts about (used for personalization)"
    )
    
    def validate_search_query(self, value):
        """Validate search query is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Search query cannot be empty")
        return value.strip()
    
    def validate(self, data):
        """Validate that if personalize is True, user info is provided."""
        if data.get('personalize', False):
            if not data.get('user_role') and not data.get('user_topics'):
                raise serializers.ValidationError(
                    "When personalize is enabled, at least one of user_role or user_topics must be provided"
                )
        return data


class PostDataSerializer(serializers.Serializer):
    """
    Serializer for individual post data.
    """
    author_name = serializers.CharField(allow_null=True, required=False)
    profile_image_url = serializers.URLField(allow_null=True, required=False)
    time_posted = serializers.CharField(allow_null=True, required=False)
    post_content = serializers.CharField(allow_null=True, required=False)
    post_image_url = serializers.URLField(allow_null=True, required=False)
    linkedin_url = serializers.URLField(allow_null=True, required=False)
    likes = serializers.CharField(allow_null=True, required=False)


class ScrapeResponseSerializer(serializers.Serializer):
    """
    Serializer for scraping response data.
    """
    success = serializers.BooleanField()
    total_posts = serializers.IntegerField(required=False)
    posts = PostDataSerializer(many=True, required=False)
    search_query = serializers.CharField(required=False)
    personalized = serializers.BooleanField(required=False)
    scraped_at = serializers.DateTimeField(required=False)
    message = serializers.CharField(required=False)
    error = serializers.CharField(required=False, allow_null=True)


class CacheStatsSerializer(serializers.Serializer):
    """
    Serializer for cache statistics.
    """
    total_entries = serializers.IntegerField()
    cache_size_bytes = serializers.IntegerField()
    cache_size_kb = serializers.FloatField()
    oldest_entry = serializers.CharField(allow_null=True, required=False)
    newest_entry = serializers.CharField(allow_null=True, required=False)
    cached_post_ids = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class CachedAnalysisSerializer(serializers.Serializer):
    """
    Serializer for cached analysis data.
    """
    post_id = serializers.CharField()
    cached = serializers.BooleanField()
    analysis_data = serializers.DictField(required=False, allow_null=True)
    message = serializers.CharField(required=False)


class LinkedInPostSerializer(serializers.Serializer):
    id = serializers.CharField(required=False)
    author_name = serializers.CharField()
    profile_image_url = serializers.URLField(required=False, allow_blank=True)
    time_posted = serializers.CharField(required=False, allow_blank=True)
    post_content = serializers.CharField()
    post_image_url = serializers.URLField(required=False, allow_blank=True)
    linkedin_url = serializers.URLField()
    likes = serializers.CharField()
    engagement_rate = serializers.CharField(required=False)
    comments = serializers.IntegerField(required=False, default=0)
    shares = serializers.IntegerField(required=False, default=0)