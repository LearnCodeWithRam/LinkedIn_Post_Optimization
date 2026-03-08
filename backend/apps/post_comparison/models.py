from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

# Get the custom user model
User = get_user_model()


class PostComparison(models.Model):
    """
    Optional model to store comparison results for caching and analytics.
    This can help reduce API calls and track usage patterns.
    """
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        help_text="User who requested the comparison"
    )
    
    user_post = models.TextField(
        help_text="User's LinkedIn post content"
    )
    
    viral_post = models.TextField(
        help_text="Viral post used for comparison"
    )
    
    virality_score = models.IntegerField(
        help_text="Calculated virality score (0-100)"
    )
    
    virality_status = models.CharField(
        max_length=20,
        help_text="Virality status: Excellent/Good/Fair/Poor"
    )
    
    comparison_result = models.JSONField(
        help_text="Complete comparison analysis as JSON"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the comparison was performed"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update timestamp"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Post Comparison"
        verbose_name_plural = "Post Comparisons"
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['virality_score']),
        ]
    
    def __str__(self):
        return f"Comparison {self.id} - Score: {self.virality_score}"


class ComparisonAnalytics(models.Model):
    """
    Track analytics for comparison requests.
    Useful for monitoring and optimizing the service.
    """
    
    comparison = models.OneToOneField(
        PostComparison,
        on_delete=models.CASCADE,
        related_name='analytics'
    )
    
    processing_time = models.FloatField(
        help_text="Time taken to process comparison (seconds)"
    )
    
    user_word_count = models.IntegerField()
    viral_word_count = models.IntegerField()
    
    user_hashtag_count = models.IntegerField()
    viral_hashtag_count = models.IntegerField()
    
    engagement_improvement_potential = models.CharField(
        max_length=20,
        help_text="Low/Medium/High"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Comparison Analytics"
        verbose_name_plural = "Comparison Analytics"
    
    def __str__(self):
        return f"Analytics for Comparison {self.comparison.id}"