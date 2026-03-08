from rest_framework import serializers


class ChatMessageSerializer(serializers.Serializer):
    """
    Serializer for chat messages to the LinkedIn Post Bot.
    """
    message = serializers.CharField(
        required=True,
        max_length=2000,
        help_text="Your message to the LinkedIn Post Bot"
    )
    session_id = serializers.CharField(
        required=False,
        max_length=100,
        default='default',
        help_text="Session ID for conversation continuity (optional)"
    )
    
    def validate_message(self, value):
        """Validate message is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty")
        return value.strip()


class ChatResponseSerializer(serializers.Serializer):
    """
    Serializer for chat bot responses.
    """
    success = serializers.BooleanField()
    session_id = serializers.CharField()
    message = serializers.CharField()
    response = serializers.CharField()
    history_length = serializers.IntegerField()
    timestamp = serializers.DictField(required=False, allow_null=True)


class LinkedInPostRequestSerializer(serializers.Serializer):
    """
    Enhanced serializer for LinkedIn post generation requests.
    """
    topic = serializers.CharField(
        required=True,
        max_length=500,
        help_text="Main topic or message for the LinkedIn post"
    )
    
    context = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text="Additional context, background, or specific requirements"
    )
    
    target_audience = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        help_text="Intended audience (e.g., 'startup founders', 'software engineers', 'B2B marketers')"
    )
    
    tone_preference = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
        help_text="Desired tone (e.g., 'inspirational', 'analytical', 'conversational', 'professional')"
    )
    
    include_personal_story = serializers.BooleanField(
        required=False,
        default=False,
        help_text="Whether to include a personal anecdote or story"
    )
    
    def validate_topic(self, value):
        """Validate topic is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Topic cannot be empty")
        return value.strip()


