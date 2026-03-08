"""
Views for Viral Post Similarity API
"""

import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .vector_db import vector_db_service
from .serializers import (
    SimilarityRequestSerializer,
    SimilarityResponseSerializer,
    IndexStatsSerializer
)

logger = logging.getLogger(__name__)


class FindSimilarPostsView(APIView):
    """
    Find most similar viral posts to a given post content.
    
    POST /api/v1/check-similarity/find-similar/
    {
        "post_content": "Your LinkedIn post text...",
        "top_k": 3
    }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Validate request
        serializer = SimilarityRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "error": "Invalid request data",
                    "details": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        post_content = validated_data['post_content']
        top_k = validated_data.get('top_k', 3)
        
        try:
            # Search for similar posts
            logger.info(f"Searching for {top_k} similar posts...")
            recommendations = vector_db_service.search_similar(
                query_text=post_content,
                top_k=top_k
            )
            
            # Extract keywords and generate search query
            from .keyword_extractor import keyword_extractor
            keywords = keyword_extractor.extract_keywords(post_content)
            search_query = keyword_extractor.generate_search_query(keywords)
            
            logger.info(f"Extracted keywords: {keywords}")
            logger.info(f"Generated search query: {search_query}")
            
            # Build response
            response_data = {
                'success': True,
                'query_text': post_content[:100] + '...' if len(post_content) > 100 else post_content,
                'recommendations': recommendations,
                'total_found': len(recommendations),
                'keywords': keywords,
                'search_query': search_query
            }
            
            # Validate response
            response_serializer = SimilarityResponseSerializer(data=response_data)
            if response_serializer.is_valid():
                return Response(response_serializer.data, status=status.HTTP_200_OK)
            else:
                # Return data even if serializer validation fails
                return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error finding similar posts: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to find similar posts",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RebuildIndexView(APIView):
    """
    Rebuild the FAISS index from viral posts.
    Useful after new posts are scraped.
    
    POST /api/v1/check-similarity/rebuild-index/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            logger.info("Rebuilding vector index...")
            success = vector_db_service.rebuild_index()
            
            if success:
                stats = vector_db_service.get_index_stats()
                return Response(
                    {
                        "success": True,
                        "message": "Index rebuilt successfully",
                        "stats": stats
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "success": False,
                        "error": "Failed to rebuild index"
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            logger.error(f"Error rebuilding index: {str(e)}")
            return Response(
                {
                    "success": False,
                    "error": "Failed to rebuild index",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class IndexStatsView(APIView):
    """
    Get statistics about the vector index.
    
    GET /api/v1/check-similarity/index-stats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            stats = vector_db_service.get_index_stats()
            serializer = IndexStatsSerializer(data=stats)
            
            if serializer.is_valid():
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(stats, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error getting index stats: {str(e)}")
            return Response(
                {
                    "error": "Failed to get index stats",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )