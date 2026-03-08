# apps/predictions/models.py
from django.db import models
import uuid
from django.conf import settings


class MLModel(models.Model):
    MODEL_TYPES = [
        ('engagement_predictor', 'Engagement Predictor'),
        ('success_classifier', 'Success Classifier'),
        ('topic_classifier', 'Topic Classifier'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ml_models')
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES)
    model_version = models.CharField(max_length=50)
    model_file_path = models.CharField(max_length=500)  # MinIO path
    training_metrics = models.JSONField(default=dict, blank=True)
    feature_importance = models.JSONField(default=dict, blank=True)
    trained_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ml_models'
        ordering = ['-trained_at']
        indexes = [
            models.Index(fields=['user', 'model_type', 'is_active']),
        ]


class EngagementPrediction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='predictions')
    post = models.ForeignKey('linkedin.LinkedInPost', on_delete=models.CASCADE, related_name='predictions', null=True, blank=True)
    predicted_likes = models.IntegerField()
    predicted_comments = models.IntegerField()
    predicted_engagement_rate = models.DecimalField(max_digits=5, decimal_places=2)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2)
    model = models.ForeignKey(MLModel, on_delete=models.SET_NULL, null=True)
    predicted_at = models.DateTimeField(auto_now_add=True)
    actual_engagement_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    prediction_error = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'engagement_predictions'
        ordering = ['-predicted_at']
