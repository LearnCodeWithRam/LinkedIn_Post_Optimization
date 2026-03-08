"""
Viral Pattern Post Optimization View
"""
import traceback
from concurrent.futures import ThreadPoolExecutor
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema

from .serializers_viral_pattern import (
    ViralPatternOptimizationRequestSerializer,
    ViralPatternOptimizationResponseSerializer,
)
from .tasks import optimize_post_with_viral_pattern_task


def run_async_task_in_thread(coro):
    """Execute async coroutine in isolated thread."""
    import asyncio
    import sys
    
    loop = None
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        if sys.platform == 'win32':
            asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        
        result = loop.run_until_complete(coro)
        loop.run_until_complete(asyncio.sleep(0))
        
        return result
    except Exception as e:
        print(f"Error in async task: {str(e)}")
        traceback.print_exc()
        raise
    finally:
        if loop is not None:
            try:
                loop.run_until_complete(asyncio.sleep(0))
                pending = asyncio.all_tasks(loop)
                for task in pending:
                    task.cancel()
                if pending:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                loop.run_until_complete(loop.shutdown_asyncgens())
                if not loop.is_closed():
                    loop.close()
                asyncio.set_event_loop(None)
            except:
                pass


class OptimizedWithViralPatternGenerateView(APIView):
    """Optimize user's post to match viral post patterns."""
    permission_classes = []
    
    @swagger_auto_schema(
        operation_description="Rewrite user's post to match viral post patterns while preserving core message",
        request_body=ViralPatternOptimizationRequestSerializer,
        responses={200: ViralPatternOptimizationResponseSerializer},
        tags=['LinkedIn Post Generation']
    )
    def post(self, request):
        """Generate viral-pattern optimized version of user's post."""
        serializer = ViralPatternOptimizationRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid parameters', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        user_post_content = validated_data['user_post_content']
        user_post_analysis = validated_data['user_post_analysis']
        viral_post_content = validated_data['viral_post_content']
        viral_post_analysis = validated_data['viral_post_analysis']
        post_id = validated_data.get('post_id', '')
        
        # Check cache if post_id provided
        if post_id:
            from django.core.cache import cache
            cache_key = f"viral_pattern_optimized_{post_id}"
            cached_result = cache.get(cache_key)
            
            if cached_result:
                print(f"✓ Returning cached viral-pattern optimized post for: {post_id}")
                return Response({
                    'success': True,
                    'data': cached_result,
                    'cached': True
                })
        
        try:
            # Run viral pattern optimization task
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(
                    run_async_task_in_thread,
                    optimize_post_with_viral_pattern_task(
                        user_post_content=user_post_content,
                        user_post_analysis=user_post_analysis,
                        viral_post_content=viral_post_content,
                        viral_post_analysis=viral_post_analysis
                    )
                )
                
                try:
                    result = future.result(timeout=120)
                except TimeoutError:
                    future.cancel()
                    return Response(
                        {"error": "Optimization timed out. Please try again."},
                        status=status.HTTP_408_REQUEST_TIMEOUT
                    )
            
            # Cache the result if post_id provided
            if post_id:
                from django.core.cache import cache
                cache_key = f"viral_pattern_optimized_{post_id}"
                cache.set(cache_key, result, timeout=86400)  # 24 hours
                print(f"✓ Cached viral-pattern optimized post for: {post_id}")
            
            return Response({
                'success': True,
                'data': result,
                'cached': False
            })
            
        except Exception as e:
            print(f"Error in OptimizedWithViralPatternGenerateView: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': 'Viral pattern optimization failed', 'message': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
