# ============================================================================
# serializers.py
# ============================================================================
from rest_framework import serializers
from .models import ExcelUploadLog, LinkedInFollower, LinkedInVisitor, LinkedInContent

class ExcelUploadSerializer(serializers.Serializer):
    followers_file = serializers.FileField(required=True)
    visitors_file = serializers.FileField(required=True)
    content_file = serializers.FileField(required=True)
    
    def validate_followers_file(self, value):
        return self._validate_file(value, 'followers')
    
    def validate_visitors_file(self, value):
        return self._validate_file(value, 'visitors')
    
    def validate_content_file(self, value):
        return self._validate_file(value, 'content')
    
    def _validate_file(self, file, keyword):
        # Check file extension
        if not file.name.endswith(('.xlsx', '.xls')):
            raise serializers.ValidationError(
                f"File must be an Excel file (.xlsx or .xls)"
            )
        
        # Check if keyword is in filename
        if keyword not in file.name.lower():
            raise serializers.ValidationError(
                f"File name must contain '{keyword}'. Example: ihubiitmandi_{keyword}_1762839643965.xlsx"
            )
        
        # Check file size (max 10MB)
        if file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError(
                f"File size must not exceed 10MB"
            )
        
        return file
    
    def validate(self, data):
        # Additional validation to ensure all three files are provided
        required_files = ['followers_file', 'visitors_file', 'content_file']
        for field in required_files:
            if field not in data:
                raise serializers.ValidationError(
                    f"All three files (followers, visitors, content) must be provided"
                )
        return data


class ExcelUploadLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = ExcelUploadLog
        fields = [
            'id', 'upload_session_id', 'username', 'uploaded_at', 
            'followers_file', 'visitors_file', 'content_file', 
            'status', 'error_message', 'followers_records', 
            'visitors_records', 'content_records', 'ip_address',
            'json_files_saved', 'db_saved'
        ]
        read_only_fields = ['id', 'upload_session_id', 'uploaded_at', 'username']


class LinkedInDataSerializer(serializers.Serializer):
    followers = serializers.ListField(child=serializers.DictField())
    visitors = serializers.ListField(child=serializers.DictField())
    content = serializers.ListField(child=serializers.DictField())