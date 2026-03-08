# ============================================================================
# models.py - MongoEngine Documents (UPDATED with sheet_name support)
# ============================================================================
from mongoengine import Document, fields
from datetime import datetime


class LinkedInFollower(Document):
    """Model for LinkedIn follower data"""
    user_id = fields.StringField(required=True, max_length=200)
    user_email = fields.StringField(required=True, max_length=255)
    upload_session_id = fields.StringField(required=True, max_length=100)
    sheet_name = fields.StringField(default='New followers', max_length=200)  # Track which sheet the data came from
    data = fields.DictField(required=True)
    uploaded_at = fields.DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'linkedin_followers',
        'indexes': [
            'user_id',
            'user_email',
            'upload_session_id',
            'sheet_name',
            '-uploaded_at'
        ],
        'ordering': ['-uploaded_at']
    }
    
    def __str__(self):
        return f"LinkedInFollower({self.user_email} - {self.sheet_name} - {self.upload_session_id})"


class LinkedInVisitor(Document):
    """Model for LinkedIn visitor data"""
    user_id = fields.StringField(required=True, max_length=200)
    user_email = fields.StringField(required=True, max_length=255)
    upload_session_id = fields.StringField(required=True, max_length=100)
    sheet_name = fields.StringField(default='Visitor metrics', max_length=200)  # Track which sheet the data came from
    data = fields.DictField(required=True)
    uploaded_at = fields.DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'linkedin_visitors',
        'indexes': [
            'user_id',
            'user_email',
            'upload_session_id',
            'sheet_name',
            '-uploaded_at'
        ],
        'ordering': ['-uploaded_at']
    }
    
    def __str__(self):
        return f"LinkedInVisitor({self.user_email} - {self.sheet_name} - {self.upload_session_id})"


class LinkedInContent(Document):
    """
    Model for LinkedIn content data
    Supports multiple sheets (e.g., 'Metrics', 'All Posts')
    """
    user_id = fields.StringField(required=True, max_length=200)
    user_email = fields.StringField(required=True, max_length=255)
    upload_session_id = fields.StringField(required=True, max_length=100)
    sheet_name = fields.StringField(default='Sheet1', max_length=200)  # Track which sheet the data came from
    data = fields.DictField(required=True)
    uploaded_at = fields.DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'linkedin_content',
        'indexes': [
            'user_id',
            'user_email',
            'upload_session_id',
            'sheet_name',  # Index for querying by sheet
            '-uploaded_at'
        ],
        'ordering': ['-uploaded_at']
    }
    
    def __str__(self):
        return f"LinkedInContent({self.user_email} - {self.sheet_name} - {self.upload_session_id})"
    
    @classmethod
    def get_by_sheet(cls, user_id, session_id, sheet_name):
        """
        Helper method to retrieve data from a specific sheet
        
        Args:
            user_id: User ID string
            session_id: Upload session ID
            sheet_name: Name of the sheet (e.g., 'Metrics', 'All Posts')
        
        Returns:
            QuerySet of LinkedInContent documents
        
        Usage:
            metrics = LinkedInContent.get_by_sheet(user_id, session_id, 'Metrics')
            posts = LinkedInContent.get_by_sheet(user_id, session_id, 'All Posts')
        """
        return cls.objects(
            user_id=str(user_id),
            upload_session_id=session_id,
            sheet_name=sheet_name
        )
    
    @classmethod
    def get_all_sheets(cls, user_id, session_id):
        """
        Get all unique sheet names for a user's upload session
        
        Args:
            user_id: User ID string
            session_id: Upload session ID
        
        Returns:
            list: List of sheet names (e.g., ['Metrics', 'All Posts'])
        
        Usage:
            sheets = LinkedInContent.get_all_sheets(user_id, session_id)
            # Returns: ['Metrics', 'All Posts']
        """
        return cls.objects(
            user_id=str(user_id),
            upload_session_id=session_id
        ).distinct('sheet_name')


class ExcelUploadLog(Document):
    """Model for tracking Excel file uploads"""
    user_id = fields.StringField(required=True, max_length=200)
    user_email = fields.StringField(required=True, max_length=255)
    upload_session_id = fields.StringField(required=True, unique=True, max_length=100)
    uploaded_at = fields.DateTimeField(default=datetime.utcnow)
    followers_file = fields.StringField(required=True, max_length=255)
    visitors_file = fields.StringField(required=True, max_length=255)
    content_file = fields.StringField(required=True, max_length=255)
    status = fields.StringField(
        default='pending',
        max_length=20,
        choices=['pending', 'processing', 'success', 'failed', 'partial']
    )
    error_message = fields.StringField()
    followers_records = fields.IntField(default=0)
    visitors_records = fields.IntField(default=0)
    content_records = fields.IntField(default=0)
    content_sheets = fields.ListField(fields.StringField())  # NEW: Track sheet names in content file
    ip_address = fields.StringField(max_length=45)
    json_files_saved = fields.BooleanField(default=False)
    db_saved = fields.BooleanField(default=False)
    
    meta = {
        'collection': 'excel_upload_logs',
        'indexes': [
            'user_id',
            'user_email',
            'upload_session_id',
            '-uploaded_at'
        ],
        'ordering': ['-uploaded_at']
    }
    
    def __str__(self):
        return f"Upload {self.upload_session_id} by {self.user_email}"
    
    def add_content_sheet(self, sheet_name):
        """
        Helper method to add a sheet name to content_sheets list
        
        Args:
            sheet_name: Name of the sheet to add
        """
        if not self.content_sheets:
            self.content_sheets = []
        if sheet_name not in self.content_sheets:
            self.content_sheets.append(sheet_name)
            self.save()