import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework.
    
    This handler provides consistent error response format across the API
    and logs all exceptions for monitoring.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Get the view that raised the exception
    view = context.get('view', None)
    request = context.get('request', None)
    
    # Log the exception
    log_data = {
        'exception_type': type(exc).__name__,
        'exception': str(exc),
        'view': view.__class__.__name__ if view else 'Unknown',
        'path': request.path if request else 'Unknown',
        'method': request.method if request else 'Unknown',
    }
    logger.error(f"API Exception: {log_data}")
    
    # Handle different types of exceptions
    if response is None:
        # Handle exceptions not handled by DRF's default handler
        
        if isinstance(exc, DjangoValidationError):
            # Handle Django's ValidationError
            response = Response(
                {
                    'error': 'Validation Error',
                    'detail': exc.messages if hasattr(exc, 'messages') else str(exc),
                    'status_code': status.HTTP_400_BAD_REQUEST,
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        elif isinstance(exc, Http404):
            # Handle 404 errors
            response = Response(
                {
                    'error': 'Not Found',
                    'detail': 'The requested resource was not found.',
                    'status_code': status.HTTP_404_NOT_FOUND,
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        else:
            # Handle all other exceptions (500 errors)
            response = Response(
                {
                    'error': 'Internal Server Error',
                    'detail': 'An unexpected error occurred. Please try again later.',
                    'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    else:
        # Customize DRF's response format
        if isinstance(response.data, dict):
            # Add status_code to the response
            response.data['status_code'] = response.status_code
            
            # Rename 'detail' to 'message' if it exists for consistency
            if 'detail' in response.data:
                response.data['message'] = response.data.pop('detail')
    
    return response


class APIException(Exception):
    """Base exception class for custom API exceptions."""
    
    def __init__(self, message, status_code=status.HTTP_400_BAD_REQUEST, code='error'):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class LinkedInAPIException(APIException):
    """Exception for LinkedIn API related errors."""
    
    def __init__(self, message, status_code=status.HTTP_502_BAD_GATEWAY):
        super().__init__(
            message=message,
            status_code=status_code,
            code='linkedin_api_error'
        )


class InsufficientDataException(APIException):
    """Exception when there's not enough data for analysis."""
    
    def __init__(self, message="Insufficient data for analysis"):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            code='insufficient_data'
        )


class MLModelException(APIException):
    """Exception for ML model related errors."""
    
    def __init__(self, message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(
            message=message,
            status_code=status_code,
            code='ml_model_error'
        )