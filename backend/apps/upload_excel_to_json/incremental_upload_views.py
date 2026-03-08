"""
Incremental Upload Views
API endpoints for incremental data upload
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
import uuid

from .serializers import ExcelUploadSerializer
from .models import ExcelUploadLog
from .incremental_upload_tasks import process_incremental_upload, get_existing_date_ranges


class IncrementalExcelUploadView(APIView):
    """
    Handle incremental Excel uploads with date range merging
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """
        Process incremental upload
        """
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
            
            # Convert user.id to string
            user_id_str = str(request.user.id)
            
            # Create log entry
            upload_log = ExcelUploadLog(
                user_id=user_id_str,
                user_email=request.user.email,
                upload_session_id=session_id,
                followers_file=followers_file.name,
                visitors_file=visitors_file.name,
                content_file=content_file.name,
                status='processing',
                ip_address=ip_address
            )
            upload_log.save()
            
            # Process incremental upload
            result = process_incremental_upload(
                followers_file,
                visitors_file,
                content_file,
                request.user,
                session_id
            )
            
            if result['status'] != 'success':
                upload_log.status = 'failed'
                upload_log.error_message = result.get('error_message', 'Unknown error')
                upload_log.save()
                
                return Response({
                    'success': False,
                    'message': f"Incremental upload failed at step: {result.get('step', 'unknown')}",
                    'error': result.get('error_message')
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Update log with success
            upload_log.status = 'success'
            upload_log.db_saved = True
            upload_log.json_files_saved = True
            
            # Update record counts
            merge_summary = result.get('merge_summary', {})
            upload_log.followers_records = merge_summary.get('followers', {}).get('total', 0)
            upload_log.visitors_records = merge_summary.get('visitors', {}).get('total', 0)
            upload_log.content_records = merge_summary.get('content', {}).get('total', 0)
            
            upload_log.save()
            
            # Mark data as uploaded for the user
            if not request.user.data_uploaded:
                request.user.data_uploaded = True
                request.user.data_uploaded_at = timezone.now()
                request.user.save()
            
            # Format date analysis for response
            date_analysis = result.get('date_analysis', {})
            formatted_analysis = {}
            
            for data_type, analysis in date_analysis.items():
                formatted_analysis[data_type] = {
                    'existing_range': analysis.get('existing_range', 'No existing data'),
                    'new_range': analysis.get('new_range', 'No date range detected'),
                    'has_overlap': analysis.get('has_overlap', False),
                    'is_extension': analysis.get('is_extension', False)
                }
            
            return Response({
                'success': True,
                'message': 'Incremental upload completed successfully',
                'data': {
                    'log_id': str(upload_log.id),
                    'session_id': session_id,
                    'date_analysis': formatted_analysis,
                    'merge_summary': merge_summary,
                    'output_files': result.get('output_files', [])
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'An error occurred during incremental upload',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def validate_filenames(self, followers_name: str, visitors_name: str, content_name: str) -> dict:
        """
        Validate that filenames match expected patterns
        
        Args:
            followers_name: Followers file name
            visitors_name: Visitors file name
            content_name: Content file name
            
        Returns:
            Dictionary with validation result
        """
        # Define expected keywords for each file type
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
            # Check if file has expected keywords
            has_expected = any(keyword in check['name'] for keyword in check['expected_keywords'])
            
            if not has_expected:
                # Check if it has wrong keywords
                wrong_keyword_found = None
                for keyword in check['wrong_keywords']:
                    if keyword in check['name']:
                        wrong_keyword_found = keyword
                        break
                
                if wrong_keyword_found:
                    return {
                        'valid': False,
                        'error': f"Wrong file uploaded for {check['type']}. The file '{check['name']}' appears to contain '{wrong_keyword_found}' data. Please upload the correct {check['type']} file."
                    }
                else:
                    return {
                        'valid': False,
                        'error': f"Cannot verify {check['type']} file. Filename should contain one of: {', '.join(check['expected_keywords'])}"
                    }
        
        return {'valid': True}
    
    def get_client_ip(self, request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ExistingDateRangesView(APIView):
    """
    Get existing date ranges for the current user
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Return existing date ranges for all data types
        """
        try:
            user_id_str = str(request.user.id)
            
            date_ranges = {}
            
            for data_type in ['followers', 'visitors', 'content']:
                min_date, max_date = get_existing_date_ranges(user_id_str, data_type)
                
                if min_date and max_date:
                    date_ranges[data_type] = {
                        'start': min_date.strftime('%Y-%m-%d'),
                        'end': max_date.strftime('%Y-%m-%d'),
                        'range': f"{min_date.strftime('%Y-%m-%d')} to {max_date.strftime('%Y-%m-%d')}"
                    }
                else:
                    date_ranges[data_type] = {
                        'start': None,
                        'end': None,
                        'range': 'No data'
                    }
            
            return Response({
                'success': True,
                'data': date_ranges
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Error fetching date ranges',
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
