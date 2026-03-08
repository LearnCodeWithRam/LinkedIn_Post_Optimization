"""
Helper functions to get user's personal story for personalized scraping
"""
from apps.personal_story.models import PersonalStory


def get_user_personal_story(user_id: str) -> dict:
    """
    Get user's personal story data for personalized content scraping
    
    Args:
        user_id: User ID string
        
    Returns:
        Dictionary with user's preferences and story, or empty dict if not found
    """
    try:
        story = PersonalStory.objects(user_id=user_id).first()
        if story:
            return story.to_dict()
        return {}
    except Exception as e:
        print(f"Error fetching personal story: {e}")
        return {}


def build_scraping_context(user_id: str) -> str:
    """
    Build a context string from user's personal story for scraping personalization
    
    Args:
        user_id: User ID string
        
    Returns:
        Formatted string with user context for scraping
    """
    story_data = get_user_personal_story(user_id)
    
    if not story_data:
        return ""
    
    context_parts = []
    
    # Add role and industry
    if story_data.get('role'):
        context_parts.append(f"Role: {story_data['role']}")
    if story_data.get('industry'):
        context_parts.append(f"Industry: {story_data['industry']}")
    
    # Add interests
    if story_data.get('interests'):
        interests_str = ", ".join(story_data['interests'])
        context_parts.append(f"Interests: {interests_str}")
    
    # Add content topics
    if story_data.get('content_topics'):
        topics_str = ", ".join(story_data['content_topics'])
        context_parts.append(f"Content Topics: {topics_str}")
    
    # Add career goals
    if story_data.get('career_goals'):
        context_parts.append(f"Career Goals: {story_data['career_goals']}")
    
    return " | ".join(context_parts)


def get_scraping_keywords(user_id: str) -> list:
    """
    Extract keywords from user's personal story for targeted scraping
    
    Args:
        user_id: User ID string
        
    Returns:
        List of keywords for scraping
    """
    story_data = get_user_personal_story(user_id)
    
    if not story_data:
        return []
    
    keywords = []
    
    # Add role
    if story_data.get('role'):
        keywords.append(story_data['role'])
    
    # Add industry
    if story_data.get('industry'):
        keywords.append(story_data['industry'])
    
    # Add interests
    if story_data.get('interests'):
        keywords.extend(story_data['interests'])
    
    # Add content topics
    if story_data.get('content_topics'):
        keywords.extend(story_data['content_topics'])
    
    return keywords
