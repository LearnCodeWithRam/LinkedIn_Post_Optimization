# ============================================================================
# views.py (FIXED - All user_id converted to string)
# ============================================================================
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import os
import uuid
from .serializers import (
    ExcelUploadSerializer, 
    ExcelUploadLogSerializer,
    LinkedInDataSerializer
)
from .models import ExcelUploadLog, LinkedInFollower, LinkedInVisitor, LinkedInContent
from .tasks import process_excel_files, save_json_to_database

class ExcelUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        serializer = ExcelUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get validated files
            followers_file = serializer.validated_data['followers_file']
            visitors_file = serializer.validated_data['visitors_file']
            content_file = serializer.validated_data['content_file']
            
            # Validate filenames match expected types
            filename_validation = self.validate_filenames(
                followers_file.name,
                visitors_file.name,
                content_file.name
            )
            
            if not filename_validation['valid']:
                return Response({
                    'success': False,
                    'message': 'File validation failed',
                    'error': filename_validation['error']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate unique session ID
            session_id = str(uuid.uuid4())
            
            # Get client IP
            ip_address = self.get_client_ip(request)
            
            # ← CRITICAL: Convert user.id to string
            user_id_str = str(request.user.id)
            
            # Create log entry using MongoEngine
            upload_log = ExcelUploadLog(
                user_id=user_id_str,  # ← Changed from request.user.id to string
                user_email=request.user.email,
                upload_session_id=session_id,
                followers_file=followers_file.name,
                visitors_file=visitors_file.name,
                content_file=content_file.name,
                status='processing',
                ip_address=ip_address
            )
            upload_log.save()
            
            # Step 1: Convert Excel to JSON and save files
            conversion_result = process_excel_files(
                followers_file, 
                visitors_file, 
                content_file,
                session_id
            )
            
            if conversion_result['status'] != 'success':
                upload_log.status = 'failed'
                upload_log.error_message = conversion_result.get('error_message')
                upload_log.save()
                
                return Response({
                    'success': False,
                    'message': 'Excel to JSON conversion failed',
                    'error': conversion_result.get('error_message')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Update log with conversion results
            upload_log.followers_records = conversion_result['followers_records']
            upload_log.visitors_records = conversion_result['visitors_records']
            upload_log.content_records = conversion_result['content_records']
            upload_log.json_files_saved = True
            upload_log.save()
            
            # Step 2: Save JSON data to MongoDB
            db_result = save_json_to_database(
                conversion_result['json_data'],
                request.user,
                session_id
            )
            
            if db_result['status'] != 'success':
                upload_log.status = 'partial'
                upload_log.error_message = f"JSON files saved but DB save failed: {db_result.get('error_message')}"
                upload_log.save()
                
                return Response({
                    'success': False,
                    'message': 'JSON files created but database save failed',
                    'error': db_result.get('error_message'),
                    'data': {
                        'log_id': str(upload_log.id),
                        'session_id': session_id,
                        'output_files': conversion_result['output_files']
                    }
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Update log with success
            upload_log.status = 'success'
            upload_log.db_saved = True
            upload_log.save()
            
            # Mark data as uploaded for the user
            from django.utils import timezone
            if not request.user.data_uploaded:
                request.user.data_uploaded = True
                request.user.data_uploaded_at = timezone.now()
                request.user.save()
            
            return Response({
                'success': True,
                'message': 'Files processed and data saved to database successfully',
                'data': {
                    'log_id': str(upload_log.id),
                    'session_id': session_id,
                    'output_files': conversion_result['output_files'],
                    'records_count': {
                        'followers': conversion_result['followers_records'],
                        'visitors': conversion_result['visitors_records'],
                        'content': conversion_result['content_records']
                    },
                    'db_records_saved': {
                        'followers': db_result['followers_saved'],
                        'visitors': db_result['visitors_saved'],
                        'content': db_result['content_saved']
                    }
                }
            }, status=status.HTTP_200_OK)
                
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"[ERROR] Exception in ExcelUploadView: {str(e)}")
            print(f"[ERROR] Traceback:\n{error_trace}")
            
            return Response({
                'success': False,
                'message': 'An error occurred during file processing',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def validate_filenames(self, followers_name: str, visitors_name: str, content_name: str):
        """
        Validate that filenames match expected patterns
        """
        file_checks = [
            {
                'name': followers_name.lower(),
                'type': 'followers',
                'expected_keywords': ['follower', 'followers'],
                'wrong_keywords': ['visitor', 'visitors', 'content', 'post', 'posts']
            },
            {
                'name': visitors_name.lower(),
                'type': 'visitors',
                'expected_keywords': ['visitor', 'visitors'],
                'wrong_keywords': ['follower', 'followers', 'content', 'post', 'posts']
            },
            {
                'name': content_name.lower(),
                'type': 'content',
                'expected_keywords': ['content', 'post', 'posts'],
                'wrong_keywords': ['follower', 'followers', 'visitor', 'visitors']
            }
        ]
        
        for check in file_checks:
            has_expected = any(keyword in check['name'] for keyword in check['expected_keywords'])
            
            if not has_expected:
                wrong_keyword_found = None
                for keyword in check['wrong_keywords']:
                    if keyword in check['name']:
                        wrong_keyword_found = keyword
                        break
                
                if wrong_keyword_found:
                    return {
                        'valid': False,
                        'error': f"Wrong file uploaded for {check['type']}. The file appears to contain '{wrong_keyword_found}' data. Please upload the correct {check['type']} file."
                    }
                else:
                    return {
                        'valid': False,
                        'error': f"Cannot verify {check['type']} file. Filename should contain one of: {', '.join(check['expected_keywords'])}"
                    }
        
        return {'valid': True}
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ExcelUploadLogListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # ← Convert user.id to string for query
        user_id_str = str(request.user.id)
        
        # Get logs for current user using MongoEngine
        logs = ExcelUploadLog.objects(user_id=user_id_str)
        serializer = ExcelUploadLogSerializer(logs, many=True)
        
        return Response({
            'success': True,
            'count': logs.count(),
            'data': serializer.data
        }, status=status.HTTP_200_OK)


class ExcelUploadLogDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, log_id):
        try:
            # ← Convert user.id to string for query
            user_id_str = str(request.user.id)
            
            # MongoEngine uses objects.get() but with different syntax
            log = ExcelUploadLog.objects.get(id=log_id, user_id=user_id_str)
            serializer = ExcelUploadLogSerializer(log)
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        except ExcelUploadLog.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Log not found'
            }, status=status.HTTP_404_NOT_FOUND)


class LinkedInDataView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, session_id=None):
        """Get LinkedIn data for a specific session or all user's data"""
        try:
            # ← Convert user.id to string for queries
            user_id_str = str(request.user.id)
            
            if session_id:
                # Get data for specific session using MongoEngine
                followers = LinkedInFollower.objects(
                    user_id=user_id_str, 
                    upload_session_id=session_id
                ).only('data', 'uploaded_at')
                
                visitors = LinkedInVisitor.objects(
                    user_id=user_id_str, 
                    upload_session_id=session_id
                ).only('data', 'uploaded_at')
                
                content = LinkedInContent.objects(
                    user_id=user_id_str, 
                    upload_session_id=session_id
                ).only('data', 'uploaded_at')
            else:
                # Get all user's data using MongoEngine
                followers = LinkedInFollower.objects(
                    user_id=user_id_str
                ).only('data', 'uploaded_at', 'upload_session_id')
                
                visitors = LinkedInVisitor.objects(
                    user_id=user_id_str
                ).only('data', 'uploaded_at', 'upload_session_id')
                
                content = LinkedInContent.objects(
                    user_id=user_id_str
                ).only('data', 'uploaded_at', 'upload_session_id')
            
            # Convert MongoEngine querysets to list of dicts
            followers_data = [{'data': f.data, 'uploaded_at': f.uploaded_at} for f in followers]
            visitors_data = [{'data': v.data, 'uploaded_at': v.uploaded_at} for v in visitors]
            content_data = [{'data': c.data, 'uploaded_at': c.uploaded_at} for c in content]
            
            return Response({
                'success': True,
                'session_id': session_id,
                'data': {
                    'followers': followers_data,
                    'visitors': visitors_data,
                    'content': content_data
                },
                'count': {
                    'followers': len(followers_data),
                    'visitors': len(visitors_data),
                    'content': len(content_data)
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error fetching data',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)