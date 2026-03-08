import asyncio
import sys
from typing import Optional
from pydantic import BaseModel, Field

from semantic_kernel.agents import ChatCompletionAgent
# from semantic_kernel.connectors.ai.ollama import OllamaChatCompletion
from semantic_kernel.contents import ChatMessageContent, ChatHistory
from semantic_kernel.connectors.ai.bedrock.bedrock_prompt_execution_settings import BedrockChatPromptExecutionSettings
from semantic_kernel.connectors.ai.bedrock.services.bedrock_chat_completion import BedrockChatCompletion

"""
LinkedIn Post Generator - Enhanced Chatbot Version
WITH HTTP CLIENT SAFEGUARDS

CRITICAL FIX: Ensures HTTP clients from httpx/httpcore are properly cleaned up
before event loop closure.
"""


class LinkedInPostDraft(BaseModel):
    """Complete LinkedIn post draft with metadata."""
    hook: str = Field(default="", description="Compelling first 2 lines")
    main_content: str = Field(default="", description="Core message and value")
    cta: str = Field(default="", description="Call-to-action question")
    hashtags: list[str] = Field(default_factory=list, description="3-5 relevant hashtags")
    formatting_notes: str = Field(default="Optimized for mobile", description="Structure notes")
    engagement_score: str = Field(default="Medium", description="Predicted engagement")
    algorithm_compliance: str = Field(default="Compliant", description="Algorithm compliance")
    final_post: str = Field(default="", description="Complete formatted post")
    improvement_suggestions: list[str] = Field(default_factory=list, description="Improvements")


class LinkedInPostChatbot:
    """
    Enhanced chatbot for LinkedIn post generation.
    
    CRITICAL: This class does NOT create event loops. All async operations
    happen within event loops managed by views.py.
    """
    
    def __init__(self):
        """Initialize the chatbot - SYNCHRONOUS."""
        self.chat_history = ChatHistory()
        self.agent = None
        self.service = None
        self._initialize_agent()

    def _initialize_agent(self):
        """Initialize the agent - SYNCHRONOUS. Creates fresh service each time."""
        # Configuration
        # service_id = "ollama-llama"
        # ollama_host = "http://115.241.186.203/"
        # model_id = "llama3.1:8b" 
        #//gpt-oss:20b
        service_id = "bedrock-llama"
        model_id = "meta.llama3-8b-instruct-v1:0"

        # ALWAYS create a NEW service to avoid reusing closed HTTP clients
        # This prevents "Event loop is closed" errors
        # self.service = OllamaChatCompletion(
        #     service_id=service_id,
        #     host=ollama_host,
        #     ai_model_id=model_id
        # )
        self.service = BedrockChatCompletion(
            model_id=model_id
        )
        
        # Create agent with the new service
        self.agent = ChatCompletionAgent(
            name="LinkedInPostBot",
            instructions="""You are an expert LinkedIn post writer and content strategist.

            When a user provides a topic, create a complete, engaging LinkedIn post that includes:

            1. HOOK (2-3 lines): Start with an attention-grabbing opening that makes people want to read more
            2. MAIN CONTENT (3-4 paragraphs): 
            - Share valuable insights, tips, or a story
            - Keep paragraphs short (2-3 sentences each)
            - Use conversational, professional tone
            - Add line breaks for mobile readability
            3. CALL-TO-ACTION: End with an engaging question to spark discussion
            4. HASHTAGS: Add 3-5 relevant hashtags at the end

            FORMATTING RULES:
            - Use double line breaks between paragraphs for mobile readability
            - Keep total length between 150-300 words
            - Make it authentic and relatable
            - Avoid corporate jargon
            - Feel free to use emojis when appropriate to make the post more engaging

            PAY ATTENTION TO:
            - Target audience if specified
            - Tone preference (inspirational, analytical, conversational, etc.)
            - Personal story requests
            - Context provided
            - Emoji usage when requested

            If the user asks for revisions, help them improve the post.
            If they want a different topic, generate a new post.
            Be conversational and helpful!""",
            service=self.service
        )
        
        print("✅ LinkedIn Post Bot initialized and ready!")
    
    async def chat(self, user_message: str) -> str:
        """
        Send a message to the bot and get a response.
        
        IMPORTANT: Must be called from within a properly managed event loop.
        
        Args:
            user_message: User's input message
            
        Returns:
            Bot's response as a string
        """
        response_text = ""
        
        try:
            # Reinitialize agent to get fresh HTTP client (prevents "Event loop is closed")
            self._initialize_agent()
            
            # Add user message to history
            self.chat_history.add_user_message(user_message)
            
            # Get response from agent
            try:
                async for message in self.agent.invoke(self.chat_history):
                    if message and hasattr(message, 'content') and message.content:
                        response_text += str(message.content)
                        
            except asyncio.CancelledError:
                print("Chat operation was cancelled")
                if self.chat_history.messages:
                    self.chat_history.messages.pop()
                raise
            
            # Validate and return response
            if response_text and len(response_text) > 0:
                bot_response = str(response_text)
                self.chat_history.add_assistant_message(bot_response)
                return bot_response
            else:
                return "Sorry, I couldn't generate a response. Please try again."
                
        except asyncio.CancelledError:
            raise
            
        except Exception as e:
            error_msg = f"Error in chat method: {str(e)}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            
            # Don't add error to history, just return it
            return error_msg
    
    def reset_conversation(self):
        """Clear the chat history - SYNCHRONOUS."""
        self.chat_history = ChatHistory()
        print("✅ Conversation reset!")
        
    def get_history(self) -> list[dict]:
        """Get the conversation history - SYNCHRONOUS."""
        return [
            {"role": msg.role.value, "content": str(msg.content)}
            for msg in self.chat_history.messages
        ]
    
    async def cleanup(self):
        """
        Cleanup HTTP client connections.
        
        IMPORTANT: Call this before closing the event loop to prevent
        "Event loop is closed" errors.
        """
        try:
            # If the service has an HTTP client, close it
            if self.service and hasattr(self.service, 'client'):
                if hasattr(self.service.client, 'aclose'):
                    await self.service.client.aclose()
                elif hasattr(self.service.client, 'close'):
                    await self.service.client.close()
        except Exception as e:
            # Suppress cleanup errors
            print(f"Note: HTTP client cleanup: {e}")
            pass


