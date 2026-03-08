from django.urls import path
from .views import (
    # Chat endpoints
    ChatView,
    ChatHistoryView,
    ResetChatView,
    
    # Post generation endpoints
    GeneratePostView,
    QuickGenerateView,
    OptimizedGenerateView,

    # Info endpoints
    health_check,
    bot_info,
    # algorithm_info,
    
    # Session management
    ListSessionsView,
    
    # Chat history persistence
    ListUserChatSessionsView,
    LoadChatSessionView,
    DeleteChatSessionView,
    UpdateSessionTitleView,
    
    # Draft post views
    SaveDraftView,
    ListDraftsView,
    PublishDraftView,
    DeleteDraftView,
)

from .upload_views import UploadMediaView

from .views_viral_pattern import OptimizedWithViralPatternGenerateView

from .views import diagnostic_info, test_async_operation

app_name = 'new_post'

urlpatterns = [
    # ============================================
    # CHAT ENDPOINTS
    # ============================================
    # Main chat endpoint - send messages to the bot
    path('chat/', ChatView.as_view(), name='chat'),
    
    # Get conversation history for a session
    path('chat/history/', ChatHistoryView.as_view(), name='chat-history'),
    
    # Reset conversation (start fresh)
    path('chat/reset/', ResetChatView.as_view(), name='chat-reset'),
    
    # ============================================
    # POST GENERATION ENDPOINTS
    # ============================================
    
    # Generate structured post with all components
    path('generate/', GeneratePostView.as_view(), name='generate-post'),
    
    # Quick generation with simple response (backward compatible)
    path('generate/quick/', QuickGenerateView.as_view(), name='quick-generate'),
    
    #Optimized generation with improved version of the previous one
    path('generate/optimized/', OptimizedGenerateView.as_view(), name='optimized-generate'),

    #Advanced generation with improved version of the previous one
    path('generate/optimized-with-viral-pattern/', OptimizedWithViralPatternGenerateView.as_view(), name='optimized-with-viral-pattern'),


    # ============================================
    # SESSION MANAGEMENT
    # ============================================
    
    # List all sessions
    path('sessions/', ListSessionsView.as_view(), name='list-sessions'),
    
    # ============================================
    # CHAT HISTORY PERSISTENCE
    # ============================================
    
    # List user's chat sessions (from database)
    path('sessions/user/', ListUserChatSessionsView.as_view(), name='list-user-sessions'),
    
    # Load a specific session with messages
    path('sessions/<str:session_id>/messages/', LoadChatSessionView.as_view(), name='load-session'),
    
    # Delete a session
    path('sessions/<str:session_id>/', DeleteChatSessionView.as_view(), name='delete-session'),
    
    # Update session title
    path('sessions/<str:session_id>/title/', UpdateSessionTitleView.as_view(), name='update-session-title'),
    
    # ============================================
    # DRAFT POSTS
    # ============================================
    
    # Upload media for drafts
    path('drafts/upload/', UploadMediaView.as_view(), name='upload-media'),
    
    # Save or update draft
    path('drafts/', SaveDraftView.as_view(), name='save-draft'),
    
    # List all drafts/posts
    path('drafts/list/', ListDraftsView.as_view(), name='list-drafts'),
    
    # Publish a draft
    path('drafts/<uuid:draft_id>/publish/', PublishDraftView.as_view(), name='publish-draft'),
    
    # Delete a draft
    path('drafts/<uuid:draft_id>/', DeleteDraftView.as_view(), name='delete-draft'),
    
    # ============================================
    # INFO & HEALTH
    # ============================================
    
    # Health check
    path('health/', health_check, name='health-check'),
    
    # Bot capabilities and info
    path('bot/info/', bot_info, name='bot-info'),
    
    # # LinkedIn algorithm info
    # path('algorithm/', algorithm_info, name='algorithm-info'),
    path('diagnostic/', diagnostic_info, name='diagnostic'),
    path('test-async/', test_async_operation, name='test-async'),
]