class OptimizedPostRequestSerializer(serializers.Serializer):
    """
    Serializer for post optimization requests.
    Takes original post and analysis data to generate targeted improvements.
    """
    original_post = serializers.CharField(
        required=True,
        max_length=10000,
        help_text="Original LinkedIn post content to optimize"
    )
    
    analysis_data = serializers.JSONField(
        required=True,
        help_text="Complete AI analysis data with recommendations"
    )
    
    post_id = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        help_text="Optional post ID for caching"
    )
    
    def validate_original_post(self, value):
        """Validate original post is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Original post cannot be empty")
        return value.strip()


class OptimizedPostResponseSerializer(serializers.Serializer):
    """
    Serializer for optimized post responses.
    """
    optimized_post = serializers.CharField(
        help_text="AI-optimized version of the post with targeted improvements"
    )
    
    improvements_made = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of specific improvements applied to the post"
    )
    
    original_post = serializers.CharField(
        help_text="Original post for reference"
    )


class LinkedInPostResponseSerializer(serializers.Serializer):
    """
    Enhanced serializer for generated LinkedIn post responses with structured data.
    """
    hook = serializers.CharField(
        help_text="Compelling first 2-3 lines of the post"
    )
    
    main_content = serializers.CharField(
        help_text="Core message and value content"
    )
    
    cta = serializers.CharField(
        help_text="Call-to-action question or prompt"
    )
    
    hashtags = serializers.ListField(
        child=serializers.CharField(),
        help_text="3-5 relevant hashtags for the post"
    )
    
    formatting_notes = serializers.CharField(
        help_text="Structure and readability notes"
    )
    
    engagement_score = serializers.CharField(
        help_text="Predicted engagement level: High/Medium/Low"
    )
    
    algorithm_compliance = serializers.CharField(
        help_text="Compliance with LinkedIn algorithm best practices"
    )
    
    final_post = serializers.CharField(
        help_text="Complete formatted LinkedIn post ready to publish"
    )
    
    improvement_suggestions = serializers.ListField(
        child=serializers.CharField(),
        help_text="Optional improvements for the post"
    )
    
    # Additional metadata
    word_count = serializers.IntegerField(
        required=False,
        help_text="Number of words in the post"
    )
    
    character_count = serializers.IntegerField(
        required=False,
        help_text="Number of characters in the post"
    )
    
    topic = serializers.CharField(
        required=False,
        help_text="Original topic requested"
    )


class SimpleLinkedInPostResponseSerializer(serializers.Serializer):
    """
    Simplified response serializer for backward compatibility.
    """
    final_post = serializers.CharField(
        help_text="Complete formatted LinkedIn post ready to publish"
    )
    
    hashtags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Hashtags found in the post"
    )
    
    word_count = serializers.IntegerField(
        required=False,
        help_text="Number of words in the post"
    )
    
    character_count = serializers.IntegerField(
        required=False,
        help_text="Number of characters in the post"
    )
    
    topic = serializers.CharField(
        required=False,
        help_text="Original topic requested"
    )


class ConversationHistorySerializer(serializers.Serializer):
    """
    Serializer for conversation history.
    """
    session_id = serializers.CharField()
    history = serializers.ListField(
        child=serializers.DictField(),
        help_text="List of conversation messages"
    )
    message_count = serializers.IntegerField()


class SessionInfoSerializer(serializers.Serializer):
    """
    Serializer for session information.
    """
    session_id = serializers.CharField()
    message_count = serializers.IntegerField()
    last_activity = serializers.DateTimeField(required=False)


class ActiveSessionsSerializer(serializers.Serializer):
    """
    Serializer for active sessions list.
    """
    active_sessions = serializers.IntegerField()
    session_ids = serializers.ListField(
        child=serializers.CharField()
    )


class EnhancedChatMessageSerializer(serializers.Serializer):
    """
    Enhanced chat message with generation parameters.
    Useful for chat-based generation with specific requirements.
    """
    message = serializers.CharField(
        required=True,
        max_length=2000,
        help_text="Your message to the LinkedIn Post Bot"
    )
    
    session_id = serializers.CharField(
        required=False,
        max_length=100,
        default='default',
        help_text="Session ID for conversation continuity (optional)"
    )
    
    # Optional generation parameters (can be included in chat)
    target_audience = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=200,
        help_text="Target audience for the post"
    )
    
    tone_preference = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=100,
        help_text="Desired tone"
    )
    
    def build_enhanced_message(self):
        """Build an enhanced message with parameters."""
        base_message = self.validated_data['message']
        parts = [base_message]
        
        if self.validated_data.get('target_audience'):
            parts.append(f"Target audience: {self.validated_data['target_audience']}")
        
        if self.validated_data.get('tone_preference'):
            parts.append(f"Tone: {self.validated_data['tone_preference']}")
        
        return "\n".join(parts)


# ============================================
# CHAT HISTORY SERIALIZERS
# ============================================

class ChatMessageModelSerializer(serializers.Serializer):
    """
    Serializer for ChatMessage model instances (read-only).
    """
    id = serializers.UUIDField(read_only=True)
    role = serializers.CharField(read_only=True)
    content = serializers.CharField(read_only=True)
    metadata = serializers.JSONField(required=False, allow_null=True, read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class ChatSessionListSerializer(serializers.Serializer):
    """
    Serializer for listing chat sessions (summary view).
    """
    id = serializers.UUIDField(read_only=True)
    session_id = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    last_message_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class ChatSessionDetailSerializer(serializers.Serializer):
    """
    Serializer for chat session with messages (detail view).
    """
    id = serializers.UUIDField(read_only=True)
    session_id = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    last_message_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    messages = ChatMessageModelSerializer(many=True, read_only=True)


class CreateChatSessionSerializer(serializers.Serializer):
    """
    Serializer for creating a new chat session.
    """
    session_id = serializers.CharField(
        max_length=255,
        help_text="Unique session identifier from frontend"
    )
    title = serializers.CharField(
        max_length=255,
        required=False,
        default='New Chat',
        help_text="Session title"
    )
    user_identifier = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        help_text="Anonymous user identifier (if not authenticated)"
    )


class UpdateSessionTitleSerializer(serializers.Serializer):
    """
    Serializer for updating session title.
    """
    title = serializers.CharField(
        max_length=255,
        help_text="New title for the session"
    )


class SaveChatMessageSerializer(serializers.Serializer):
    """
    Serializer for saving a chat message to a session.
    """
    session_id = serializers.CharField(
        max_length=255,
        help_text="Session ID to save message to"
    )
    role = serializers.ChoiceField(
        choices=['user', 'assistant', 'system'],
        help_text="Message sender role"
    )
    content = serializers.CharField(
        help_text="Message content"
    )
    metadata = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text="Optional metadata (model, tokens, etc.)"
    )






# from rest_framework import serializers


# class LinkedInPostRequestSerializer(serializers.Serializer):
#     """
#     Serializer for LinkedIn post generation requests.
#     """
#     topic = serializers.CharField(
#         required=True,
#         max_length=500,
#         help_text="Main topic or message for the LinkedIn post"
#     )
    
#     context = serializers.CharField(
#         required=False,
#         allow_blank=True,
#         max_length=1000,
#         help_text="Additional context or background information"
#     )
    
#     target_audience = serializers.CharField(
#         required=False,
#         allow_blank=True,
#         max_length=200,
#         help_text="Intended audience (e.g., 'startup founders', 'B2B marketers')"
#     )
    
#     tone_preference = serializers.CharField(
#         required=False,
#         allow_blank=True,
#         max_length=100,
#         help_text="Desired tone (e.g., 'inspirational', 'analytical', 'conversational')"
#     )
    
#     include_personal_story = serializers.BooleanField(
#         required=False,
#         default=False,
#         help_text="Whether to include a personal anecdote or story"
#     )
    
