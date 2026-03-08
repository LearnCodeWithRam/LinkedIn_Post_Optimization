"""
Personal Story MongoDB Model
Stores user's professional information for personalized content recommendations
"""
from mongoengine import Document, StringField, ListField, DateTimeField
from datetime import datetime


class PersonalStory(Document):
    """
    Store user's personal professional story and preferences
    """
    # User reference
    user_id = StringField(required=True, unique=True)
    
    # Professional Information
    role = StringField(required=True, max_length=100)  # e.g., "Software Engineer", "Marketing Manager"
    industry = StringField(required=True, max_length=100)  # e.g., "Technology", "Healthcare"
    seniority_level = StringField(max_length=50)  # e.g., "Entry Level", "Mid-Level", "Senior", "Executive"
    company_size = StringField(max_length=50)  # e.g., "Startup", "SMB", "Enterprise"
    
    # Interests and Focus Areas
    interests = ListField(StringField(max_length=100))  # e.g., ["AI/ML", "Leadership", "Productivity"]
    content_topics = ListField(StringField(max_length=100))  # Topics they want to see
    
    # Personal Story
    job_description = StringField()  # What they do day-to-day
    career_goals = StringField()  # What they're working towards
    personal_story = StringField()  # Their unique story/background
    
    # Content Preferences
    content_tone = StringField(max_length=50)  # e.g., "Professional", "Casual", "Inspirational"
    post_length_preference = StringField(max_length=50)  # e.g., "Short", "Medium", "Long"
    
    # Metadata
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'personal_stories',
        'indexes': [
            'user_id',
            'role',
            'industry',
        ]
    }
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super(PersonalStory, self).save(*args, **kwargs)
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'user_id': self.user_id,
            'role': self.role,
            'industry': self.industry,
            'seniority_level': self.seniority_level,
            'company_size': self.company_size,
            'interests': self.interests,
            'content_topics': self.content_topics,
            'job_description': self.job_description,
            'career_goals': self.career_goals,
            'personal_story': self.personal_story,
            'content_tone': self.content_tone,
            'post_length_preference': self.post_length_preference,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
