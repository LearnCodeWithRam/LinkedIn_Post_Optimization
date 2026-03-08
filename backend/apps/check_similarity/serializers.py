"""
Serializers for Viral Post Similarity API
"""

from rest_framework import serializers


class SimilarityRequestSerializer(serializers.Serializer):
    """Request serializer for similarity search"""
    post_content = serializers.CharField(
        required=True,
        help_text="The LinkedIn post content to find similar posts for"
    )
    top_k = serializers.IntegerField(
        required=False,
        default=3,
        min_value=1,
        max_value=10,
        help_text="Number of similar posts to return (1-10)"
    )


class ViralPostSerializer(serializers.Serializer):
    """Serializer for viral post data"""
    post_id = serializers.CharField()
    similarity_score = serializers.FloatField()
    label = serializers.CharField()
    post_content = serializers.CharField()
    author_name = serializers.CharField()
    likes = serializers.CharField()
    comments = serializers.IntegerField(required=False, default=0)
    shares = serializers.IntegerField(required=False, default=0)
    linkedin_url = serializers.CharField()
    time_posted = serializers.CharField(required=False, allow_blank=True)
    profile_image_url = serializers.CharField(required=False, allow_blank=True)
    post_image_url = serializers.CharField(required=False, allow_blank=True)


class SimilarityResponseSerializer(serializers.Serializer):
    """Response serializer for similarity search"""
    success = serializers.BooleanField()
    query_text = serializers.CharField()
    recommendations = ViralPostSerializer(many=True)
    total_found = serializers.IntegerField()
    keywords = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Extracted keywords/themes from the user's post"
    )
    search_query = serializers.CharField(
        required=False,
        help_text="Generated search query for finding viral posts"
    )


class IndexStatsSerializer(serializers.Serializer):
    """Serializer for index statistics"""
    total_posts = serializers.IntegerField()
    embedding_dimension = serializers.IntegerField()
    model_name = serializers.CharField()
    index_exists = serializers.BooleanField()
    metadata_exists = serializers.BooleanField()