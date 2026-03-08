# apps/recommendations/models.py
from django.db import models
import uuid
from django.conf import settings


class Recommendation(models.Model):
    RECOMMENDATION_TYPES = [
        ('hashtag', 'Hashtag Recommendation'),
        ('posting_time', 'Optimal Posting Time'),
        ('content_style', 'Content Style'),
        ('topic', 'Topic Suggestion'),
        ('cta', 'Call-to-Action'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='recommendations')
    recommendation_type = models.CharField(max_length=50, choices=RECOMMENDATION_TYPES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    recommendation_data = models.JSONField(default=dict)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2)
    is_applied = models.BooleanField(default=False)
    applied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'recommendations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_applied']),
        ]