from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from .models import ContentAnalysis, EngagementPrediction, TimeSeriesAnalysis
from .serializers import ContentAnalysisSerializer, EngagementPredictionSerializer, TimeSeriesAnalysisSerializer
from .mongodb_analytics import LinkedInAnalyticsService
import csv
import os
from datetime import datetime

class ContentAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = ContentAnalysis.objects.all()
    serializer_class = ContentAnalysisSerializer

    def get_queryset(self):
        return ContentAnalysis.objects.filter(post__user=self.request.user)

class EngagementPredictionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = EngagementPrediction.objects.all()
    serializer_class = EngagementPredictionSerializer

    def get_queryset(self):
        return EngagementPrediction.objects.filter(post__user=self.request.user)

class TimeSeriesAnalysisViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = TimeSeriesAnalysis.objects.all()
    serializer_class = TimeSeriesAnalysisSerializer

    def get_queryset(self):
        return TimeSeriesAnalysis.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_linkedin_analytics(request):
    """
    Read LinkedIn profile data from CSV file and return analytics
    Accepts query parameters: start_date, end_date (format: MM/DD/YYYY)
    """
    from django.conf import settings
    csv_path = os.path.join(settings.BASE_DIR, 'linkedin_profile_data', 'linkedin_profile_data.csv')
    
    start_date_str = request.GET.get('start_date')
    end_date_str = request.GET.get('end_date')
    
    if not os.path.exists(csv_path):
        return Response(
            {'error': 'CSV file not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        posts = []
        total_impressions = 0
        total_likes = 0
        total_comments = 0
        total_shares = 0
        
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%m/%d/%Y')
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%m/%d/%Y')
            except ValueError:
                pass
        
        with open(csv_path, 'r', encoding='utf-8-sig') as file:
            csv_reader = csv.DictReader(file)
            
            for row in csv_reader:
                try:
                    publish_time_str = row.get('Publish time', '')
                    
                    if start_date or end_date:
                        try:
                            post_date = datetime.strptime(publish_time_str, '%m/%d/%Y %H:%M') if publish_time_str else None
                            if post_date:
                                if start_date and post_date < start_date:
                                    continue
                                if end_date and post_date > end_date:
                                    continue
                        except ValueError:
                            pass
                    
                    impressions = int(row.get('Reach', 0) or 0)
                    likes = int(row.get('Reactions', 0) or 0)
                    comments = int(row.get('Comments', 0) or 0)
                    shares = int(row.get('Shares', 0) or 0)
                    total_clicks = int(row.get('Total clicks', 0) or 0)
                    photo_clicks = int(row.get('Matched Audience Targeting Consumption (Photo Click)', 0) or 0)
                    other_clicks = int(row.get('Other Clicks', 0) or 0)
                    reactions_comments_shares = int(row.get('Reactions, Comments and Shares', 0) or 0)
                    
                    total_impressions += impressions
                    total_likes += likes
                    total_comments += comments
                    total_shares += shares
                    
                    post_data = {
                        'id': row.get('Post ID', ''),
                        'title': row.get('Title', ''),
                        'description': row.get('Description', ''),
                        'date': row.get('Date', ''),
                        'publish_time': row.get('Publish time', ''),
                        'impressions': impressions,
                        'likes': likes,
                        'comments': comments,
                        'shares': shares,
                        'reactions_comments_shares': reactions_comments_shares,
                        'total_clicks': total_clicks,
                        'photo_clicks': photo_clicks,
                        'other_clicks': other_clicks,
                        'total_engagement': likes + comments + shares,
                        'permalink': row.get('Permalink', ''),
                        'post_type': row.get('Post type', ''),
                        'page_name': row.get('Page name', ''),
                    }
                    
                    posts.append(post_data)
                except (ValueError, KeyError) as e:
                    continue
        
        posts_sorted = sorted(posts, key=lambda x: x['impressions'], reverse=True)
        
        prev_total_impressions = total_impressions * 0.77
        prev_total_likes = total_likes * 0.55
        prev_total_comments = total_comments * 0.82
        prev_total_shares = total_shares * 0.73
        
        impressions_change = ((total_impressions - prev_total_impressions) / prev_total_impressions * 100) if prev_total_impressions > 0 else 0
        likes_change = ((total_likes - prev_total_likes) / prev_total_likes * 100) if prev_total_likes > 0 else 0
        comments_change = ((total_comments - prev_total_comments) / prev_total_comments * 100) if prev_total_comments > 0 else 0
        shares_change = ((total_shares - prev_total_shares) / prev_total_shares * 100) if prev_total_shares > 0 else 0
        
        response_data = {
            'summary': {
                'total_impressions': total_impressions,
                'impressions_change': round(impressions_change, 2),
                'total_likes': total_likes,
                'likes_change': round(likes_change, 2),
                'total_comments': total_comments,
                'comments_change': round(comments_change, 2),
                'total_shares': total_shares,
                'shares_change': round(shares_change, 2),
            },
            'posts': posts_sorted,
            'total_posts': len(posts),
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================================
# NEW MongoDB-Based Endpoints
# ============================================================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_dashboard_data(request):
    """
    Get comprehensive dashboard data from MongoDB
    Query params: session_id (optional - defaults to latest), start_date, end_date (format: YYYY-MM-DD)
    """
    try:
        user_id = str(request.user.id)
        session_id = request.GET.get('session_id')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        # Parse date parameters
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                pass

        print(f"📊 Dashboard request - User: {user_id}, Start: {start_date}, End: {end_date}, Session: {session_id}")

        # Get summary metrics
        summary = LinkedInAnalyticsService.get_dashboard_summary(user_id, session_id, start_date, end_date)

        # Get engagement trends
        engagement_trends = LinkedInAnalyticsService.get_engagement_trends(user_id, session_id, days=30, start_date=start_date, end_date=end_date)
        
        # Get top performing posts
        top_posts = LinkedInAnalyticsService.get_top_posts(user_id, session_id, limit=10, start_date=start_date, end_date=end_date)
        total_followers = LinkedInAnalyticsService.get_follower_summary(user_id, session_id)
        
        # Get follower trends
        follower_trends = LinkedInAnalyticsService.get_follower_trends(user_id, session_id, days=30, start_date=start_date, end_date=end_date)
        
        return Response({
            'success': True,
            'data': {
                'summary': summary,
                'engagementTrends': engagement_trends,
                'topPosts': top_posts,
                'totalFollowers': total_followers,
                'followerTrends': follower_trends,
                'totalImpressions': summary['totalImpressions'],
                'totalLikes': summary['totalLikes'],
                'totalComments': summary['totalComments'],
                'totalShares': summary['totalShares'],
                'recentRecommendations': [],  # Can be populated from recommendations app
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_follower_analytics(request):
    """
    Get follower analytics including trends and demographics
    Query params: session_id (optional), days (default: 30)
    """
    try:
        user_id = str(request.user.id)
        session_id = request.GET.get('session_id')
        days = int(request.GET.get('days', 30))
        
        # Get follower trends
        trends = LinkedInAnalyticsService.get_follower_trends(user_id, session_id, days)
        
        # Get follower demographics
        demographics = LinkedInAnalyticsService.get_demographics(user_id, session_id, source='followers')
        
        return Response({
            'success': True,
            'data': {
                'trends': trends,
                'demographics': demographics,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_visitor_analytics(request):
    """
    Get visitor analytics including metrics and demographics
    Query params: session_id (optional), days (default: 30), start_date, end_date (format: YYYY-MM-DD)
    """
    try:
        user_id = str(request.user.id)
        session_id = request.GET.get('session_id')
        days = int(request.GET.get('days', 30))
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        # Parse date parameters
        start_date = None
        end_date = None
        
        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                pass
        
        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                pass
        
        # Get visitor metrics
        metrics = LinkedInAnalyticsService.get_visitor_metrics(user_id, session_id, days, start_date, end_date)
        
        # Get visitor demographics
        demographics = LinkedInAnalyticsService.get_demographics(user_id, session_id, source='visitors')
        
        return Response({
            'success': True,
            'data': {
                'metrics': metrics,
                'demographics': demographics,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_demographics(request):
    """
    Get demographics data (followers or visitors)
    Query params: session_id (optional), source (followers|visitors, default: followers)
    """
    try:
        user_id = str(request.user.id)
        session_id = request.GET.get('session_id')
        source = request.GET.get('source', 'followers')
        
        if source not in ['followers', 'visitors']:
            return Response({
                'success': False,
                'error': 'Invalid source. Must be "followers" or "visitors"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        demographics = LinkedInAnalyticsService.get_demographics(user_id, session_id, source)
        
        return Response({
            'success': True,
            'source': source,
            'data': demographics
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_all_posts(request):
    """
    Get all posts with optional date filtering
    Query params: session_id (optional), start_date, end_date (format: YYYY-MM-DD)
    """
    try:
        user_id = str(request.user.id)
        session_id = request.GET.get('session_id')
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')

        # Parse date parameters
        start_date = None
        end_date = None

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            except ValueError:
                pass

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            except ValueError:
                pass

        # Get all posts with date filtering
        posts = LinkedInAnalyticsService.get_all_posts(user_id, session_id, start_date, end_date)

        return Response({
            'success': True,
            'data': posts,
            'count': len(posts)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

