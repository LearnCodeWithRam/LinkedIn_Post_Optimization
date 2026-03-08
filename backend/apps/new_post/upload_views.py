"""
File upload view for draft media files.
Handles image, video, and GIF uploads.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid


class UploadMediaView(APIView):
    """Upload media files for draft posts."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Handle file upload and return URL."""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        allowed_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg'
        ]
        
        if uploaded_file.content_type not in allowed_types:
            return Response(
                {'error': f'File type {uploaded_file.content_type} not allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if uploaded_file.size > max_size:
            return Response(
                {'error': 'File size exceeds 50MB limit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate unique filename
            ext = os.path.splitext(uploaded_file.name)[1]
            filename = f"draft_media/{uuid.uuid4()}{ext}"
            
            # Save file
            file_path = default_storage.save(filename, uploaded_file)
            file_url = default_storage.url(file_path)
            
            # Determine file type
            if uploaded_file.content_type.startswith('image/'):
                file_type = 'image'
            elif uploaded_file.content_type.startswith('video/'):
                file_type = 'video'
            else:
                file_type = 'file'
            
            return Response({
                'success': True,
                'file': {
                    'url': request.build_absolute_uri(file_url),
                    'name': uploaded_file.name,
                    'type': file_type,
                    'size': uploaded_file.size,
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to upload file: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
