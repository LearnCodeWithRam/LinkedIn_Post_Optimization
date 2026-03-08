# apps/linkedin/models.py
from django.db import models
import uuid

class LinkedInPost(models.Model):
    POST_TYPES = [
        ('text', 'Text Only'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('carousel', 'Carousel'),
        ('article', 'Article'),
    ]
    
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('negative', 'Negative'),
        ('neutral', 'Neutral'),
    ]
    
    TONE_CHOICES = [
        ('professional', 'Professional'),
        ('casual', 'Casual'),
        ('inspirational', 'Inspirational'),
        ('educational', 'Educational'),
        ('humorous', 'Humorous'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='posts')
    linkedin_post_id = models.CharField(max_length=255, unique=True)
    content = models.TextField()
    post_type = models.CharField(max_length=50, choices=POST_TYPES)
    media_urls = models.JSONField(default=list, blank=True)  # Changed from ArrayField to JSONField
    posted_at = models.DateTimeField(db_index=True)
    
    # Engagement Metrics
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)
    impressions_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)
    engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Content Features
    hashtags = models.JSONField(default=list, blank=True)  # Changed from ArrayField to JSONField
    mentions = models.JSONField(default=list, blank=True)  # Changed from ArrayField to JSONField
    word_count = models.IntegerField(null=True, blank=True)
    char_count = models.IntegerField(null=True, blank=True)
    has_emoji = models.BooleanField(default=False)
    has_cta = models.BooleanField(default=False)
    has_question = models.BooleanField(default=False)
    
    # Analysis Results
    sentiment_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    sentiment_label = models.CharField(max_length=20, choices=SENTIMENT_CHOICES, null=True, blank=True)
    tone = models.CharField(max_length=50, choices=TONE_CHOICES, null=True, blank=True)
    readability_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    topics = models.JSONField(default=dict, blank=True)
    
    # Metadata
    embedding_id = models.CharField(max_length=255, null=True, blank=True)  # Qdrant vector ID
    raw_data = models.JSONField(default=dict, blank=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'linkedin_posts'
        ordering = ['-posted_at']
        indexes = [
            models.Index(fields=['user', '-posted_at']),
            models.Index(fields=['-engagement_rate']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.posted_at.date()}"


class EngagementSnapshot(models.Model):
    """TimescaleDB Hypertable for time series data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    post = models.ForeignKey(LinkedInPost, on_delete=models.CASCADE, related_name='snapshots')
    snapshot_time = models.DateTimeField(db_index=True)
    likes_count = models.IntegerField()
    comments_count = models.IntegerField()
    shares_count = models.IntegerField()
    impressions_count = models.IntegerField()
    engagement_rate = models.DecimalField(max_digits=5, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'engagement_snapshots'
        ordering = ['-snapshot_time']
        indexes = [
            models.Index(fields=['post', '-snapshot_time']),
        ]