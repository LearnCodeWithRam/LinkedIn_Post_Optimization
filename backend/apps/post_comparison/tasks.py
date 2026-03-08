import asyncio
import json
import re
from pydantic import BaseModel, Field
from typing import Optional
from semantic_kernel.agents import Agent, ChatCompletionAgent, ConcurrentOrchestration
from semantic_kernel.agents.runtime import InProcessRuntime
#from semantic_kernel.connectors.ai.ollama import OllamaChatCompletion, OllamaChatPromptExecutionSettings
from semantic_kernel.functions.kernel_arguments import KernelArguments
from .cache_service import analysis_cache_service
from semantic_kernel.connectors.ai.bedrock.bedrock_prompt_execution_settings import BedrockChatPromptExecutionSettings
from semantic_kernel.connectors.ai.bedrock.services.bedrock_chat_completion import BedrockChatCompletion

class PostStructureComparison(BaseModel):
    """Comparison of structure between user post and viral post."""
    user_word_count: int
    viral_word_count: int
    word_count_difference: int
    user_hook_quality: str
    viral_hook_quality: str
    user_has_cta: bool
    viral_has_cta: bool
    structure_recommendation: str
    optimal_length: str


class ToneComparison(BaseModel):
    """Comparison of tone between posts."""
    user_tone: str
    viral_tone: str
    friendly_score: int = Field(ge=0, le=100)
    persuasive_score: int = Field(ge=0, le=100)
    formal_score: int = Field(ge=0, le=100)
    tone_recommendation: str
    needs_simplification: bool


class HashtagComparison(BaseModel):
    """Comparison of hashtag usage."""
    user_hashtags: list[str]
    viral_hashtags: list[str]
    user_hashtag_count: int
    viral_hashtag_count: int
    user_has_trending: bool
    viral_has_trending: bool
    missing_trending_tags: list[str]
    hashtag_recommendation: str


class EngagementComparison(BaseModel):
    """Engagement potential comparison."""
    user_engagement_rate: str
    viral_engagement_rate: str
    engagement_difference: str
    user_content_type: str
    viral_content_type: str
    media_recommendation: str
    posting_time_recommendation: str


class ViralityInsight(BaseModel):
    """Individual insight for improving virality."""
    type: str = Field(description="critical/important/suggestion")
    title: str
    description: str
    icon: str = Field(description="Icon identifier")


class KeywordAnalysis(BaseModel):
    """Keyword analysis for both posts."""
    user_primary_keywords: list[str]
    viral_primary_keywords: list[str]
    user_secondary_keywords: list[str]
    viral_secondary_keywords: list[str]
    missing_keywords: list[str]


class ComparisonDimension(BaseModel):
    """Individual comparison dimension for table display."""
    dimension: str
    viral: str
    user: str
    difference: str
    status: str = Field(description="success/warning/error")


class LinkedInPostComparison(BaseModel):
    """Complete comparison analysis between user post and viral post."""
    virality_score: int = Field(ge=0, le=100, description="Overall virality score")
    virality_status: str = Field(description="Excellent/Good/Fair/Poor")
    structure: PostStructureComparison
    tone: ToneComparison
    hashtags: HashtagComparison
    engagement: EngagementComparison
    keywords: KeywordAnalysis
    
    comparison_table: list[ComparisonDimension]
    insights: list[ViralityInsight]
    
    strengths: list[str]
    improvements: list[str]
    priority_actions: list[str]


