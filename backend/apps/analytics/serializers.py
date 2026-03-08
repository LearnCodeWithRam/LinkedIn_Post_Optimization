from rest_framework import serializers
from .models import ContentAnalysis, EngagementPrediction, TimeSeriesAnalysis, AudienceInsight

class ContentAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentAnalysis
        fields = ['id', 'post', 'sentiment_score', 'sentiment_details', 'topics', 'topic_scores', 'readability_score', 'tone', 'keywords', 'analysis_version']

class EngagementPredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngagementPrediction
        fields = ['id', 'post', 'predicted_engagement_rate', 'success_probability', 'confidence_score', 'recommended_posting_time', 'model_version']

class TimeSeriesAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSeriesAnalysis
        fields = ['id', 'user', 'analysis_type', 'period_start', 'period_end', 'metrics', 'trends', 'seasonality', 'anomalies']

class AudienceInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudienceInsight
        fields = ['id', 'user', 'demographic_data', 'engagement_patterns', 'active_times', 'period']
