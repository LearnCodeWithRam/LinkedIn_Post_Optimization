"""
Views for Viral Post Scraping API
"""

import json
import os
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.conf import settings
from .tasks import scrape_viral_posts_task
from .serializers import (
    LinkedInPostSerializer,
    ScrapeRequestSerializer,
    ScrapeResponseSerializer,
    CacheStatsSerializer
)
from .cache.cache_service import analysis_cache_service
import logging

logger = logging.getLogger(__name__)


class LinkedInPostsView(APIView):
    """
    API endpoint to fetch viral LinkedIn posts from JSON file.
    
    GET /api/viralpost-scraping/linkedin-posts/
    """
    permission_classes = []
    def get(self, request):
        try:
            # Use __file__ to get the current file's directory
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_file_path = os.path.join(current_dir, 'linkedin_posts.json')
            
            # For debugging - log the file path being used
            logger.info(f"Looking for LinkedIn posts file at: {json_file_path}")
            
            if not os.path.exists(json_file_path):
                logger.error(f"LinkedIn posts file not found at: {json_file_path}")
                return Response(
                    {"error": f"LinkedIn posts file not found at: {json_file_path}"},
                    status=status.HTTP_404_NOT_FOUND
                )

            
            with open(json_file_path, 'r', encoding='utf-8') as file:
                posts_data = json.load(file)
            
            for idx, post in enumerate(posts_data):
                if 'id' not in post:
                    post['id'] = str(idx)
            
            serializer = LinkedInPostSerializer(posts_data, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except FileNotFoundError:
            return Response(
                {'error': 'LinkedIn posts file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except json.JSONDecodeError:
            return Response(
                {'error': 'Invalid JSON format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error fetching LinkedIn posts: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ScrapeViralPostsView(APIView):
    """
    API endpoint to scrape viral LinkedIn posts based on search query.
    
    POST /api/viralpost-scraping/scrape/
    {
        "search_query": "responsible ai",
        "personalize": true,
        "user_role": "CEO of IIT Mandi",
        "user_topics": "incubation, startups, skill development"
    }
    """
    # permission_classes = [IsAuthenticated]
    permission_classes = []
    
    def post(self, request):
        serializer = ScrapeRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": "Invalid request data", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        
        try:
            result = scrape_viral_posts_task(
                search_query=validated_data['search_query'],
                personalize=validated_data.get('personalize', False),
                user_role=validated_data.get('user_role', ''),
                user_topics=validated_data.get('user_topics', '')
            )
            
            if result.get('success'):
                response_serializer = ScrapeResponseSerializer(data=result)
                if response_serializer.is_valid():
                    return Response(
                        response_serializer.data,
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(
                    {
                        "error": "Scraping failed",
                        "message": result.get('error', 'Unknown error')
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        except Exception as e:
            logger.error(f"Error in ScrapeViralPostsView: {str(e)}")
            return Response(
                {"error": "Internal server error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CacheStatsView(APIView):
    """
    Get cache statistics for post analyses.
    
    GET /api/viralpost-scraping/cache/stats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            stats = analysis_cache_service.get_cache_stats()
            serializer = CacheStatsSerializer(data=stats)
            
            if serializer.is_valid():
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(stats, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return Response(
                {"error": "Failed to get cache stats", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClearCacheView(APIView):
    """
    Clear all cached post analyses.
    
    DELETE /api/viralpost-scraping/cache/clear/
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        try:
            analysis_cache_service.clear_all_cache()
            
            return Response(
                {"message": "Cache cleared successfully"},
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return Response(
                {"error": "Failed to clear cache", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CacheDetailView(APIView):
    """
    Get or delete cached analysis for a specific post.
    
    GET /api/viralpost-scraping/cache/<post_id>/
    DELETE /api/viralpost-scraping/cache/<post_id>/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, post_id):
        try:
            cached_data = analysis_cache_service.get_cached_analysis(post_id)
            
            if cached_data:
                return Response(
                    {
                        "post_id": post_id,
                        "cached": True,
                        "analysis_data": cached_data
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {
                        "post_id": post_id,
                        "cached": False,
                        "message": "No cached analysis found for this post"
                    },
                    status=status.HTTP_404_NOT_FOUND
                )
        
        except Exception as e:
            logger.error(f"Error getting cached analysis: {str(e)}")
            return Response(
                {"error": "Failed to get cached analysis", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, post_id):
        try:
            analysis_cache_service.remove_cached_analysis(post_id)
            
            return Response(
                {
                    "message": f"Cache removed for post_id: {post_id}",
                    "post_id": post_id
                },
                status=status.HTTP_200_OK
            )
        
        except Exception as e:
            logger.error(f"Error removing cached analysis: {str(e)}")
            return Response(
                {"error": "Failed to remove cached analysis", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
























# """
# Views for Viral Post Scraping API
# """

# from rest_framework import status
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from django.core.cache import cache
# from .tasks import scrape_viral_posts_task
# from .serializers import (
#     ScrapeRequestSerializer,
#     ScrapeResponseSerializer,
#     CacheStatsSerializer
# )
# from .cache.cache_service import analysis_cache_service
# import logging

# logger = logging.getLogger(__name__)


# class ScrapeViralPostsView(APIView):
#     """
#     API endpoint to scrape viral LinkedIn posts based on search query.
    
#     POST /api/viralpost-scraping/scrape/
#     {
#         "search_query": "responsible ai",
#         "personalize": true,
#         "user_role": "CEO of IIT Mandi",
#         "user_topics": "incubation, startups, skill development"
#     }
#     """
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         serializer = ScrapeRequestSerializer(data=request.data)
        
#         if not serializer.is_valid():
#             return Response(
#                 {"error": "Invalid request data", "details": serializer.errors},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         validated_data = serializer.validated_data
        
#         try:
#             # Start the scraping task
#             result = scrape_viral_posts_task(
#                 search_query=validated_data['search_query'],
#                 personalize=validated_data.get('personalize', False),
#                 user_role=validated_data.get('user_role', ''),
#                 user_topics=validated_data.get('user_topics', '')
#             )
            
#             if result.get('success'):
#                 response_serializer = ScrapeResponseSerializer(data=result)
#                 if response_serializer.is_valid():
#                     return Response(
#                         response_serializer.data,
#                         status=status.HTTP_200_OK
#                     )
#                 else:
#                     return Response(result, status=status.HTTP_200_OK)
#             else:
#                 return Response(
#                     {
#                         "error": "Scraping failed",
#                         "message": result.get('error', 'Unknown error')
#                     },
#                     status=status.HTTP_500_INTERNAL_SERVER_ERROR
#                 )
        
#         except Exception as e:
#             logger.error(f"Error in ScrapeViralPostsView: {str(e)}")
#             return Response(
#                 {"error": "Internal server error", "message": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# class CacheStatsView(APIView):
#     """
#     Get cache statistics for post analyses.
    
#     GET /api/viralpost-scraping/cache/stats/
#     """
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         try:
#             stats = analysis_cache_service.get_cache_stats()
#             serializer = CacheStatsSerializer(data=stats)
            
#             if serializer.is_valid():
#                 return Response(serializer.data, status=status.HTTP_200_OK)
#             else:
#                 return Response(stats, status=status.HTTP_200_OK)
        
#         except Exception as e:
#             logger.error(f"Error getting cache stats: {str(e)}")
#             return Response(
#                 {"error": "Failed to get cache stats", "message": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# class ClearCacheView(APIView):
#     """
#     Clear all cached post analyses.
    
#     DELETE /api/viralpost-scraping/cache/clear/
#     """
#     permission_classes = [IsAuthenticated]
    
#     def delete(self, request):
#         try:
#             analysis_cache_service.clear_all_cache()
            
#             return Response(
#                 {"message": "Cache cleared successfully"},
#                 status=status.HTTP_200_OK
#             )
        
#         except Exception as e:
#             logger.error(f"Error clearing cache: {str(e)}")
#             return Response(
#                 {"error": "Failed to clear cache", "message": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )


# class CacheDetailView(APIView):
#     """
#     Get or delete cached analysis for a specific post.
    
#     GET /api/viralpost-scraping/cache/<post_id>/
#     DELETE /api/viralpost-scraping/cache/<post_id>/
#     """
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request, post_id):
#         try:
#             cached_data = analysis_cache_service.get_cached_analysis(post_id)
            
#             if cached_data:
#                 return Response(
#                     {
#                         "post_id": post_id,
#                         "cached": True,
#                         "analysis_data": cached_data
#                     },
#                     status=status.HTTP_200_OK
#                 )
#             else:
#                 return Response(
#                     {
#                         "post_id": post_id,
#                         "cached": False,
#                         "message": "No cached analysis found for this post"
#                     },
#                     status=status.HTTP_404_NOT_FOUND
#                 )
        
#         except Exception as e:
#             logger.error(f"Error getting cached analysis: {str(e)}")
#             return Response(
#                 {"error": "Failed to get cached analysis", "message": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )
    
#     def delete(self, request, post_id):
#         try:
#             analysis_cache_service.remove_cached_analysis(post_id)
            
#             return Response(
#                 {
#                     "message": f"Cache removed for post_id: {post_id}",
#                     "post_id": post_id
#                 },
#                 status=status.HTTP_200_OK
#             )
        
#         except Exception as e:
#             logger.error(f"Error removing cached analysis: {str(e)}")
#             return Response(
#                 {"error": "Failed to remove cached analysis", "message": str(e)},
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             )