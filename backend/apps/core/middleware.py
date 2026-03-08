import logging
import time
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all incoming requests and their responses.
    Useful for debugging and monitoring API calls.
    """
    
    def process_request(self, request):
        """Called on each request, before Django decides which view to execute."""
        request.start_time = time.time()
        return None
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """Called after authentication middleware, before the view is executed."""
        # Log request details after authentication has been processed
        log_data = {
            'method': request.method,
            'path': request.path,
            'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
            'ip': self.get_client_ip(request),
        }
        
        # Log query parameters for GET requests
        if request.method == 'GET' and request.GET:
            log_data['query_params'] = dict(request.GET)
        
        logger.info(f"Request started: {json.dumps(log_data)}")
        
        return None
    
    def process_response(self, request, response):
        """Called after the view is executed."""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            log_data = {
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'duration_ms': round(duration * 1000, 2),
                'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
            }
            
            # Log different levels based on status code
            if response.status_code >= 500:
                logger.error(f"Request completed: {json.dumps(log_data)}")
            elif response.status_code >= 400:
                logger.warning(f"Request completed: {json.dumps(log_data)}")
            else:
                logger.info(f"Request completed: {json.dumps(log_data)}")
        
        return response
    
    def process_exception(self, request, exception):
        """Called when a view raises an exception."""
        log_data = {
            'method': request.method,
            'path': request.path,
            'exception': str(exception),
            'exception_type': type(exception).__name__,
            'user': str(request.user) if hasattr(request, 'user') else 'Anonymous',
        }
        
        logger.exception(f"Request exception: {json.dumps(log_data)}")
        
        return None
    
    @staticmethod
    def get_client_ip(request):
        """Get the client's IP address from the request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip