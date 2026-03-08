from django.contrib import admin
from .models import ContentAnalysis, EngagementPrediction, TimeSeriesAnalysis, AudienceInsight


@admin.register(ContentAnalysis)
class ContentAnalysisAdmin(admin.ModelAdmin):
    list_display = ('post', 'sentiment_score', 'readability_score', 'analysis_version')


@admin.register(EngagementPrediction)
class EngagementPredictionAdmin(admin.ModelAdmin):
    list_display = ('post', 'predicted_engagement_rate', 'success_probability', 'model_version')


@admin.register(TimeSeriesAnalysis)
class TimeSeriesAnalysisAdmin(admin.ModelAdmin):
    list_display = ('user', 'analysis_type', 'period_start', 'period_end')


@admin.register(AudienceInsight)
class AudienceInsightAdmin(admin.ModelAdmin):
    list_display = ('user', 'period')
