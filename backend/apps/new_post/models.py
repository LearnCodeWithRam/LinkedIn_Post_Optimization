from django.db import models
from django.conf import settings
from apps.core.base_models import BaseModel


class ChatSession(BaseModel):
    """
    Represents a chat session between a user and the AI assistant.
    Each session contains multiple messages and has metadata like title.
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_sessions',
        null=True,
        blank=True,
        help_text='User who owns this chat session. Null for anonymous users.'
    )
    
    session_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text='Unique identifier for this session (from frontend)'
    )
    
    title = models.CharField(
        max_length=255,
        default='New Chat',
        help_text='Title of the chat session, auto-generated from first message'
    )
    
    user_identifier = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        db_index=True,
        help_text='Anonymous user identifier (for non-authenticated users)'
    )
    
    last_message_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp of the last message in this session'
    )
    
    message_count = models.IntegerField(
        default=0,
        help_text='Total number of messages in this session'
    )
    
    class Meta:
        ordering = ['-last_message_at']
        indexes = [
            models.Index(fields=['user', '-last_message_at']),
            models.Index(fields=['user_identifier', '-last_message_at']),
            models.Index(fields=['session_id']),
        ]
        verbose_name = 'Chat Session'
        verbose_name_plural = 'Chat Sessions'
    
    def __str__(self):
        user_display = self.user.username if self.user else self.user_identifier or 'Anonymous'
        return f"{self.title} - {user_display}"
    
    def update_title_from_message(self, message_content):
        """
        Auto-generate title from the first user message.
        Takes first 50 characters and adds ellipsis if needed.
        """
        if self.title == 'New Chat' and message_content:
            # Clean and truncate the message
            clean_message = message_content.strip()
            if len(clean_message) > 50:
                self.title = clean_message[:50] + '...'
            else:
                self.title = clean_message
            self.save(update_fields=['title', 'updated_at'])


class ChatMessage(BaseModel):
    """
    Represents a single message in a chat session.
    Can be from either the user or the AI assistant.
    """
    
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]
    
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text='The chat session this message belongs to'
    )
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        help_text='Who sent this message'
    )
    
    content = models.TextField(
        help_text='The actual message content'
    )
    
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text='Additional metadata (model, tokens, processing time, etc.)'
    )
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
    
    def __str__(self):
        content_preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        return f"{self.role}: {content_preview}"
    
    def save(self, *args, **kwargs):
        """Override save to update session's message count and last_message_at."""
        # Check if this is being called from session update to prevent recursion
        skip_session_update = kwargs.pop('skip_session_update', False)
        
        is_new = self.pk is None
        print(f"💾 Saving ChatMessage: is_new={is_new}, role={self.role}, skip_session_update={skip_session_update}")
        super().save(*args, **kwargs)
        
        # Always update session metadata (not just for new messages)
        if not skip_session_update:
            message_count_before = self.session.message_count
            self.session.message_count = self.session.messages.count()
            self.session.last_message_at = self.created_at
            print(f"📊 Updating session: message_count {message_count_before} → {self.session.message_count}")
            self.session.save(update_fields=['message_count', 'last_message_at', 'updated_at'])
            
            # Auto-generate title from first user message
            if self.role == 'user' and self.session.message_count == 1:
                print(f"📝 Updating title from first user message: '{self.content[:50]}'")
                self.session.update_title_from_message(self.content)
            else:
                print(f"⏭️ Skipping title update: role={self.role}, message_count={self.session.message_count}")



class DraftPost(BaseModel):
    """
    Represents a draft or published LinkedIn post.
    Stores post content, media files, and scheduling information.
    """
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='draft_posts',
        help_text='User who created this post'
    )
    
    content = models.TextField(
        help_text='The post content/text'
    )
    
    media_files = models.JSONField(
        null=True,
        blank=True,
        help_text='Metadata about uploaded media files (URLs, types, names)'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        help_text='Current status of the post'
    )
    
    scheduled_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Scheduled time for posting (if scheduled)'
    )
    
    poll_data = models.JSONField(
        null=True,
        blank=True,
        help_text='Poll question and options if post includes a poll'
    )
    
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when the post was published'
    )
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status', '-updated_at']),
            models.Index(fields=['user', '-created_at']),
        ]
        verbose_name = 'Draft Post'
        verbose_name_plural = 'Draft Posts'
    
    def __str__(self):
        content_preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        return f"{self.user.username} - {self.status}: {content_preview}"
    
    
    def publish(self):
        """Mark the draft as published."""
        from django.utils import timezone
        self.status = 'published'
        self.published_at = timezone.now()
        self.save(update_fields=['status', 'published_at', 'updated_at'])
