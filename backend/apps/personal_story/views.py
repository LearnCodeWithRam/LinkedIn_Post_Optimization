"""
Personal Story API Views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PersonalStory
from .serializers import PersonalStorySerializer, PersonalStoryChoicesSerializer


# Predefined choices for dropdowns
ROLE_CHOICES = [
    "Software Engineer", "Data Scientist", "Product Manager", "Marketing Manager",
    "Sales Representative", "Business Analyst", "Designer", "Content Creator",
    "HR Manager", "Financial Analyst", "Consultant", "Entrepreneur",
    "Executive/C-Level", "Student", "Other"
]

INDUSTRY_CHOICES = [
    "Technology", "Finance", "Healthcare", "Education", "Marketing & Advertising",
    "Retail & E-commerce", "Manufacturing", "Consulting", "Real Estate",
    "Media & Entertainment", "Non-Profit", "Government", "Other"
]

SENIORITY_CHOICES = [
    "Entry Level (0-2 years)", "Mid-Level (3-5 years)", "Senior (6-10 years)",
    "Lead/Principal (10+ years)", "Manager", "Director", "VP/Executive", "C-Level"
]

COMPANY_SIZE_CHOICES = [
    "Startup (1-50 employees)", "Small Business (51-200 employees)",
    "Mid-size (201-1000 employees)", "Large Enterprise (1000+ employees)",
    "Freelance/Self-employed"
]

INTEREST_CHOICES = [
    "Artificial Intelligence & Machine Learning", "Leadership & Management",
    "Productivity & Time Management", "Career Development", "Entrepreneurship",
    "Digital Marketing", "Sales & Business Development", "Personal Branding",
    "Innovation & Technology", "Work-Life Balance", "Mental Health & Wellness",
    "Diversity & Inclusion", "Sustainability", "Remote Work", "Networking"
]

CONTENT_TOPIC_CHOICES = [
    "Industry News & Trends", "Career Tips & Advice", "Success Stories",
    "How-To Guides & Tutorials", "Thought Leadership", "Company Culture",
    "Product Updates", "Case Studies", "Personal Experiences", "Motivational Content"
]

CONTENT_TONE_CHOICES = [
    "Professional & Formal", "Conversational & Casual", "Inspirational & Motivational",
    "Educational & Informative", "Humorous & Light-hearted", "Thought-Provoking"
]

POST_LENGTH_CHOICES = [
    "Short (1-2 paragraphs)", "Medium (3-5 paragraphs)", "Long (6+ paragraphs)"
]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_choices(request):
    """
    Get all available choices for dropdown menus
    """
    choices = {
        'roles': ROLE_CHOICES,
        'industries': INDUSTRY_CHOICES,
        'seniority_levels': SENIORITY_CHOICES,
        'company_sizes': COMPANY_SIZE_CHOICES,
        'interests': INTEREST_CHOICES,
        'content_topics': CONTENT_TOPIC_CHOICES,
        'content_tones': CONTENT_TONE_CHOICES,
        'post_length_preferences': POST_LENGTH_CHOICES,
    }
    
    serializer = PersonalStoryChoicesSerializer(choices)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['GET', 'POST', 'PUT'])
@permission_classes([IsAuthenticated])
def personal_story(request):
    """
    GET: Retrieve user's personal story
    POST/PUT: Create or update user's personal story
    """
    user_id = str(request.user.id)
    
    if request.method == 'GET':
        try:
            story = PersonalStory.objects(user_id=user_id).first()
            if story:
                serializer = PersonalStorySerializer(story.to_dict())
                return Response({
                    'success': True,
                    'data': serializer.data
                })
            else:
                return Response({
                    'success': True,
                    'data': None,
                    'message': 'No personal story found'
                })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method in ['POST', 'PUT']:
        serializer = PersonalStorySerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if story exists
            story = PersonalStory.objects(user_id=user_id).first()
            
            if story:
                # Update existing story
                for key, value in serializer.validated_data.items():
                    setattr(story, key, value)
                story.save()
                message = 'Personal story updated successfully'
            else:
                # Create new story
                story = PersonalStory(
                    user_id=user_id,
                    **serializer.validated_data
                )
                story.save()
                message = 'Personal story created successfully'
            
            return Response({
                'success': True,
                'message': message,
                'data': PersonalStorySerializer(story.to_dict()).data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_personal_story(request):
    """
    Delete user's personal story
    """
    user_id = str(request.user.id)
    
    try:
        story = PersonalStory.objects(user_id=user_id).first()
        if story:
            story.delete()
            return Response({
                'success': True,
                'message': 'Personal story deleted successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'No personal story found'
            }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