def parse_post_content(content: str) -> LinkedInPostDraft:
    """
    Parse generated post content into structured format.
    
    Args:
        content: Raw post content from bot
        
    Returns:
        Structured LinkedInPostDraft
    """
    import re
    
    lines = content.strip().split('\n')
    
    hook_lines = []
    main_lines = []
    cta = ""
    hashtags = []
    
    in_hook = True
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Extract hashtags
        if line.startswith('#') or '#' in line:
            found_tags = re.findall(r'#\w+', line)
            hashtags.extend(found_tags)
            continue
        
        # Build hook (first 2-3 lines)
        if in_hook and len(hook_lines) < 3:
            hook_lines.append(line)
        else:
            in_hook = False
            main_lines.append(line)
    
    # Last line might be CTA
    if main_lines and '?' in main_lines[-1]:
        cta = main_lines.pop()
    
    hook = '\n'.join(hook_lines)
    main_content = '\n\n'.join(main_lines)
    
    # Calculate metrics
    word_count = len(content.split())
    
    # Determine engagement score
    if word_count > 250:
        engagement_score = "High"
    elif word_count > 150:
        engagement_score = "Medium"
    else:
        engagement_score = "Low"
    
    # Check algorithm compliance
    has_hook = len(hook_lines) >= 2
    has_hashtags = len(hashtags) >= 3
    has_cta = bool(cta)
    
    if has_hook and has_hashtags and has_cta:
        algorithm_compliance = "Fully Compliant"
    elif (has_hook and has_hashtags) or (has_hook and has_cta):
        algorithm_compliance = "Mostly Compliant"
    else:
        algorithm_compliance = "Needs Improvement"
    
    # Generate improvement suggestions
    suggestions = []
    if not has_hook:
        suggestions.append("Add a stronger hook in the first 2-3 lines")
    if len(hashtags) < 3:
        suggestions.append("Add more relevant hashtags (3-5 recommended)")
    if not has_cta:
        suggestions.append("End with an engaging question to encourage comments")
    if word_count < 150:
        suggestions.append("Expand content to 150-300 words for better engagement")
    if word_count > 300:
        suggestions.append("Consider shortening to 150-300 words for optimal readability")
    
    return LinkedInPostDraft(
        hook=hook,
        main_content=main_content,
        cta=cta,
        hashtags=hashtags,
        formatting_notes="Optimized for mobile with line breaks",
        engagement_score=engagement_score,
        algorithm_compliance=algorithm_compliance,
        final_post=content.strip(),
        improvement_suggestions=suggestions
    )