def get_comparison_agents() -> list[Agent]:
    """Create specialized agents for post comparison."""
    from semantic_kernel import Kernel
    
    service_id = "bedrock-llama"
    model_id = "meta.llama3-8b-instruct-v1:0"

    # Create Kernel and register service
    kernel = Kernel()
    service = BedrockChatCompletion(
        service_id=service_id,
        model_id=model_id
    )
    kernel.add_service(service)
    
    # Create execution settings
    execution_settings = BedrockChatPromptExecutionSettings(
        service_id=service_id,
        temperature=0.0,
        top_p=1.0,
        max_tokens=2000
    )
    
    # Create KernelArguments with the execution settings
    agent_arguments = KernelArguments(settings=execution_settings)
    
    structure_comparison_agent = ChatCompletionAgent(
        name="StructureComparisonAgent",
        instructions="""You are an expert in comparing LinkedIn post structures.
        Compare both posts for:
        - Word count (optimal: 120-150 words)
        - Hook effectiveness
        - Paragraph structure
        - Call-to-action presence
        - White space usage
        
        Determine which post has better structure and why.
        
        You MUST respond in valid JSON format only:
        {
            "user_word_count": <number>,
            "viral_word_count": <number>,
            "word_count_difference": <number>,
            "user_hook_quality": "<Excellent/Good/Poor>",
            "viral_hook_quality": "<Excellent/Good/Poor>",
            "user_has_cta": <boolean>,
            "viral_has_cta": <boolean>,
            "structure_recommendation": "<specific recommendation>",
            "optimal_length": "<recommendation about length>"
        }""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    tone_comparison_agent = ChatCompletionAgent(
        name="ToneComparisonAgent",
        instructions="""You are an expert in analyzing tone and writing style.

        Compare both posts for:
        - Conversational vs Formal tone
        - Friendly score (0-100)
        - Persuasive score (0-100)
        - Formal score (0-100)
        - Readability level
        
        Viral posts typically use conversational, friendly tones.
        
        You MUST respond in valid JSON format only:
        {
            "user_tone": "<Conversational/Formal/Professional>",
            "viral_tone": "<Conversational/Formal/Professional>",
            "friendly_score": <0-100>,
            "persuasive_score": <0-100>,
            "formal_score": <0-100>,
            "tone_recommendation": "<specific recommendation>",
            "needs_simplification": <boolean>
        }""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    hashtag_comparison_agent = ChatCompletionAgent(
        name="HashtagComparisonAgent",
        instructions="""You are an expert in LinkedIn hashtag strategy.

        Compare hashtag usage between posts:
        - Number of hashtags (optimal: 3-5)
        - Trending vs generic hashtags
        - Relevance to content
        - Missing trending opportunities
        
        Identify specific trending hashtags the user should add.
        
        You MUST respond in valid JSON format only:
        {
            "user_hashtags": ["<hashtag1>", "<hashtag2>", ...],
            "viral_hashtags": ["<hashtag1>", "<hashtag2>", ...],
            "user_hashtag_count": <number>,
            "viral_hashtag_count": <number>,
            "user_has_trending": <boolean>,
            "viral_has_trending": <boolean>,
            "missing_trending_tags": ["<tag1>", "<tag2>", ...],
            "hashtag_recommendation": "<specific recommendation>"
        }""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    engagement_comparison_agent = ChatCompletionAgent(
        name="EngagementComparisonAgent",
        instructions="""You are an expert in LinkedIn engagement prediction.

        Compare engagement potential:
        - Expected engagement rate (%)
        - Content type (Text/Image/Video/Carousel)
        - Media usage
        - Posting time optimization
        
        Reference: Video: 4.9%, Image: 4.8%, Carousel: 4.2%, Text: 3.6%, Link: 2.7%
        Best posting times: Tuesday-Wednesday, 8-10 AM
        
        You MUST respond in valid JSON format only:
        {
            "user_engagement_rate": "<percentage>",
            "viral_engagement_rate": "<percentage>",
            "engagement_difference": "<difference description>",
            "user_content_type": "<Text/Image/Video/Carousel/Link>",
            "viral_content_type": "<Text/Image/Video/Carousel/Link>",
            "media_recommendation": "<specific recommendation>",
            "posting_time_recommendation": "<specific recommendation>"
        }""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    keyword_analysis_agent = ChatCompletionAgent(
        name="KeywordAnalysisAgent",
        instructions="""You are an expert in content keyword analysis.

        Analyze keywords in both posts:
        - Primary keywords (main topics)
        - Secondary keywords (supporting topics)
        - Industry-specific terms
        - Missing high-impact keywords
        
        Identify what keywords the user should add based on viral post.
        
        You MUST respond in valid JSON format only:
        {
            "user_primary_keywords": ["<keyword1>", "<keyword2>", ...],
            "viral_primary_keywords": ["<keyword1>", "<keyword2>", ...],
            "user_secondary_keywords": ["<keyword1>", "<keyword2>", ...],
            "viral_secondary_keywords": ["<keyword1>", "<keyword2>", ...],
            "missing_keywords": ["<keyword1>", "<keyword2>", ...]
        }""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    return [
        structure_comparison_agent,
        tone_comparison_agent,
        hashtag_comparison_agent,
        engagement_comparison_agent,
        keyword_analysis_agent
    ]


def parse_json_response(content: str) -> dict:
    """Parse JSON from agent response, handling markdown and malformed JSON."""
    try:
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
        else:
            data = json.loads(content)
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse JSON: {e}")
        return {"error": "Failed to parse response", "raw_content": content}


async def compare_linkedin_posts(user_post: str, viral_post: str) -> LinkedInPostComparison:
    """
    Compare user's LinkedIn post with a viral post using multi-agent analysis.
    
    Args:
        user_post: The user's LinkedIn post content
        viral_post: The viral post to compare against
        
    Returns:
        LinkedInPostComparison: Complete comparison analysis
    """
    print("🚀 Starting LinkedIn Post Comparison...")
    print("=" * 60)
    
    agents = get_comparison_agents()
    print(f"✅ Created {len(agents)} specialized agents")
    
    concurrent_orchestration = ConcurrentOrchestration(members=agents)
    print("✅ Configured concurrent orchestration")
    
    runtime = InProcessRuntime()
    runtime.start()
    print("✅ Runtime started")
    
    try:
        print("\n⚙️  Analyzing posts...")
        orchestration_result = await concurrent_orchestration.invoke(
            task=f"""Compare these two LinkedIn posts and provide detailed analysis:

USER'S POST:
{user_post}

VIRAL POST (for comparison):
{viral_post}

Analyze and compare:
1. Structure and length
2. Tone and writing style
3. Hashtag usage and trends
4. Engagement potential
5. Keywords and topics

Provide specific, actionable recommendations for improving the user's post.
Remember to respond ONLY with valid JSON - no additional text.""",
            runtime=runtime,
        )
        
        print("⏳ Waiting for agent responses...")
        value = await orchestration_result.get(timeout=120)
        print("✅ Analysis complete!")
        
        # Parse responses
        parsed_results = {}
        for item in value:
            parsed_results[item.name] = parse_json_response(item.content)
        
        # Extract data
        structure_data = parsed_results.get("StructureComparisonAgent", {})
        tone_data = parsed_results.get("ToneComparisonAgent", {})
        hashtag_data = parsed_results.get("HashtagComparisonAgent", {})
        engagement_data = parsed_results.get("EngagementComparisonAgent", {})
        keyword_data = parsed_results.get("KeywordAnalysisAgent", {})
        
        # Create Pydantic models
        structure = PostStructureComparison(
            user_word_count=structure_data.get("user_word_count", 0),
            viral_word_count=structure_data.get("viral_word_count", 0),
            word_count_difference=structure_data.get("word_count_difference", 0),
            user_hook_quality=structure_data.get("user_hook_quality", "Unknown"),
            viral_hook_quality=structure_data.get("viral_hook_quality", "Unknown"),
            user_has_cta=structure_data.get("user_has_cta", False),
            viral_has_cta=structure_data.get("viral_has_cta", False),
            structure_recommendation=structure_data.get("structure_recommendation", ""),
            optimal_length=structure_data.get("optimal_length", "")
        )
        
        tone = ToneComparison(
            user_tone=tone_data.get("user_tone", "Unknown"),
            viral_tone=tone_data.get("viral_tone", "Unknown"),
            friendly_score=min(100, max(0, tone_data.get("friendly_score", 50))),
            persuasive_score=min(100, max(0, tone_data.get("persuasive_score", 50))),
            formal_score=min(100, max(0, tone_data.get("formal_score", 50))),
            tone_recommendation=tone_data.get("tone_recommendation", ""),
            needs_simplification=tone_data.get("needs_simplification", False)
        )
        
        hashtags = HashtagComparison(
            user_hashtags=hashtag_data.get("user_hashtags", []),
            viral_hashtags=hashtag_data.get("viral_hashtags", []),
            user_hashtag_count=hashtag_data.get("user_hashtag_count", 0),
            viral_hashtag_count=hashtag_data.get("viral_hashtag_count", 0),
            user_has_trending=hashtag_data.get("user_has_trending", False),
            viral_has_trending=hashtag_data.get("viral_has_trending", False),
            missing_trending_tags=hashtag_data.get("missing_trending_tags", []),
            hashtag_recommendation=hashtag_data.get("hashtag_recommendation", "")
        )
        
        engagement = EngagementComparison(
            user_engagement_rate=str(engagement_data.get("user_engagement_rate", "Unknown")),
            viral_engagement_rate=str(engagement_data.get("viral_engagement_rate", "Unknown")),
            engagement_difference=engagement_data.get("engagement_difference", ""),
            user_content_type=engagement_data.get("user_content_type", "Text"),
            viral_content_type=engagement_data.get("viral_content_type", "Text"),
            media_recommendation=engagement_data.get("media_recommendation", ""),
            posting_time_recommendation=engagement_data.get("posting_time_recommendation", "")
        )
        
        keywords = KeywordAnalysis(
            user_primary_keywords=keyword_data.get("user_primary_keywords", []),
            viral_primary_keywords=keyword_data.get("viral_primary_keywords", []),
            user_secondary_keywords=keyword_data.get("user_secondary_keywords", []),
            viral_secondary_keywords=keyword_data.get("viral_secondary_keywords", []),
            missing_keywords=keyword_data.get("missing_keywords", [])
        )
        
        # Build comparison table
        comparison_table = [
            ComparisonDimension(
                dimension="Engagement Rate",
                viral=engagement.viral_engagement_rate,
                user=engagement.user_engagement_rate,
                difference=engagement.engagement_difference,
                status="warning" if "low" in engagement.engagement_difference.lower() else "success"
            ),
            ComparisonDimension(
                dimension="Word Count",
                viral=str(structure.viral_word_count),
                user=str(structure.user_word_count),
                difference=f"+{structure.word_count_difference}" if structure.word_count_difference > 0 else str(structure.word_count_difference),
                status="warning" if abs(structure.word_count_difference) > 50 else "success"
            ),
            ComparisonDimension(
                dimension="Tone",
                viral=tone.viral_tone,
                user=tone.user_tone,
                difference="Needs simplification" if tone.needs_simplification else "Good match",
                status="error" if tone.needs_simplification else "success"
            ),
            ComparisonDimension(
                dimension="Hashtags",
                viral=f"{hashtags.viral_hashtag_count} {'trending' if hashtags.viral_has_trending else 'generic'}",
                user=f"{hashtags.user_hashtag_count} {'trending' if hashtags.user_has_trending else 'generic'}",
                difference="Missing trending tags" if len(hashtags.missing_trending_tags) > 0 else "Good coverage",
                status="error" if len(hashtags.missing_trending_tags) > 0 else "success"
            ),
            ComparisonDimension(
                dimension="Media",
                viral=engagement.viral_content_type,
                user=engagement.user_content_type,
                difference=engagement.media_recommendation,
                status="warning" if engagement.user_content_type != engagement.viral_content_type else "success"
            ),
            ComparisonDimension(
                dimension="Posting Time",
                viral="Optimal time",
                user="Current time",
                difference=engagement.posting_time_recommendation,
                status="warning"
            )
        ]
        
        # Generate insights
        insights = []
        
        if abs(structure.word_count_difference) > 50:
            insights.append(ViralityInsight(
                type="critical",
                title="Optimize Post Length",
                description=structure.optimal_length,
                icon="AlertCircle"
            ))
        
        if tone.needs_simplification:
            insights.append(ViralityInsight(
                type="critical",
                title="Change Your Tone",
                description=tone.tone_recommendation,
                icon="MessageSquare"
            ))
        
        if len(hashtags.missing_trending_tags) > 0:
            insights.append(ViralityInsight(
                type="important",
                title="Add Trending Hashtags",
                description=f"Include trending hashtags: {', '.join(hashtags.missing_trending_tags[:3])}",
                icon="Hash"
            ))
        
        if engagement.posting_time_recommendation:
            insights.append(ViralityInsight(
                type="suggestion",
                title="Optimize Posting Time",
                description=engagement.posting_time_recommendation,
                icon="TrendingUp"
            ))
        
        # Calculate virality score
        score = 0
        if abs(structure.word_count_difference) < 50:
            score += 25
        if not tone.needs_simplification:
            score += 25
        if hashtags.user_has_trending:
            score += 25
        if engagement.user_content_type == engagement.viral_content_type:
            score += 25
        
        virality_status = "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair" if score >= 40 else "Poor"
        
        # Strengths and improvements
        strengths = []
        if structure.user_has_cta:
            strengths.append("Strong call-to-action")
        if hashtags.user_hashtag_count >= 3:
            strengths.append("Good hashtag usage")
        if tone.friendly_score > 60:
            strengths.append("Friendly and engaging tone")
        
        improvements = []
        if abs(structure.word_count_difference) > 50:
            improvements.append(structure.optimal_length)
        if tone.needs_simplification:
            improvements.append(tone.tone_recommendation)
        if len(hashtags.missing_trending_tags) > 0:
            improvements.append(f"Add trending hashtags: {', '.join(hashtags.missing_trending_tags[:3])}")
        
        priority_actions = [
            structure.structure_recommendation,
            tone.tone_recommendation,
            hashtags.hashtag_recommendation,
            engagement.media_recommendation,
            engagement.posting_time_recommendation
        ]
        priority_actions = [a for a in priority_actions if a][:5]
        
        result = LinkedInPostComparison(
            virality_score=score,
            virality_status=virality_status,
            structure=structure,
            tone=tone,
            hashtags=hashtags,
            engagement=engagement,
            keywords=keywords,
            comparison_table=comparison_table,
            insights=insights,
            strengths=strengths,
            improvements=improvements,
            priority_actions=priority_actions
        )
        
        return result
        
    finally:
        print("\n🛑 Stopping runtime...")
        # Give a moment for all async operations to complete
        await asyncio.sleep(0.5)
        await runtime.stop_when_idle()
        print("✅ Runtime stopped cleanly")


# Synchronous wrapper for Django
def compare_posts_sync(user_post: str, viral_post: str) -> dict:
    """
    Synchronous wrapper for Django views.
    
    Args:
        user_post: User's LinkedIn post
        viral_post: Viral post for comparison
        
    Returns:
        dict: Comparison results as dictionary
    """
    # Check cache first
    cache_key = analysis_cache_service.get_comparison_cache_key(user_post, viral_post)
    cached_result = analysis_cache_service.get_cached_analysis(cache_key)
    
    if cached_result:
        return cached_result

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(compare_linkedin_posts(user_post, viral_post))
        result_dict = result.model_dump()
        
        # Save to cache
        analysis_cache_service.set_cached_analysis(
            post_id=cache_key,
            post_content=f"User: {user_post[:50]}... vs Viral: {viral_post[:50]}...",
            analysis_data=result_dict
        )
        
        return result_dict
    finally:
        loop.close()