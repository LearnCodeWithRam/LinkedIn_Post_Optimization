from django.db import models
from django.conf import settings
import uuid
from apps.core.base_models import BaseModel

class HashtagPerformance(BaseModel):
    """
    Track performance metrics for hashtags used in posts.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hashtag_performance')
    hashtag = models.CharField(max_length=255)
    usage_count = models.IntegerField(default=0)
    total_engagement = models.IntegerField(default=0)
    avg_engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'hashtag_performance'
        unique_together = ['user', 'hashtag']
        ordering = ['-avg_engagement_rate']
        indexes = [
            models.Index(fields=['user', '-avg_engagement_rate']),
        ]

    def __str__(self):
        return f"{self.hashtag} - {self.avg_engagement_rate}%"

class ContentTopic(BaseModel):
    """
    Track content topics and their performance metrics.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='content_topics')
    topic_name = models.CharField(max_length=255)
    topic_keywords = models.JSONField(default=list, blank=True)  # Changed from ArrayField to JSONField
    post_count = models.IntegerField(default=0)
    avg_engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'content_topics'
        unique_together = ['user', 'topic_name']
        ordering = ['-avg_engagement_rate']

    def __str__(self):
        return f"{self.topic_name} ({self.post_count} posts)"

class ContentAnalysis(BaseModel):
    """
    Detailed content analysis for LinkedIn posts.
    """
    post = models.OneToOneField('linkedin.LinkedInPost', on_delete=models.CASCADE, related_name='content_analysis')
    sentiment_score = models.FloatField()
    sentiment_details = models.JSONField(default=dict)
    topics = models.JSONField(default=list)
    topic_scores = models.JSONField(default=dict)
    readability_score = models.FloatField()
    readability_metrics = models.JSONField(default=dict)
    tone = models.CharField(max_length=50)
    tone_scores = models.JSONField(default=dict)
    keywords = models.JSONField(default=list)
    key_phrases = models.JSONField(default=list)
    entities = models.JSONField(default=list)
    language_quality_score = models.FloatField(default=0.0)
    content_category = models.CharField(max_length=100)
    analysis_version = models.CharField(max_length=50)

    class Meta:
        db_table = 'content_analysis'

    def __str__(self):
        return f"Analysis for post {self.post_id}"

class EngagementPrediction(BaseModel):
    """
    Engagement predictions for LinkedIn posts.
    """
    post = models.OneToOneField('linkedin.LinkedInPost', on_delete=models.CASCADE, related_name='prediction')
    predicted_engagement_rate = models.FloatField()
    success_probability = models.FloatField()
    confidence_score = models.FloatField()
    recommended_posting_time = models.DateTimeField()
    time_sensitivity = models.FloatField(default=0.0)
    audience_match_score = models.FloatField(default=0.0)
    viral_potential = models.FloatField(default=0.0)
    improvement_suggestions = models.JSONField(default=list)
    feature_importance = models.JSONField(default=dict)
    model_version = models.CharField(max_length=50)
    prediction_context = models.JSONField(default=dict)

    class Meta:
        db_table = 'analytics_engagement_predictions'

    def __str__(self):
        return f"Prediction for post {self.post_id}"

class TimeSeriesAnalysis(BaseModel):
    """
    Time-based analysis of user's LinkedIn activity and engagement.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    analysis_type = models.CharField(max_length=50)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    metrics = models.JSONField(default=dict)
    trends = models.JSONField(default=dict)
    seasonality = models.JSONField(default=dict)
    anomalies = models.JSONField(default=list)
    statistical_data = models.JSONField(default=dict)

    class Meta:
        db_table = 'time_series_analysis'
        indexes = [
            models.Index(fields=['user', 'period_start', 'period_end']),
            models.Index(fields=['analysis_type']),
        ]

    def __str__(self):
        return f"{self.analysis_type} analysis for {self.user.email}"

class AudienceInsight(BaseModel):
    """
    Audience analytics and insights for a user's LinkedIn network.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    demographic_data = models.JSONField(default=dict)
    industry_distribution = models.JSONField(default=dict)
    company_size_distribution = models.JSONField(default=dict)
    job_functions = models.JSONField(default=dict)
    geographic_distribution = models.JSONField(default=dict)
    engagement_patterns = models.JSONField(default=dict)
    active_times = models.JSONField(default=dict)
    interests = models.JSONField(default=list)
    period = models.CharField(max_length=20)

    class Meta:
        db_table = 'audience_insights'
        indexes = [
            models.Index(fields=['user', 'period']),
        ]

    def __str__(self):
        return f"Audience insights for {self.user.email}"