async def quick_generate(
    topic: str,
    context: Optional[str] = None,
    target_audience: Optional[str] = None,
    tone_preference: Optional[str] = None,
    include_personal_story: bool = False
) -> LinkedInPostDraft:
    """
    Quick function to generate a structured post.
    
    IMPORTANT: Must be called from within a properly managed event loop.
    """
    bot = LinkedInPostChatbot()
    
    # Build prompt
    prompt_parts = [f"Create a LinkedIn post about: {topic}"]
    
    if context:
        prompt_parts.append(f"Context: {context}")
    
    if target_audience:
        prompt_parts.append(f"Target audience: {target_audience}")
    
    if tone_preference:
        prompt_parts.append(f"Tone: {tone_preference}")
    
    if include_personal_story:
        prompt_parts.append("Include a personal story or experience to make it relatable")
    
    prompt = "\n".join(prompt_parts)
    
    print(f"🔍 Generating post for: {topic}")
    
    # Get response
    response = await bot.chat(prompt)
    
    # Parse into structured format
    post_draft = parse_post_content(response)
    
    return post_draft


async def generate_post_task(
    topic: str,
    context: Optional[str] = None,
    target_audience: Optional[str] = None,
    tone_preference: Optional[str] = None,
    include_personal_story: bool = False
) -> LinkedInPostDraft:
    """
    Main task function for generating LinkedIn posts.
    
    IMPORTANT: Must be called from within a properly managed event loop.
    """
    print("🚀 LinkedIn Post Generator")
    print("=" * 60)
    print(f"🔍 Topic: {topic}")
    if context:
        print(f"📋 Context: {context}")
    if target_audience:
        print(f"🎯 Audience: {target_audience}")
    if tone_preference:
        print(f"🎨 Tone: {tone_preference}")
    if include_personal_story:
        print(f"📖 Personal Story: Yes")
    print("=" * 60 + "\n")
    
    return await quick_generate(
        topic=topic,
        context=context,
        target_audience=target_audience,
        tone_preference=tone_preference,
        include_personal_story=include_personal_story
    )


