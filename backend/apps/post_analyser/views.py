"""
LinkedIn Post Analyzer - DRF Views
"""
import asyncio
import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import (
    PostAnalyzerRequestSerializer,
    PostAnalyzerResponseSerializer,
    LinkedInPostOptimizationSerializer
)
from .tasks import optimize_linkedin_post
from .cache_service import analysis_cache_service

logger = logging.getLogger(__name__)


class PostAnalyzerAPIView(APIView):
    """
    API endpoint to analyze and optimize LinkedIn posts.
    
    Analyzes post structure, hashtags, engagement potential, and tagging strategy
    using a multi-agent AI system.
    """
    
    @extend_schema(
        summary="Analyze LinkedIn Post",
        description="""
        Analyzes a LinkedIn post and provides comprehensive optimization recommendations.
        
        The analysis includes:
        - Structure analysis (hook, content, CTA)
        - Hashtag usage and relevance
        - Engagement potential predictions
        - People tagging strategy
        
        Returns actionable recommendations to improve post performance.
        """,
        request=PostAnalyzerRequestSerializer,
        responses={
            200: PostAnalyzerResponseSerializer,
            400: OpenApiResponse(description="Invalid request data"),
            500: OpenApiResponse(description="Internal server error")
        },
        tags=['LinkedIn Post Analyzer']
    )
    def post(self, request):
        """
        Analyze a LinkedIn post.
        
        Args:
            request: HTTP request with post_content in body
            
        Returns:
            Response: JSON response with analysis results
        """
        # Validate incoming data
        serializer = PostAnalyzerRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        post_content = serializer.validated_data['post_content']
        post_id = serializer.validated_data.get('post_id')
        force_refresh = serializer.validated_data.get('force_refresh', False)
        
        # Check cache if post_id is provided and not forcing refresh
        if post_id and not force_refresh:
            cached_analysis = analysis_cache_service.get_cached_analysis(post_id)
            if cached_analysis:
                logger.info(f"✓ Returning cached analysis for post_id: {post_id}")
                return Response({
                    'success': True,
                    'message': 'Post analysis retrieved from cache',
                    'data': cached_analysis,
                    'cached': True
                }, status=status.HTTP_200_OK)
        
        try:
            # Run async optimization function
            # Use asyncio.run() which properly handles loop lifecycle
            try:
                # For Python 3.10+ on Windows, set the event loop policy
                if hasattr(asyncio, 'WindowsSelectorEventLoopPolicy'):
                    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            except AttributeError:
                pass
            
            result = asyncio.run(optimize_linkedin_post(post_content))
            
            # Convert Pydantic model to dict for serialization
            result_dict = result.model_dump()
            
            # Validate output with serializer
            output_serializer = LinkedInPostOptimizationSerializer(data=result_dict)
            if output_serializer.is_valid():
                # Cache the result if post_id is provided
                if post_id:
                    analysis_cache_service.set_cached_analysis(
                        post_id=post_id,
                        post_content=post_content,
                        analysis_data=output_serializer.data
                    )
                    logger.info(f"✓ Cached new analysis for post_id: {post_id}")
                
                return Response({
                    'success': True,
                    'message': 'Post analyzed successfully',
                    'data': output_serializer.data,
                    'cached': False
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': 'Failed to serialize analysis results',
                    'details': output_serializer.errors
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except asyncio.TimeoutError:
            return Response({
                'success': False,
                'error': 'Analysis timeout. Please try again with a shorter post.'
            }, status=status.HTTP_408_REQUEST_TIMEOUT)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'An error occurred during analysis: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)












class ViralPostAnalyzerAPIView(APIView):
    """
    API endpoint to analyze and optimize viral LinkedIn posts.
    
    Analyzes post structure, hashtags, engagement potential, and tagging strategy
    using a multi-agent AI system. Uses separate caching from regular posts.
    """
    
    @extend_schema(
        summary="Analyze Viral LinkedIn Post",
        description="""
        Analyzes a viral LinkedIn post and provides comprehensive optimization recommendations.
        
        The analysis includes:
        - Structure analysis (hook, content, CTA)
        - Hashtag usage and relevance
        - Engagement potential predictions
        - People tagging strategy
        
        Returns actionable recommendations to improve post performance.
        Uses separate cache storage for viral posts.
        """,
        request=PostAnalyzerRequestSerializer,
        responses={
            200: PostAnalyzerResponseSerializer,
            400: OpenApiResponse(description="Invalid request data"),
            500: OpenApiResponse(description="Internal server error")
        },
        tags=['LinkedIn Post Analyzer']
    )
    def post(self, request):
        """
        Analyze a viral LinkedIn post.
        
        Args:
            request: HTTP request with post_content in body
            
        Returns:
            Response: JSON response with analysis results
        """
        # Import viral post cache service
        from .cache_viral_post_service import viral_post_analysis_cache_service
        
        # Validate incoming data
        serializer = PostAnalyzerRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        post_content = serializer.validated_data['post_content']
        post_id = serializer.validated_data.get('post_id')
        force_refresh = serializer.validated_data.get('force_refresh', False)
        
        # Check viral post cache if post_id is provided and not forcing refresh
        if post_id and not force_refresh:
            cached_analysis = viral_post_analysis_cache_service.get_cached_analysis(post_id)
            if cached_analysis:
                logger.info(f"✓ Returning cached viral post analysis for post_id: {post_id}")
                return Response({
                    'success': True,
                    'message': 'Viral post analysis retrieved from cache',
                    'data': cached_analysis,
                    'cached': True
                }, status=status.HTTP_200_OK)
        
        try:
            # Run async optimization function
            # Use asyncio.run() which properly handles loop lifecycle
            try:
                # For Python 3.10+ on Windows, set the event loop policy
                if hasattr(asyncio, 'WindowsSelectorEventLoopPolicy'):
                    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
            except AttributeError:
                pass
            
            result = asyncio.run(optimize_linkedin_post(post_content))
            
            # Convert Pydantic model to dict for serialization
            result_dict = result.model_dump()
            
            # Validate output with serializer
            output_serializer = LinkedInPostOptimizationSerializer(data=result_dict)
            if output_serializer.is_valid():
                # Cache the result in viral post cache if post_id is provided
                if post_id:
                    viral_post_analysis_cache_service.set_cached_analysis(
                        post_id=post_id,
                        post_content=post_content,
                        analysis_data=output_serializer.data
                    )
                    logger.info(f"✓ Cached new viral post analysis for post_id: {post_id}")
                
                return Response({
                    'success': True,
                    'message': 'Viral post analyzed successfully',
                    'data': output_serializer.data,
                    'cached': False
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'error': 'Failed to serialize viral post analysis results',
                    'details': output_serializer.errors
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except asyncio.TimeoutError:
            return Response({
                'success': False,
                'error': 'Viral post analysis timeout. Please try again with a shorter post.'
            }, status=status.HTTP_408_REQUEST_TIMEOUT)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'An error occurred during viral post analysis: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)













class HealthCheckAPIView(APIView):
    """
    Health check endpoint to verify API status.
    """
    
    @extend_schema(
        summary="Health Check",
        description="Check if the API is running and healthy",
        responses={
            200: OpenApiResponse(description="API is healthy")
        },
        tags=['Health']
    )
    def get(self, request):
        """Health check endpoint."""
        return Response({
            'status': 'healthy',
            'message': 'LinkedIn Post Analyzer API is running'
        }, status=status.HTTP_200_OK)