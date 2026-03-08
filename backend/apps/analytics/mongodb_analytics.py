# ============================================================================
# mongodb_analytics.py - MongoDB-based LinkedIn Analytics Service
# ============================================================================
from apps.upload_excel_to_json.models import LinkedInFollower, LinkedInVisitor, LinkedInContent
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from .date_utils import DateFilterUtils


class LinkedInAnalyticsService:
    """Service to aggregate and analyze LinkedIn data from MongoDB"""
    
    @staticmethod
    def get_latest_session_id(user_id: str) -> Optional[str]:
        """Get the most recent upload session ID for a user"""
        try:
            latest_content = LinkedInContent.objects(user_id=user_id).order_by('-uploaded_at').first()
            if latest_content:
                return latest_content.upload_session_id
            return None
        except Exception as e:
            print(f"Error getting latest session: {e}")
            return None
    
    @staticmethod
    def get_dashboard_summary(user_id: str, session_id: Optional[str] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Get dashboard summary with total metrics
        Uses 'Metrics' sheet from content data
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return {
                    'totalImpressions': 0,
                    'totalClicks': 0,
                    'totalReactions': 0,
                    'totalComments': 0,
                    'totalReposts': 0,
                    'totalShares': 0,
                    'totalLikes': 0,
                    'avgEngagementRate': 0,
                    'impressionsChange': 0,
                    'clicksChange': 0,
                    'reactionsChange': 0,
                    'commentsChange': 0,
                }
            
            # Get all Metrics data from LinkedInContent
            metrics_data = LinkedInContent.objects(
                user_id=user_id,
                upload_session_id=session_id,
                sheet_name='Metrics'
            )
            
            total_impressions_organic = 0
            total_impressions_sponsored = 0
            total_unique_impressions_organic = 0
            total_clicks_organic = 0
            total_clicks_sponsored = 0
            total_reactions_organic = 0
            total_reactions_sponsored = 0
            total_comments_organic = 0
            total_comments_sponsored = 0
            total_reposts_organic = 0
            total_reposts_sponsored = 0
            engagement_rates = []
            
            for record in metrics_data:
                data = record.data
                
                # Filter by date range if specified
                if start_date or end_date:
                    date_str = data.get('Date', '')
                    if date_str:
                        try:
                            # Try parsing different date formats
                            record_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                                try:
                                    record_date = datetime.strptime(date_str, fmt)
                                    break
                                except ValueError:
                                    continue
                            
                            if record_date:
                                # Compare only dates (not times) for inclusive filtering
                                record_date_only = record_date.date()
                                if start_date and record_date_only < start_date.date():
                                    continue
                                if end_date and record_date_only > end_date.date():
                                    continue
                        except:
                            pass
                
                # Sum up metrics
                total_impressions_organic += int(data.get('Impressions (organic)', 0) or 0)
                total_impressions_sponsored += int(data.get('Impressions (sponsored)', 0) or 0)
                total_unique_impressions_organic += int(data.get('Unique impressions (organic)', 0) or 0)
                total_clicks_organic += int(data.get('Clicks (organic)', 0) or 0)
                total_clicks_sponsored += int(data.get('Clicks (sponsored)', 0) or 0)
                total_reactions_organic += int(data.get('Reactions (organic)', 0) or 0)
                total_reactions_sponsored += int(data.get('Reactions (sponsored)', 0) or 0)
                total_comments_organic += int(data.get('Comments (organic)', 0) or 0)
                total_comments_sponsored += int(data.get('Comments (sponsored)', 0) or 0)
                total_reposts_organic += int(data.get('Reposts (organic)', 0) or 0)
                total_reposts_sponsored += int(data.get('Reposts (sponsored)', 0) or 0)
                
                # Collect engagement rates
                eng_rate = data.get('Engagement rate (total)', 0)
                if eng_rate:
                    try:
                        engagement_rates.append(float(eng_rate) * 100)  # Convert to percentage
                    except:
                        pass
            
            total_impressions = total_impressions_organic + total_impressions_sponsored
            total_clicks = total_clicks_organic + total_clicks_sponsored
            total_reactions = total_reactions_organic + total_reactions_sponsored
            total_comments = total_comments_organic + total_comments_sponsored
            total_reposts = total_reposts_organic + total_reposts_sponsored
            total_unique_impressions=total_unique_impressions_organic
            
            avg_engagement_rate = sum(engagement_rates) / len(engagement_rates) if engagement_rates else 0
            
            # Calculate period comparison (mock data for now - can be enhanced with date filtering)
            impressions_change = 15.8 if total_impressions > 0 else 0
            clicks_change = 12.5 if total_clicks > 0 else 0
            reactions_change = 8.2 if total_reactions > 0 else 0
            comments_change = -3.1 if total_comments > 0 else 0
            
            return {
                'totalImpressions': total_impressions,
                'totalUniqueImpressions': total_unique_impressions,
                'totalClicks': total_clicks,
                'totalReactions': total_reactions,
                'totalComments': total_comments,
                'totalReposts': total_reposts,
                'totalShares': total_reposts,  # LinkedIn calls reposts as shares in some contexts
                'totalLikes': total_reactions,  # Reactions include likes
                'avgEngagementRate': round(avg_engagement_rate, 2),
                'impressionsChange': impressions_change,
                'clicksChange': clicks_change,
                'reactionsChange': reactions_change,
                'commentsChange': comments_change,
            }
            
        except Exception as e:
            print(f"Error getting dashboard summary: {e}")
            return {
                'totalImpressions': 0,
                'totalClicks': 0,
                'totalReactions': 0,
                'totalComments': 0,
                'totalReposts': 0,
                'totalShares': 0,
                'totalLikes': 0,
                'avgEngagementRate': 0,
                'impressionsChange': 0,
                'clicksChange': 0,
                'reactionsChange': 0,
                'commentsChange': 0,
            }
    
    @staticmethod
    def get_engagement_trends(user_id: str, session_id: Optional[str] = None, days: int = 30, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get engagement trends over time from Metrics sheet
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return []
            
            metrics_data = LinkedInContent.objects(
                user_id=user_id,
                upload_session_id=session_id,
                sheet_name='Metrics'
            ).order_by('data__Date')
            
            trends = []
            for record in metrics_data:
                data = record.data
                date_str = data.get('Date', '')
                
                # Filter by date range if specified
                if start_date or end_date:
                    if date_str:
                        try:
                            record_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                                try:
                                    record_date = datetime.strptime(date_str, fmt)
                                    break
                                except ValueError:
                                    continue
                            
                            if record_date:
                                # Compare only dates (not times) for inclusive filtering
                                record_date_only = record_date.date()
                                if start_date and record_date_only < start_date.date():
                                    continue
                                if end_date and record_date_only > end_date.date():
                                    continue
                        except:
                            continue
                
                trends.append({
                    'date': date_str,
                    'impressions': int(data.get('Impressions (total)', 0) or 0),
                    'clicks': int(data.get('Clicks (total)', 0) or 0),
                    'reactions': int(data.get('Reactions (total)', 0) or 0),
                    'likes': int(data.get('Reactions (total)', 0) or 0),
                    'comments': int(data.get('Comments (total)', 0) or 0),
                    'shares': int(data.get('Reposts (total)', 0) or 0),
                    'reposts': int(data.get('Reposts (total)', 0) or 0),
                    'engagementRate': float(data.get('Engagement rate (total)', 0) or 0) * 100,
                })
            
            # If no date filter but days specified, return last N days
            if not start_date and not end_date and days:
                return trends[-days:]
            
            return trends
            
        except Exception as e:
            print(f"Error getting engagement trends: {e}")
            return []
    
    @staticmethod
    def get_top_posts(user_id: str, session_id: Optional[str] = None, limit: int = 10, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get top performing posts from 'All posts' sheet
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return []
            
            posts_data = LinkedInContent.objects(
                user_id=user_id,
                upload_session_id=session_id,
                sheet_name__in=['All posts', 'All post']  # Handle both singular and plural
            )
            
            posts = []
            for record in posts_data:
                data = record.data
                
                # Filter by date range if specified
                if start_date or end_date:
                    date_str = data.get('Created date', '')
                    if date_str:
                        try:
                            record_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                                try:
                                    record_date = datetime.strptime(date_str, fmt)
                                    break
                                except ValueError:
                                    continue
                            
                            if record_date:
                                # Compare only dates (not times) for inclusive filtering
                                record_date_only = record_date.date()
                                if start_date and record_date_only < start_date.date():
                                    continue
                                if end_date and record_date_only > end_date.date():
                                    continue
                        except:
                            continue
                
        
                impressions = int(data.get('Impressions', 0) or 0)
                likes = int(data.get('Likes', 0) or 0)
                comments = int(data.get('Comments', 0) or 0)
                reposts = int(data.get('Reposts', 0) or 0)
                # engagement_rate = float(data.get('Engagement rate',''))
                
                total_engagement = likes + comments + reposts
                engagement_rate = (total_engagement / impressions * 100) if impressions > 0 else 0
                
                posts.append({
                    'id': data.get('Post link', '')[-20:],  # Use last part of link as ID
                    'post_title': data.get('Post title','')[:200], # First 150 chars
                    'content': data.get('Post title', ''),  
                    'post_link': data.get('Post link', ''),
                    'post_type': data.get('Post type',''),
                    'posted_by': data.get('Posted by',''),
                    'date': data.get('Created date', ''),
                    'impressions': impressions,
                    'views': data.get('Views',''),
                    'clicks': data.get('Clicks', ''),
                    'Click through rate (CTR)': data.get('Click through rate (CTR)',''),
                    'likes': likes,
                    'comments': comments,
                    'reposts': reposts,
                    'total_engagement': total_engagement,
                    'engagement_rate': round(engagement_rate, 2)
                })
            
            # Sort by engagement rate and return top N
            posts_sorted = sorted(posts, key=lambda x: x['engagement_rate'], reverse=True)
            return posts_sorted[:limit]
            
        except Exception as e:
            print(f"Error getting top posts: {e}")
            return []
    @staticmethod
    def get_all_posts(user_id: str, session_id: Optional[str] = None, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get all posts from 'All posts' sheet with optional date filtering
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)

            if not session_id:
                return []

            posts_data = LinkedInContent.objects(
                user_id=user_id,
                upload_session_id=session_id,
                sheet_name__in=['All posts', 'All post']  # Handle both singular and plural
            )

            posts = []
            for record in posts_data:
                data = record.data

                # Filter by date range if specified
                if start_date or end_date:
                    date_str = data.get('Created date', '')
                    if date_str:
                        try:
                            record_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%m/%d/%Y %H:%M']:
                                try:
                                    record_date = datetime.strptime(date_str, fmt)
                                    break
                                except ValueError:
                                    continue

                            if record_date:
                                # Compare only dates (not times) for inclusive filtering
                                record_date_only = record_date.date()
                                if start_date and record_date_only < start_date.date():
                                    continue
                                if end_date and record_date_only > end_date.date():
                                    continue
                        except:
                            continue

                impressions = int(data.get('Impressions', 0) or 0)
                likes = int(data.get('Likes', 0) or 0)
                comments = int(data.get('Comments', 0) or 0)
                reposts = int(data.get('Reposts', 0) or 0)
                clicks = int(data.get('Clicks', 0) or 0)

                total_engagement = likes + comments + reposts
                engagement_rate = (total_engagement / impressions * 100) if impressions > 0 else 0

                posts.append({
                    'id': data.get('Post link', '')[-20:],  # Use last part of link as ID
                    'post_title': data.get('Post title', '')[:200],
                    'content': data.get('Post title', ''),
                    'post_link': data.get('Post link', ''),
                    'post_type': data.get('Post type', ''),
                    'posted_by': data.get('Posted by', ''),
                    'date': data.get('Created date', ''),
                    'impressions': impressions,
                    'views': data.get('Views', ''),
                    'clicks': clicks,
                    'click_through_rate': data.get('Click through rate (CTR)', ''),
                    'likes': likes,
                    'comments': comments,
                    'reposts': reposts,
                    'total_engagement': total_engagement,
                    'engagement_rate': round(engagement_rate, 2)
                })

            # Sort by date (most recent first)
            posts_sorted = sorted(posts, key=lambda x: x['date'], reverse=True)
            return posts_sorted

        except Exception as e:
            print(f"Error getting all posts: {e}")
            import traceback
            traceback.print_exc()
            return []

    


    @staticmethod
    def get_follower_summary(user_id: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Get follower summary with total New followers
        Uses 'Metrics' sheet from content data
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return {
                    'totalFollowers': 0,
                }
            
            # Get all Metrics data from LinkedInContent

            follower_data = LinkedInFollower.objects(
                user_id=user_id,
                upload_session_id=session_id,
                sheet_name='New followers'
            )
            
            total_followers = 0
            
            for record in follower_data:
                data = record.data
                
                # Sum up metrics
                total_followers += int(data.get('Total followers', 0) or 0)
          
            return {
                'totalFollowers': total_followers
            }
            
        except Exception as e:
            print(f"Error getting dashboard summary: {e}")
            return {
                'totalFollowers': 0,
            }

    @staticmethod
    def get_follower_trends(user_id: str, session_id: Optional[str] = None, days: int = 30, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get follower growth trends over time
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return []
            
            follower_data = LinkedInFollower.objects(
                user_id=user_id,
                upload_session_id=session_id
            )
            
            trends = []
            for record in follower_data:
                data = record.data
                date_str = data.get('Date', '')
                
                # Filter by date range if specified
                if start_date or end_date:
                    if date_str:
                        try:
                            record_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                                try:
                                    record_date = datetime.strptime(date_str, fmt)
                                    break
                                except ValueError:
                                    continue
                            
                            if record_date:
                                # Compare only dates (not times) for inclusive filtering
                                record_date_only = record_date.date()
                                if start_date and record_date_only < start_date.date():
                                    continue
                                if end_date and record_date_only > end_date.date():
                                    continue
                        except:
                            continue
                
                trends.append({
                    'date': date_str,
                    'organicFollowers': int(data.get('Organic followers', 0) or 0),
                    'sponsoredFollowers': int(data.get('Sponsored followers', 0) or 0),
                    'totalFollowers': int(data.get('Total followers', 0) or 0),
                })
            
            # If no date filter but days specified, return last N days
            if not start_date and not end_date and days:
                return trends[-days:]
            
            return trends
            
        except Exception as e:
            print(f"Error getting follower trends: {e}")
            return []
    
    @staticmethod
    def get_visitor_metrics(user_id: str, session_id: Optional[str] = None, days: int = 30, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """
        Get visitor metrics over time
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return []
            
            visitor_data = LinkedInVisitor.objects(
                user_id=user_id,
                upload_session_id=session_id,
                sheet_name='Visitor metrics'  # Explicitly query the Visitor metrics sheet
            )
            
            metrics = []
            for record in visitor_data:
                data = record.data
                date_str = data.get('Date', '')
                
                # Filter by date range if specified
                if start_date or end_date:
                    if date_str:
                        try:
                            record_date = None
                            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                                try:
                                    record_date = datetime.strptime(date_str, fmt)
                                    break
                                except ValueError:
                                    continue
                            
                            if record_date:
                                # Compare only dates (not times) for inclusive filtering
                                record_date_only = record_date.date()
                                if start_date and record_date_only < start_date.date():
                                    continue
                                if end_date and record_date_only > end_date.date():
                                    continue
                        except:
                            continue
                
                metrics.append({
                    'date': date_str,
                    'pageViewsDesktop': int(data.get('Total page views (desktop)', 0) or 0),
                    'pageViewsMobile': int(data.get('Total page views (mobile)', 0) or 0),
                    'pageViewsTotal': int(data.get('Total page views (total)', 0) or 0),
                    'uniqueVisitorsDesktop': int(data.get('Total unique visitors (desktop)', 0) or 0),
                    'uniqueVisitorsMobile': int(data.get('Total unique visitors (mobile)', 0) or 0),
                    'uniqueVisitorsTotal': int(data.get('Total unique visitors (total)', 0) or 0),
                })
            
            # If no date filter but days specified, return last N days
            if not start_date and not end_date and days:
                return metrics[-days:]
            
            return metrics
            
        except Exception as e:
            print(f"Error getting visitor metrics: {e}")
            return []
    
    @staticmethod
    def get_demographics(user_id: str, session_id: Optional[str] = None, source: str = 'followers') -> Dict[str, Any]:
        """
        Get demographics data (Location, Job function, Seniority, Industry, Company size)
        source: 'followers' or 'visitors'
        """
        try:
            if not session_id:
                session_id = LinkedInAnalyticsService.get_latest_session_id(user_id)
            
            if not session_id:
                return {}
            
            # Select the appropriate model
            Model = LinkedInFollower if source == 'followers' else LinkedInVisitor
            
            demographics = {
                'location': [],
                'jobFunction': [],
                'seniority': [],
                'industry': [],
                'companySize': [],
            }
            
            # For visitors: use 'Total views' field
            # For followers: use 'Total followers' field
            count_field = 'Total followers' if source == 'followers' else 'Total views'
            
            # Extract demographics from different sheet names
            for sheet_name, demo_key, data_key in [
                ('Location', 'location', 'Location'),
                ('Job function', 'jobFunction', 'Job function'),
                ('Seniority', 'seniority', 'Seniority'),
                ('Industry', 'industry', 'Industry'),
                ('Company size', 'companySize', 'Company size'),
            ]:
                try:
                    # Query by sheet_name for better performance
                    records = Model.objects(
                        user_id=user_id,
                        upload_session_id=session_id,
                        sheet_name=sheet_name
                    )
                    
                    for record in records:
                        data = record.data
                        
                        # Extract the demographic value and count
                        if data_key in data:
                            name = data.get(data_key, '')
                            count_str = data.get(count_field, '0')
                            
                            # Handle count as string or int
                            try:
                                count = int(count_str) if count_str else 0
                            except (ValueError, TypeError):
                                count = 0
                            
                            if name and count > 0:  # Only add if we have valid data
                                demographics[demo_key].append({
                                    'name': str(name),
                                    'count': count,
                                })
                        
                except Exception as e:
                    print(f"Error extracting {sheet_name}: {e}")
                    continue
            
            # Sort each demographic by count (descending)
            for key in demographics:
                demographics[key] = sorted(demographics[key], key=lambda x: x['count'], reverse=True)
            
            return demographics
            
        except Exception as e:
            print(f"Error getting demographics: {e}")
            import traceback
            traceback.print_exc()
            return {
                'location': [],
                'jobFunction': [],
                'seniority': [],
                'industry': [],
                'companySize': [],
            }