async def optimize_post_task(
    original_post: str,
    analysis_data: dict
) -> dict:
    """
    Optimize a LinkedIn post based on AI analysis recommendations.
    
    Makes targeted improvements to the original post while preserving
    the core message and author's voice.
    
    Args:
        original_post: Original post content
        analysis_data: Complete analysis data with recommendations
        
    Returns:
        dict with optimized_post and improvements_made
    """
    print("🔧 LinkedIn Post Optimizer")
    print("=" * 60)
    print(f"📝 Original Post Length: {len(original_post)} chars")
    print("=" * 60 + "\n")
    
    # Extract recommendations from analysis
    priority_actions = analysis_data.get('priority_actions', [])
    structure_recs = analysis_data.get('structure', {}).get('recommendations', [])
    hashtag_recs = analysis_data.get('hashtags', {}).get('recommendations', [])
    keyword_recs = analysis_data.get('keywords', {}).get('recommendations', []) if analysis_data.get('keywords') else []
    tone_rec = analysis_data.get('keywords', {}).get('tone_analysis', {}).get('tone_recommendation', '') if analysis_data.get('keywords') else ''
    
    # Build optimization prompt
    prompt = f"""You are optimizing a LinkedIn post based on AI analysis feedback.

ORIGINAL POST:
{original_post}

ANALYSIS RECOMMENDATIONS:
Priority Actions:
{chr(10).join(f'- {action}' for action in priority_actions)}

Structure Recommendations:
{chr(10).join(f'- {rec}' for rec in structure_recs) if structure_recs else '- No structure issues'}

Hashtag Recommendations:
{chr(10).join(f'- {rec}' for rec in hashtag_recs) if hashtag_recs else '- No hashtag issues'}

Keyword Recommendations:
{chr(10).join(f'- {rec}' for rec in keyword_recs) if keyword_recs else '- No keyword issues'}

Tone Recommendation:
{tone_rec if tone_rec else 'No tone issues'}

YOUR TASK:
1. Keep the CORE MESSAGE and VOICE of the original post - DO NOT rewrite it completely
2. Apply ONLY the specific improvements mentioned in the recommendations above
3. Make MINIMAL changes - only fix what's identified as needing improvement
4. Preserve the author's writing style and personality
5. If hashtags are missing or insufficient, add relevant ones at the end
6. If structure needs improvement (hook, CTA), enhance those specific parts
7. If tone needs adjustment, make subtle changes to match the recommendation

OUTPUT FORMAT:
First, provide the optimized post.
Then, on a new line, write "IMPROVEMENTS:" followed by a bulleted list of changes you made.

Example:
[Your optimized post here]

IMPROVEMENTS:
- Added 3 relevant hashtags (#AI #LinkedIn #ContentStrategy)
- Strengthened the hook to grab attention
- Added a call-to-action question at the end
"""
    
    # Create a temporary chatbot for this optimization
    bot = LinkedInPostChatbot()
    
    print("🤖 Generating optimized version...")
    response = await bot.chat(prompt)
    
    # Parse response to extract optimized post and improvements
    if "IMPROVEMENTS:" in response:
        parts = response.split("IMPROVEMENTS:")
        optimized_post = parts[0].strip()
        improvements_text = parts[1].strip()
        
        # Extract bullet points from improvements
        improvements_made = []
        for line in improvements_text.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•'):
                improvements_made.append(line.lstrip('-•').strip())
            elif line and not line.startswith('IMPROVEMENTS'):
                improvements_made.append(line)
    else:
        # Fallback if format not followed
        optimized_post = response.strip()
        improvements_made = ["Applied recommendations from AI analysis"]
    
    print(f"\n✅ Optimization complete!")
    print(f"📊 Optimized Post Length: {len(optimized_post)} chars")
    print(f"📝 Changes Made: {len(improvements_made)}")
    print("=" * 60 + "\n")
    
    return {
        'optimized_post': optimized_post,
        'improvements_made': improvements_made,
        'original_length': len(original_post),
        'optimized_length': len(optimized_post)
    }


