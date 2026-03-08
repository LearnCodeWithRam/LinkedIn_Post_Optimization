from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

from .serializers import (
    PostComparisonRequestSerializer,
    PostComparisonResponseSerializer,
    ErrorResponseSerializer
)
from .tasks import compare_posts_sync


logger = logging.getLogger(__name__)


class PostComparisonView(APIView):
    """
    API endpoint to compare user's LinkedIn post with a viral post.
    
    This endpoint uses a multi-agent system to analyze and compare two posts
    across multiple dimensions: structure, tone, hashtags, engagement potential,
    and keywords.
    """
    # permission_classes = [IsAuthenticated]
    permission_classes = []

    @swagger_auto_schema(
        operation_description="Compare your LinkedIn post with a viral post to get detailed analytics and recommendations",
        request_body=PostComparisonRequestSerializer,
        responses={
            200: openapi.Response(
                description="Successful comparison",
                schema=PostComparisonResponseSerializer
            ),
            400: openapi.Response(
                description="Invalid request",
                schema=ErrorResponseSerializer
            ),
            500: openapi.Response(
                description="Internal server error",
                schema=ErrorResponseSerializer
            )
        },
        tags=['LinkedIn Post Comparison']
    )
    def post(self, request):
        """
        Compare two LinkedIn posts and return comprehensive analysis.
        
        Request body:
        {
            "user_post": "Your LinkedIn post content...",
            "viral_post": "Viral post content for comparison..."
        }
        """
        # Validate request data
        serializer = PostComparisonRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.warning(f"Invalid request data: {serializer.errors}")
            return Response(
                {
                    "error": "Invalid request data",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_post = serializer.validated_data['user_post']
        viral_post = serializer.validated_data['viral_post']
        
        logger.info("Starting post comparison analysis")
        logger.debug(f"User post length: {len(user_post)}, Viral post length: {len(viral_post)}")
        
        try:
            # Run comparison using multi-agent system
            comparison_result = compare_posts_sync(user_post, viral_post)
            
            logger.info("Post comparison completed successfully")
            logger.debug(f"Virality score: {comparison_result.get('virality_score')}")
            
            # Validate response data
            response_serializer = PostComparisonResponseSerializer(data=comparison_result)
            
            if not response_serializer.is_valid():
                logger.error(f"Response validation failed: {response_serializer.errors}")
                return Response(
                    {
                        "error": "Internal processing error",
                        "details": "Failed to validate analysis results"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(
                response_serializer.data,
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Error during post comparison: {str(e)}", exc_info=True)
            return Response(
                {
                    "error": "Failed to process comparison",
                    "details": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthCheckView(APIView):
    """Health check endpoint for post comparison service."""
    # permission_classes = [IsAuthenticated]
    permission_classes = []
    @swagger_auto_schema(
        operation_description="Check if the post comparison service is running",
        responses={
            200: openapi.Response(
                description="Service is healthy",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'status': openapi.Schema(type=openapi.TYPE_STRING),
                        'service': openapi.Schema(type=openapi.TYPE_STRING),
                        'version': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            )
        },
        tags=['Health Check']
    )
    def get(self, request):
        """Health check endpoint."""
        return Response(
            {
                "status": "healthy",
                "service": "LinkedIn Post Comparison",
                "version": "1.0.0"
            },
            status=status.HTTP_200_OK
        )