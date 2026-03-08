from rest_framework import serializers


class PostComparisonRequestSerializer(serializers.Serializer):
    """Serializer for post comparison request."""
    
    user_post = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=10000,
        help_text="Your LinkedIn post content"
    )
    viral_post = serializers.CharField(
        required=True,
        allow_blank=False,
        max_length=10000,
        help_text="Viral post to compare against"
    )
    
    def validate_user_post(self, value):
        """Validate user post is not too short."""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Post content is too short. Minimum 10 characters required.")
        return value.strip()
    
    def validate_viral_post(self, value):
        """Validate viral post is not too short."""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Viral post content is too short. Minimum 10 characters required.")
        return value.strip()


class PostStructureComparisonSerializer(serializers.Serializer):
    """Structure comparison data."""
    
    user_word_count = serializers.IntegerField()
    viral_word_count = serializers.IntegerField()
    word_count_difference = serializers.IntegerField()
    user_hook_quality = serializers.CharField()
    viral_hook_quality = serializers.CharField()
    user_has_cta = serializers.BooleanField()
    viral_has_cta = serializers.BooleanField()
    structure_recommendation = serializers.CharField()
    optimal_length = serializers.CharField()


class ToneComparisonSerializer(serializers.Serializer):
    """Tone comparison data."""
    
    user_tone = serializers.CharField()
    viral_tone = serializers.CharField()
    friendly_score = serializers.IntegerField(min_value=0, max_value=100)
    persuasive_score = serializers.IntegerField(min_value=0, max_value=100)
    formal_score = serializers.IntegerField(min_value=0, max_value=100)
    tone_recommendation = serializers.CharField()
    needs_simplification = serializers.BooleanField()


class HashtagComparisonSerializer(serializers.Serializer):
    """Hashtag comparison data."""
    
    user_hashtags = serializers.ListField(child=serializers.CharField())
    viral_hashtags = serializers.ListField(child=serializers.CharField())
    user_hashtag_count = serializers.IntegerField()
    viral_hashtag_count = serializers.IntegerField()
    user_has_trending = serializers.BooleanField()
    viral_has_trending = serializers.BooleanField()
    missing_trending_tags = serializers.ListField(child=serializers.CharField())
    hashtag_recommendation = serializers.CharField()


class EngagementComparisonSerializer(serializers.Serializer):
    """Engagement comparison data."""
    
    user_engagement_rate = serializers.CharField(allow_blank=True)
    viral_engagement_rate = serializers.CharField(allow_blank=True)
    engagement_difference = serializers.CharField(allow_blank=True)
    user_content_type = serializers.CharField(allow_blank=True)
    viral_content_type = serializers.CharField(allow_blank=True)
    media_recommendation = serializers.CharField(allow_blank=True)
    posting_time_recommendation = serializers.CharField(allow_blank=True)


class KeywordAnalysisSerializer(serializers.Serializer):
    """Keyword analysis data."""
    
    user_primary_keywords = serializers.ListField(child=serializers.CharField())
    viral_primary_keywords = serializers.ListField(child=serializers.CharField())
    user_secondary_keywords = serializers.ListField(child=serializers.CharField())
    viral_secondary_keywords = serializers.ListField(child=serializers.CharField())
    missing_keywords = serializers.ListField(child=serializers.CharField())


class ComparisonDimensionSerializer(serializers.Serializer):
    """Individual comparison dimension for table."""
    
    dimension = serializers.CharField()
    viral = serializers.CharField(allow_blank=True)
    user = serializers.CharField(allow_blank=True)
    difference = serializers.CharField(allow_blank=True)
    status = serializers.CharField()


class ViralityInsightSerializer(serializers.Serializer):
    """Virality insight data."""
    
    type = serializers.CharField()
    title = serializers.CharField()
    description = serializers.CharField()
    icon = serializers.CharField()


class PostComparisonResponseSerializer(serializers.Serializer):
    """Complete post comparison response."""
    
    virality_score = serializers.IntegerField(min_value=0, max_value=100)
    virality_status = serializers.CharField()
    
    structure = PostStructureComparisonSerializer()
    tone = ToneComparisonSerializer()
    hashtags = HashtagComparisonSerializer()
    engagement = EngagementComparisonSerializer()
    keywords = KeywordAnalysisSerializer()
    
    comparison_table = ComparisonDimensionSerializer(many=True)
    insights = ViralityInsightSerializer(many=True)
    
    strengths = serializers.ListField(child=serializers.CharField())
    improvements = serializers.ListField(child=serializers.CharField())
    priority_actions = serializers.ListField(child=serializers.CharField())


class ErrorResponseSerializer(serializers.Serializer):
    """Error response serializer."""
    
    error = serializers.CharField()
    details = serializers.CharField(required=False)