async def optimize_post_with_viral_pattern_task(
    user_post_content: str,
    user_post_analysis: dict,
    viral_post_content: str,
    viral_post_analysis: dict
) -> dict:
    """
    Optimize a user's LinkedIn post to match viral post patterns.
    
    Rewrites the user's post to adopt the structure, tone, and style
    of a viral post while preserving the user's core message.
    
    Args:
        user_post_content: User's original post
        user_post_analysis: AI analysis of user's post
        viral_post_content: Viral post to emulate
        viral_post_analysis: AI analysis of viral post
        
    Returns:
        dict with optimized_post, improvements_made, and pattern_changes
    """
    print("🚀 Viral Pattern Post Optimizer")
    print("=" * 60)
    print(f"📝 User Post Length: {len(user_post_content)} chars")
    print(f"⭐ Viral Post Length: {len(viral_post_content)} chars")
    print("=" * 60 + "\n")
    
    # Extract viral post patterns
    viral_structure = viral_post_analysis.get('structure', {})
    viral_hashtags = viral_post_analysis.get('hashtags', {})
    viral_keywords = viral_post_analysis.get('keywords', {})
    viral_tone = viral_keywords.get('tone_analysis', {}) if viral_keywords else {}
    
    # Extract user post analysis
    user_structure = user_post_analysis.get('structure', {})
    user_tone = user_post_analysis.get('keywords', {}).get('tone_analysis', {}) if user_post_analysis.get('keywords') else {}
    
    # Build optimization prompt
    prompt = f"""You are rewriting a LinkedIn post to match the patterns of a viral post.

USER'S ORIGINAL POST:
{user_post_content}

VIRAL POST TO EMULATE:
{viral_post_content}

VIRAL POST PATTERNS TO ADOPT:
Structure:
- Hook Quality: {viral_structure.get('hook_quality', 'N/A')}
- Has Re-hook: {viral_structure.get('rehook_present', False)}
- Has Wrap-up: {viral_structure.get('has_wrap_up', False)}
- Has CTA: {viral_structure.get('has_cta', False)}

Tone (from viral post):
- Friendly Score: {viral_tone.get('friendly_score', 'N/A')}%
- Persuasive Score: {viral_tone.get('persuasive_score', 'N/A')}%
- Formal Score: {viral_tone.get('formal_score', 'N/A')}%

Hashtags:
- Count: {viral_hashtags.get('hashtag_count', 0)}
- Placement: {viral_hashtags.get('placement_quality', 'Natural')}

YOUR TASK:
1. PRESERVE the user's CORE MESSAGE and KEY POINTS - don't change what they're saying
2. REWRITE the post to match the viral post's:
   - Structure (hook, re-hook, wrap-up, CTA)
   - Tone and writing style
   - Length (aim for similar word count)
   - Hashtag strategy
3. Make it feel like the viral post in style, but with the user's content
4. Keep the user's authentic voice while adopting viral patterns
5. If the viral post uses emojis, questions, or specific formatting, incorporate similar elements

OUTPUT FORMAT:
First, provide the rewritten post.
Then, on a new line, write "IMPROVEMENTS:" followed by a bulleted list of pattern changes you made.

Example:
[Your rewritten post here]

IMPROVEMENTS:
- Adopted conversational tone from viral post (friendly score: 80%)
- Restructured with strong hook and clear CTA
- Shortened from 350 to 180 words to match viral post length
- Added 3 trending hashtags matching viral post strategy
- Incorporated question-based engagement like viral post
"""
    
    # Create a temporary chatbot for this optimization
    bot = LinkedInPostChatbot()
    
    print("🤖 Generating viral-pattern optimized version...")
    response = await bot.chat(prompt)
    
    # Parse response to extract optimized post and improvements
    if "IMPROVEMENTS:" in response:
        parts = response.split("IMPROVEMENTS:")
        optimized_post = parts[0].strip()
        improvements_text = parts[1].strip()
        
        # Extract bullet points from improvements
        improvements_made = []
        for line in improvements_text.split('\n'):
            line = line.strip()
            if line.startswith('-') or line.startswith('•'):
                improvements_made.append(line.lstrip('-•').strip())
            elif line and not line.startswith('IMPROVEMENTS'):
                improvements_made.append(line)
    else:
        # Fallback if format not followed
        optimized_post = response.strip()
        improvements_made = ["Rewritten to match viral post patterns"]
    
    # Calculate pattern changes
    pattern_changes = {
        'tone_shift': f"{user_tone.get('friendly_score', 0)}% → {viral_tone.get('friendly_score', 0)}% friendly",
        'length_change': f"{len(user_post_content)} → {len(optimized_post)} chars",
        'structure_adopted': viral_structure.get('structure_score', 'N/A'),
        'hashtags_strategy': f"{viral_hashtags.get('hashtag_count', 0)} hashtags"
    }
    
    print(f"\n✅ Viral pattern optimization complete!")
    print(f"📊 Original: {len(user_post_content)} chars → Optimized: {len(optimized_post)} chars")
    print(f"📝 Pattern Changes: {len(improvements_made)}")
    print("=" * 60 + "\n")
    
    return {
        'optimized_post': optimized_post,
        'improvements_made': improvements_made,
        'pattern_changes': pattern_changes,
        'original_length': len(user_post_content),
        'optimized_length': len(optimized_post)
    }


if __name__ == "__main__":
    print("This module should not be run directly.")
    print("Use the Django API endpoints instead.")