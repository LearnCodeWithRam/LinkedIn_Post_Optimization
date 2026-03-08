"""
Personal Story API Serializers
"""
from rest_framework import serializers


class PersonalStorySerializer(serializers.Serializer):
    """Serializer for PersonalStory data"""
    user_id = serializers.CharField(read_only=True)
    role = serializers.CharField(required=True, max_length=100)
    industry = serializers.CharField(required=True, max_length=100)
    seniority_level = serializers.CharField(required=False, allow_blank=True, max_length=50)
    company_size = serializers.CharField(required=False, allow_blank=True, max_length=50)
    interests = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    content_topics = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        allow_empty=True
    )
    job_description = serializers.CharField(required=False, allow_blank=True)
    career_goals = serializers.CharField(required=False, allow_blank=True)
    personal_story = serializers.CharField(required=False, allow_blank=True)
    content_tone = serializers.CharField(required=False, allow_blank=True, max_length=50)
    post_length_preference = serializers.CharField(required=False, allow_blank=True, max_length=50)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class PersonalStoryChoicesSerializer(serializers.Serializer):
    """Serializer for returning available choices"""
    roles = serializers.ListField(child=serializers.CharField())
    industries = serializers.ListField(child=serializers.CharField())
    seniority_levels = serializers.ListField(child=serializers.CharField())
    company_sizes = serializers.ListField(child=serializers.CharField())
    interests = serializers.ListField(child=serializers.CharField())
    content_topics = serializers.ListField(child=serializers.CharField())
    content_tones = serializers.ListField(child=serializers.CharField())
    post_length_preferences = serializers.ListField(child=serializers.CharField())
