"""
LinkedIn Post Analyzer - DRF Serializers
"""
from rest_framework import serializers


class StructureAnalysisSerializer(serializers.Serializer):
    """Serializer for post structure analysis."""
    hook_length = serializers.IntegerField()
    hook_quality = serializers.CharField()
    rehook_present = serializers.BooleanField()
    main_content_length = serializers.IntegerField()
    has_wrap_up = serializers.BooleanField()
    has_cta = serializers.BooleanField()
    structure_score = serializers.CharField()
    recommendations = serializers.ListField(child=serializers.CharField())


class HashtagAnalysisSerializer(serializers.Serializer):
    """Serializer for hashtag analysis."""
    hashtags_found = serializers.ListField(child=serializers.CharField())
    hashtag_count = serializers.IntegerField()
    relevance_score = serializers.CharField()
    spam_risk = serializers.CharField()
    has_broad_hashtags = serializers.BooleanField()
    has_niche_hashtags = serializers.BooleanField()
    placement_quality = serializers.CharField()
    recommendations = serializers.ListField(child=serializers.CharField())


class EngagementAnalysisSerializer(serializers.Serializer):
    """Serializer for engagement analytics."""
    overall_sentiment = serializers.CharField()
    engagement_potential = serializers.CharField()
    expected_impressions = serializers.CharField()
    expected_engagement_rate = serializers.CharField()
    content_type = serializers.CharField()
    strengths = serializers.ListField(child=serializers.CharField())
    weaknesses = serializers.ListField(child=serializers.CharField())
    improvement_suggestions = serializers.ListField(child=serializers.CharField())


class ToneAnalysisSerializer(serializers.Serializer):
    """Serializer for tone analysis."""
    friendly_score = serializers.IntegerField()
    persuasive_score = serializers.IntegerField()
    formal_score = serializers.IntegerField()
    tone_recommendation = serializers.CharField()
    needs_simplification = serializers.BooleanField()


class TaggingAnalysisSerializer(serializers.Serializer):
    """Serializer for tagging analysis."""
    tags_found = serializers.ListField(child=serializers.CharField())
    tag_count = serializers.IntegerField()
    tagging_quality = serializers.CharField()
    has_context = serializers.BooleanField()
    spam_risk = serializers.CharField()
    recommendations = serializers.ListField(child=serializers.CharField())


class KeywordOptimizationSerializer(serializers.Serializer):
    """Serializer for keyword optimization analysis."""
    primary_keywords = serializers.ListField(child=serializers.CharField())
    keyword_density = serializers.DictField()
    trending_keywords = serializers.ListField(child=serializers.CharField())
    trending_keyword_count = serializers.IntegerField()
    seo_score = serializers.CharField()
    keyword_relevance = serializers.CharField()
    search_visibility_score = serializers.IntegerField()
    tone_analysis = ToneAnalysisSerializer()
    missing_keywords = serializers.ListField(child=serializers.CharField())
    keyword_placement_quality = serializers.CharField()
    recommendations = serializers.ListField(child=serializers.CharField())


class LinkedInPostOptimizationSerializer(serializers.Serializer):
    """Main serializer for complete LinkedIn post optimization."""
    structure = StructureAnalysisSerializer()
    hashtags = HashtagAnalysisSerializer()
    analytics = EngagementAnalysisSerializer()
    tagging = TaggingAnalysisSerializer()
    keywords = KeywordOptimizationSerializer()
    overall_score = serializers.CharField()
    virality_score = serializers.IntegerField()
    priority_actions = serializers.ListField(child=serializers.CharField())


class PostAnalyzerRequestSerializer(serializers.Serializer):
    """Serializer for incoming post analysis requests."""
    post_content = serializers.CharField(
        required=True,
        allow_blank=False,
        min_length=10,
        max_length=10000,
        help_text="The LinkedIn post content to analyze"
    )
    post_id = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=255,
        help_text="Optional unique identifier for caching"
    )
    force_refresh = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Force refresh analysis, bypassing cache"
    )
    
    def validate_post_content(self, value):
        """Validate post content."""
        if not value.strip():
            raise serializers.ValidationError("Post content cannot be empty or whitespace only.")
        return value.strip()


class PostAnalyzerResponseSerializer(serializers.Serializer):
    """Serializer for post analyzer response."""
    success = serializers.BooleanField()
    message = serializers.CharField(required=False)
    data = LinkedInPostOptimizationSerializer(required=False)
    error = serializers.CharField(required=False)