#     def validate_topic(self, value):
#         """Validate topic is not empty."""
#         if not value or not value.strip():
#             raise serializers.ValidationError("Topic cannot be empty")
#         return value.strip()
    
#     def validate_tone_preference(self, value):
#         """Validate tone preference is one of acceptable values."""
#         if not value:
#             return value
        
#         valid_tones = [
#             'inspirational', 'analytical', 'conversational', 
#             'professional', 'casual', 'thought-provoking',
#             'contrarian', 'educational', 'storytelling'
#         ]
        
#         value_lower = value.lower().strip()
#         if value_lower not in valid_tones:
#             # Don't raise error, just warn in response
#             pass
        
#         return value.strip()


# class LinkedInPostResponseSerializer(serializers.Serializer):
#     """
#     Serializer for LinkedIn post generation responses.
#     """
#     hook = serializers.CharField(
#         help_text="Compelling first 2 lines of the post"
#     )
    
#     main_content = serializers.CharField(
#         help_text="Core message and value content (150-300 words)"
#     )
    
#     cta = serializers.CharField(
#         help_text="Call-to-action question or prompt"
#     )
    
#     hashtags = serializers.ListField(
#         child=serializers.CharField(),
#         help_text="3-5 relevant hashtags for the post"
#     )
    
#     formatting_notes = serializers.CharField(
#         help_text="Structure and readability notes"
#     )
    
#     engagement_score = serializers.CharField(
#         help_text="Predicted engagement level: High/Medium/Low"
#     )
    
#     algorithm_compliance = serializers.CharField(
#         help_text="Compliance with LinkedIn 2025 algorithm best practices"
#     )
    
#     final_post = serializers.CharField(
#         help_text="Complete formatted LinkedIn post ready to publish"
#     )
    
#     improvement_suggestions = serializers.ListField(
#         child=serializers.CharField(),
#         help_text="Optional improvements for the post"
#     )


# class PostGenerationStatusSerializer(serializers.Serializer):
#     """
#     Serializer for async post generation status.
#     """
#     task_id = serializers.CharField(
#         help_text="Celery task ID for tracking generation status"
#     )
    
#     status = serializers.ChoiceField(
#         choices=['PENDING', 'PROCESSING', 'SUCCESS', 'FAILURE'],
#         help_text="Current status of the generation task"
#     )
    
#     result = LinkedInPostResponseSerializer(
#         required=False,
#         allow_null=True,
#         help_text="Generated post (only available when status is SUCCESS)"
#     )
    
#     error = serializers.CharField(
#         required=False,
#         allow_null=True,
#         help_text="Error message (only available when status is FAILURE)"
#     )


# class QuickPostRequestSerializer(serializers.Serializer):
#     """
#     Simplified serializer for quick post generation with minimal parameters.
#     """
#     topic = serializers.CharField(
#         required=True,
#         max_length=500,
#         help_text="What do you want to post about?"
#     )
    
#     style = serializers.ChoiceField(
#         choices=[
#             ('story', 'Personal Story'),
#             ('insight', 'Professional Insight'),
#             ('announcement', 'Announcement'),
#             ('question', 'Thought-Provoking Question'),
#             ('tips', 'Tips and Advice'),
#         ],
#         required=False,
#         default='insight',
#         help_text="Style of post"
#     )


# class PostAnalyticsSerializer(serializers.Serializer):
#     """
#     Serializer for post analytics and predictions.
#     """
#     expected_views = serializers.CharField(
#         help_text="Expected view range"
#     )
    
#     expected_comments = serializers.CharField(
#         help_text="Expected number of comments"
#     )
    
#     expected_engagement_rate = serializers.CharField(
#         help_text="Expected engagement rate percentage"
#     )
    
#     best_posting_time = serializers.CharField(
#         help_text="Recommended time to post for maximum engagement"
#     )
    
#     algorithm_score = serializers.CharField(
#         help_text="How well this post aligns with LinkedIn's 2025 algorithm"
#     )

# ============================================
# DRAFT POST SERIALIZERS
# ============================================

class DraftPostSerializer(serializers.Serializer):
    """
    Serializer for draft posts.
    """
    id = serializers.UUIDField(read_only=True)
    content = serializers.CharField(
        required=True,
        help_text='Post content/text'
    )
    media_files = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text='Media files metadata'
    )
    status = serializers.ChoiceField(
        choices=[('draft', 'Draft'), ('published', 'Published')],
        default='draft',
        help_text='Post status'
    )
    scheduled_time = serializers.DateTimeField(
        required=False,
        allow_null=True,
        help_text='Scheduled posting time'
    )
    poll_data = serializers.JSONField(
        required=False,
        allow_null=True,
        help_text='Poll question and options'
    )
    published_at = serializers.DateTimeField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    def validate_content(self, value):
        """Validate content is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Content cannot be empty')
        return value.strip()