"""
API USAGE EXAMPLES - v5.0
==========================

1. GENERATE STRUCTURED POST (NEW - RECOMMENDED):
   POST /api/new_post/generate/
   {
       "topic": "AI in healthcare",
       "context": "Recent breakthrough in medical diagnosis",
       "target_audience": "healthcare professionals",
       "tone_preference": "inspirational",
       "include_personal_story": true
   }
   
   Response:
   {
       "success": true,
       "data": {
           "hook": "First 2-3 compelling lines...",
           "main_content": "Core message paragraphs...",
           "cta": "What are your thoughts on this?",
           "hashtags": ["#HealthTech", "#AI", "#Healthcare"],
           "formatting_notes": "Optimized for mobile with line breaks",
           "engagement_score": "High",
           "algorithm_compliance": "Fully Compliant",
           "final_post": "Complete post text...",
           "improvement_suggestions": ["Add more statistics"],
           "word_count": 247,
           "character_count": 1289,
           "topic": "AI in healthcare"
       }
   }

2. QUICK GENERATE (SIMPLE RESPONSE):
   POST /api/new_post/generate/quick/
   {
       "topic": "Remote work benefits",
       "context": "For software engineers",
       "target_audience": "tech professionals",
       "tone_preference": "conversational"
   }
   
   Response:
   {
       "success": true,
       "data": {
           "final_post": "Complete LinkedIn post...",
           "hashtags": ["#RemoteWork", "#TechLife"],
           "word_count": 187,
           "character_count": 945,
           "topic": "Remote work benefits"
       }
   }

3. CHAT WITH BOT (Interactive):
   POST /api/new_post/chat/
   {
       "message": "Create a post about AI in healthcare",
       "session_id": "user123"
   }
   
   Response:
   {
       "success": true,
       "session_id": "user123",
       "message": "Create a post about AI in healthcare",
       "response": "Here's your LinkedIn post...",
       "history_length": 2
   }

4. ENHANCED CHAT (With Parameters):
   POST /api/new_post/chat/enhanced/
   {
       "message": "Create a post about remote work",
       "session_id": "user123",
       "target_audience": "software engineers",
       "tone_preference": "casual"
   }
   
   Response: Same as regular chat

5. CONTINUE CONVERSATION:
   POST /api/new_post/chat/
   {
       "message": "Make it more professional and add statistics",
       "session_id": "user123"
   }

6. GET CONVERSATION HISTORY:
   GET /api/new_post/chat/history/?session_id=user123
   
   Response:
   {
       "session_id": "user123",
       "history": [
           {"role": "user", "content": "Create a post..."},
           {"role": "assistant", "content": "Here's your post..."},
           ...
       ],
       "message_count": 6
   }

7. RESET CONVERSATION:
   POST /api/new_post/chat/reset/?session_id=user123
   
   Response:
   {
       "success": true,
       "message": "Conversation reset successfully",
       "session_id": "user123"
   }

8. VIEW ACTIVE SESSIONS:
   GET /api/new_post/sessions/
   
   Response:
   {
       "active_sessions": 5,
       "session_ids": ["user123", "user456", ...]
   }

9. CLEAR ALL SESSIONS (Admin):
   DELETE /api/new_post/sessions/clear/
   
   Response:
   {
       "success": true,
       "message": "Cleared 5 sessions"
   }

10. HEALTH CHECK:
    GET /api/new_post/health/
    
    Response:
    {
        "status": "healthy",
        "service": "LinkedIn Post Chatbot",
        "version": "5.0",
        "active_sessions": 5,
        "features": [...]
    }

11. BOT INFO:
    GET /api/new_post/bot/info/
    
    Returns bot capabilities, new features, and response structure

12. ALGORITHM INFO:
    GET /api/new_post/algorithm/
    
    Returns LinkedIn algorithm details and best practices

===========================================
KEY IMPROVEMENTS IN v5.0
===========================================

1. STRUCTURED RESPONSES:
   - Separate hook, main content, and CTA
   - Engagement score calculation
   - Algorithm compliance checking
   - Improvement suggestions

2. ENHANCED PARAMETERS:
   - target_audience: Specify your audience
   - tone_preference: Set desired tone
   - include_personal_story: Add personal touch
   - context: Provide more background

3. TWO GENERATION MODES:
   - /generate/ - Full structured response
   - /generate/quick/ - Simple response (backward compatible)

4. ENHANCED CHAT:
   - /chat/ - Regular chat
   - /chat/enhanced/ - Chat with parameters

===========================================
MIGRATION FROM v4.0
===========================================

v4.0 API calls will continue to work:
- POST /api/new_post/generate/ (now returns structured response)
- GET /api/new_post/chat/

To use new features, add parameters:
{
    "topic": "Your topic",
    "target_audience": "Your audience",
    "tone_preference": "Your tone",
    "include_personal_story": true
}

For simple response (v4.0 style), use:
POST /api/new_post/generate/quick/
"""




















































# from django.urls import path
# from .views import (
#     GenerateLinkedInPostView,
#     QuickGeneratePostView,
#     AsyncGeneratePostView,
#     PostGenerationStatusView,
#     health_check,
#     algorithm_info,
# )

# app_name = 'new_post'

# urlpatterns = [
#     # Main post generation endpoint
#     path('generate/',GenerateLinkedInPostView.as_view(),name='generate-post'),
    
#     # Quick post generation with presets
#     path('quick-generate/',QuickGeneratePostView.as_view(),name='quick-generate'),
    
#     # Async post generation (requires Celery)
#     path('async-generate/',AsyncGeneratePostView.as_view(),name='async-generate'),
    
#     # Check status of async generation
#     path('status/<str:task_id>/',PostGenerationStatusView.as_view(),name='generation-status'),
    
#     # Utility endpoints
#     path('health/',health_check,name='health-check'),
    
#     path('algorithm-info/',algorithm_info,name='algorithm-info'),
# ]