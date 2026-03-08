import asyncio
import json
import re
from pydantic import BaseModel, Field

from semantic_kernel.agents import Agent, ChatCompletionAgent, ConcurrentOrchestration
from semantic_kernel.agents.runtime import InProcessRuntime
# from semantic_kernel.connectors.ai.ollama import OllamaChatCompletion, OllamaChatPromptExecutionSettings
from semantic_kernel.functions.kernel_arguments import KernelArguments

from semantic_kernel.connectors.ai.bedrock.bedrock_prompt_execution_settings import BedrockChatPromptExecutionSettings
from semantic_kernel.connectors.ai.bedrock.services.bedrock_chat_completion import BedrockChatCompletion


"""
LinkedIn Post Optimizer Multi-Agent System

This system uses 4 specialized agents to analyze and optimize LinkedIn posts:
1. Structural Agent - Analyzes post structure and format
2. Hashtag Analyzer - Evaluates hashtag usage and relevance
3. Analytics Agent - Provides engagement predictions and sentiment
4. Tag Analyzer - Reviews people tagging strategies

Reference: Based on Semantic Kernel's ConcurrentOrchestration pattern
"""


class StructureAnalysis(BaseModel):
    """Analysis of post structure following LinkedIn's magic formula."""
    
    hook_length: int = Field(description="Length of the hook in characters")
    hook_quality: str = Field(description="Quality assessment of the hook")
    rehook_present: bool = Field(description="Whether a re-hook exists")
    main_content_length: int = Field(description="Length of main content in characters")
    has_wrap_up: bool = Field(description="Whether post has a proper wrap-up")
    has_cta: bool = Field(description="Whether post has a call-to-action")
    structure_score: str = Field(description="Overall structure rating: Excellent/Good/Needs Improvement")
    recommendations: list[str] = Field(description="Specific recommendations for improving structure")


class HashtagAnalysis(BaseModel):
    """Analysis of hashtag usage in the post."""
    
    hashtags_found: list[str] = Field(description="List of hashtags found in the post")
    hashtag_count: int = Field(description="Number of hashtags used")
    relevance_score: str = Field(description="How relevant hashtags are to content: High/Medium/Low")
    spam_risk: str = Field(description="Risk of being marked as spam: Low/Medium/High")
    has_broad_hashtags: bool = Field(description="Whether post includes broad hashtags")
    has_niche_hashtags: bool = Field(description="Whether post includes niche-specific hashtags")
    placement_quality: str = Field(description="How hashtags are placed: Natural/End-loaded/Poor")
    recommendations: list[str] = Field(description="Specific recommendations for hashtag usage")


class EngagementAnalysis(BaseModel):
    """Analytics and engagement predictions for the post."""
    
    overall_sentiment: str = Field(description="Overall sentiment: Positive/Neutral/Negative")
    engagement_potential: str = Field(description="Predicted engagement level: High/Medium/Low")
    expected_impressions: str = Field(description="Expected impression range")
    expected_engagement_rate: str = Field(description="Expected engagement rate percentage")
    content_type: str = Field(description="Type of content: Text/Image/Video/Carousel/Link")
    strengths: list[str] = Field(description="Strong points that will drive engagement")
    weaknesses: list[str] = Field(description="Areas that may limit engagement")
    improvement_suggestions: list[str] = Field(description="Specific suggestions to boost engagement")


class TaggingAnalysis(BaseModel):
    """Analysis of people tagging in the post."""
    
    tags_found: list[str] = Field(description="List of people/accounts tagged")
    tag_count: int = Field(description="Number of tags used")
    tagging_quality: str = Field(description="Quality of tagging: Excellent/Good/Poor/None")
    has_context: bool = Field(description="Whether tags include explanation/context")
    spam_risk: str = Field(description="Risk of appearing spammy: Low/Medium/High")
    recommendations: list[str] = Field(description="Specific recommendations for tagging strategy")


class ToneAnalysis(BaseModel):
    """Comparison of tone between posts."""
    
    friendly_score: int = Field(ge=0, le=100, description="Friendliness score")
    persuasive_score: int = Field(ge=0, le=100, description="Persuasiveness score")
    formal_score: int = Field(ge=0, le=100, description="Formality score")
    tone_recommendation: str = Field(description="Recommendation for tone improvement")
    needs_simplification: bool = Field(description="Whether content needs simplification")


class KeywordOptimization(BaseModel):
    """Analysis of keyword optimization and SEO alignment."""
    
    primary_keywords: list[str] = Field(description="Main keywords identified in the post")
    keyword_density: dict[str, float] = Field(description="Keyword frequency as percentage")
    trending_keywords: list[str] = Field(description="Trending keywords found in the post")
    trending_keyword_count: int = Field(description="Number of trending keywords used")
    seo_score: str = Field(description="SEO optimization rating: Excellent/Good/Fair/Poor")
    keyword_relevance: str = Field(description="Keyword relevance to content: High/Medium/Low")
    search_visibility_score: int = Field(ge=0, le=100, description="Predicted search visibility score")
    tone_analysis: ToneAnalysis = Field(description="Tone analysis of the post")
    missing_keywords: list[str] = Field(description="Important keywords missing from the post")
    keyword_placement_quality: str = Field(description="How keywords are placed: Natural/Forced/Poor")
    recommendations: list[str] = Field(description="Specific recommendations for keyword optimization")


class LinkedInPostOptimization(BaseModel):
    """Complete LinkedIn post optimization analysis."""
    
    structure: StructureAnalysis
    hashtags: HashtagAnalysis
    analytics: EngagementAnalysis
    tagging: TaggingAnalysis
    keywords: KeywordOptimization
    overall_score: str = Field(description="Overall optimization score: Excellent/Good/Fair/Poor")
    virality_score: int = Field(ge=0, le=100, description="Virality score from 0-100")
    priority_actions: list[str] = Field(description="Top 3-5 priority actions to improve the post")


def get_agents() -> list[Agent]:
    """
    Return a list of specialized agents for LinkedIn post optimization.
    
    Key Fix: Create a Kernel and register the service before creating agents.
    
    Returns:
        list[Agent]: List of configured ChatCompletionAgent instances
    """
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
    
    structural_agent = ChatCompletionAgent(
        name="StructuralAgent",
        instructions="""You are an expert in LinkedIn post structure optimization. 
        
        Analyze posts based on LinkedIn's Magic Formula:
        - Hook (49 characters) - Must grab attention immediately (because Emotional triggers & hooks- Emotional resonance increases shares and comments.)
        - Re-hook (51 characters) - Reinforces the opening
        - Main content (953 characters) - Delivers core message 
        - Wrap-up (132 characters) - Summarizes key points (Content length & structure - Posts that are concise yet well-structured perform better.)
        - Call-to-action effectiveness (72 characters) - Clear CTAs drive conversions (clicks, follows, sign-ups) and Directs reader action (Engagement prompts- Questions, polls, or CTAs drive interaction)
        - Second CTA (63 characters) - Reinforces first CTA (Engagement prompts- Questions, polls, or CTAs drive interaction)
        
        Evaluate:
        - Paragraph length (1-3 sentences ideal)
        - White space usage
        - Overall length (100-300 words OR 3000 characters are optimal) and (Content length & structure - Posts that are concise yet well-structured perform better.)
        - Readability and flow (Easy-to-read posts get more engagement)
        - Opening line effectiveness (catches reader's attention)
        
        You MUST respond in valid JSON format only. Return your analysis as a JSON object with these exact fields:
        {
            "hook_length": <number>,
            "hook_quality": "<string>",
            "rehook_present": <boolean>,
            "main_content_length": <number>,
            "has_wrap_up": <boolean>,
            "has_cta": <boolean>,
            "structure_score": "<Excellent/Good/Needs Improvement>",
            "recommendations": ["<recommendation1>", "<recommendation2>", ...]
        }
        
        Do not include any text outside the JSON object.""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    hashtag_agent = ChatCompletionAgent(
        name="HashtagAnalyzer",
        instructions="""You are an expert in LinkedIn hashtag strategy and spam detection.
        
        Analyze hashtag usage based on LinkedIn best practices:
        - Optimal range: 3-5 hashtags per post
        - Mix of broad hashtags (#marketing) and niche hashtags (#B2BContentStrategy)
        - Natural placement within sentences vs end-loaded
        - Relevance to post content and industry
        - Risk of spam penalties
        
        Check for:
        - Overuse (>5 hashtags = spam risk)
        - Underuse (<3 hashtags = missed opportunity)
        - Irrelevant hashtags
        - Poor placement that looks unnatural
        
        You MUST respond in valid JSON format only. Return your analysis as a JSON object with these exact fields:
        {
            "hashtags_found": ["<hashtag1>", "<hashtag2>", ...],
            "hashtag_count": <number>,
            "relevance_score": "<High/Medium/Low>",
            "spam_risk": "<Low/Medium/High>",
            "has_broad_hashtags": <boolean>,
            "has_niche_hashtags": <boolean>,
            "placement_quality": "<Natural/End-loaded/Poor>",
            "recommendations": ["<recommendation1>", "<recommendation2>", ...]
        }
        
        Do not include any text outside the JSON object.""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    analytics_agent = ChatCompletionAgent(
        name="AnalyticsAgent",
        instructions="""You are an expert in LinkedIn analytics and engagement prediction.
        
        Analyze posts for engagement potential based on:
        - Content type (Video: 4.9%, Image: 4.8%, Carousel: 4.2%, Text: 3.6%, Link: 2.7%)
        - Posting time and day optimization
        - Sentiment and tone
        - Call-to-action effectiveness
        - Visual elements presence
        - Keyword optimization
        
        Predict metrics:
        - Expected impressions (benchmark: 9.50% of followers)
        - Engagement rate potential
        - Comment, share, and reaction likelihood
        
        You MUST respond in valid JSON format only. Return your analysis as a JSON object with these exact fields:
        {
            "overall_sentiment": "<Positive/Neutral/Negative>",
            "engagement_potential": "<High/Medium/Low>",
            "expected_impressions": "<string describing range>",
            "expected_engagement_rate": "<string with percentage>",
            "content_type": "<Text/Image/Video/Carousel/Link>",
            "strengths": ["<strength1>", "<strength2>", ...],
            "weaknesses": ["<weakness1>", "<weakness2>", ...],
            "improvement_suggestions": ["<suggestion1>", "<suggestion2>", ...]
        }
        
        Reference: Average LinkedIn engagement rate is 9.50%.
        Do not include any text outside the JSON object.""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    tag_analyzer_agent = ChatCompletionAgent(
        name="TagAnalyzerAgent",
        instructions="""You are an expert in LinkedIn tagging strategy and etiquette.
        
        Analyze people/account tagging based on best practices:
        - Limit to 2-3 tags per post to avoid clutter
        - Only tag people directly relevant or interested in the content
        - Always explain WHY you're tagging someone
        - Avoid random or promotional tagging
        
        Check for:
        - Excessive tagging (>3 tags = spam risk)
        - Missing context/explanation for tags
        - Relevance of tagged accounts
        - Professional appropriateness
        
        Remember: Every tag should add value, not just seek attention.
        
        You MUST respond in valid JSON format only. Return your analysis as a JSON object with these exact fields:
        {
            "tags_found": ["<tag1>", "<tag2>", ...],
            "tag_count": <number>,
            "tagging_quality": "<Excellent/Good/Poor/None>",
            "has_context": <boolean>,
            "spam_risk": "<Low/Medium/High>",
            "recommendations": ["<recommendation1>", "<recommendation2>", ...]
        }
        
        Do not include any text outside the JSON object.""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    keyword_optimizer_agent = ChatCompletionAgent(
        name="KeywordOptimizerAgent",
        instructions="""You are an expert in keyword optimization, SEO, and content analysis for LinkedIn posts.
        
        Your role is to analyze posts for:
        
        1. KEYWORD OPTIMIZATION:
        - Identify primary keywords (3-5 main topics)
        - Calculate keyword density (1-3% is ideal, avoid stuffing)
        - Detect trending keywords and industry terms
        - Check keyword placement (title, opening, body, closing)
        
        2. SEO ALIGNMENT:
        - Search visibility potential for LinkedIn and Google
        - Keyword relevance to target audience
        - Natural language processing quality
        - Content discoverability score
        
        3. TONE ANALYSIS:
        - Friendly score (0-100): How approachable and conversational
        - Persuasive score (0-100): How compelling and action-driving
        - Formal score (0-100): Professional vs casual language
        - Simplification needs: Whether content is too complex
        
        4. TRENDING WORDS:
        - Count usage of current trending terms
        - Industry-specific buzzwords
        - Time-sensitive keywords
        
        5. KEYWORD RECOMMENDATIONS:
        - Missing high-impact keywords
        - Over-used or spammy keywords
        - Better keyword alternatives
        - Placement improvements
        
        IMPORTANT SCORING GUIDELINES:
        - Search visibility score: 0-100 (70+ is excellent)
        - Keyword density: 1-3% is optimal
        - Trending keyword count: 2-5 is ideal
        - Tone scores: Balance all three (no single score should dominate)
        
        You MUST respond in valid JSON format only. Return your analysis as a JSON object with these exact fields:
        {
            "primary_keywords": ["<keyword1>", "<keyword2>", ...],
            "keyword_density": {"<keyword>": <percentage>, ...},
            "trending_keywords": ["<trending1>", "<trending2>", ...],
            "trending_keyword_count": <number>,
            "seo_score": "<Excellent/Good/Fair/Poor>",
            "keyword_relevance": "<High/Medium/Low>",
            "search_visibility_score": <number 0-100>,
            "tone_analysis": {
                "friendly_score": <number 0-100>,
                "persuasive_score": <number 0-100>,
                "formal_score": <number 0-100>,
                "tone_recommendation": "<string>",
                "needs_simplification": <boolean>
            },
            "missing_keywords": ["<keyword1>", "<keyword2>", ...],
            "keyword_placement_quality": "<Natural/Forced/Poor>",
            "recommendations": ["<recommendation1>", "<recommendation2>", ...]
        }
        
        Do not include any text outside the JSON object.""",
        kernel=kernel,
        arguments=agent_arguments
    )
    
    return [structural_agent, hashtag_agent, analytics_agent, tag_analyzer_agent, keyword_optimizer_agent]


def parse_json_response(content: str) -> dict:
    """
    Parse JSON from agent response, handling markdown code blocks and malformed JSON.
    Also normalizes recommendation format from dict to string.
    
    Args:
        content: The raw content from the agent
        
    Returns:
        dict: Parsed JSON object with normalized recommendations
    """
    try:
        # Remove markdown code blocks if present
        content = re.sub(r'```json\s*', '', content)
        content = re.sub(r'```\s*', '', content)
        
        # Try to find JSON object in the content
        # Look for content between { and }
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            json_str = match.group(0)
            data = json.loads(json_str)
        else:
            # If no match, try to parse the whole content
            data = json.loads(content)
        
        # Normalize all list fields that should contain strings
        # These fields might come as dicts from the LLM but should be strings
        list_fields = [
            'recommendations', 
            'improvement_suggestions', 
            'strengths', 
            'weaknesses',
            'primary_keywords',
            'trending_keywords',
            'missing_keywords'
        ]
        
        for field in list_fields:
            if field in data and isinstance(data[field], list):
                normalized_list = []
                for item in data[field]:
                    if isinstance(item, dict):
                        # Try common dict structures and convert to string
                        # Format 1: {"name": "...", "description": "..."}
                        name = item.get('name', '')
                        description = item.get('description', '')
                        
                        # Format 2: {"type": "...", "suggestion": "..."}
                        type_field = item.get('type', '')
                        suggestion = item.get('suggestion', '')
                        
                        # Format 3: Any other dict - just get all values
                        if name and description:
                            normalized_list.append(f"{name}: {description}")
                        elif type_field and suggestion:
                            normalized_list.append(f"{type_field}: {suggestion}")
                        elif name:
                            normalized_list.append(name)
                        elif description:
                            normalized_list.append(description)
                        elif suggestion:
                            normalized_list.append(suggestion)
                        else:
                            # Concatenate all non-empty values
                            values = [str(v) for v in item.values() if v]
                            if values:
                                normalized_list.append(': '.join(values))
                            else:
                                normalized_list.append(str(item))
                    elif isinstance(item, str):
                        normalized_list.append(item)
                    else:
                        # Convert any other type to string
                        normalized_list.append(str(item))
                data[field] = normalized_list
        
        return data
        
    except json.JSONDecodeError as e:
        print(f"Warning: Failed to parse JSON: {e}")
        print(f"Content: {content[:200]}...")
        # Return a default structure if parsing fails
        return {"error": "Failed to parse response", "raw_content": content}


def calculate_virality_score(
    structure: StructureAnalysis,
    hashtags: HashtagAnalysis,
    analytics: EngagementAnalysis,
    tagging: TaggingAnalysis,
    keywords: KeywordOptimization
) -> int:
    """
    Calculate virality score from 0-100 based on all optimization factors.
    
    Args:
        structure: Structure analysis results
        hashtags: Hashtag analysis results
        analytics: Analytics analysis results
        tagging: Tagging analysis results
        keywords: Keyword optimization results
        
    Returns:
        int: Virality score from 0-100
    """
    score = 0
    
    # Structure component (20 points max)
    if structure.structure_score == "Excellent":
        score += 20
    elif structure.structure_score == "Good":
        score += 15
    elif structure.structure_score == "Needs Improvement":
        score += 8
    
    # Hashtag component (15 points max)
    if hashtags.spam_risk == "Low":
        if hashtags.relevance_score == "High":
            score += 15
        elif hashtags.relevance_score == "Medium":
            score += 10
        else:
            score += 5
    elif hashtags.spam_risk == "Medium":
        score += 5
    
    # Analytics component (25 points max)
    if analytics.engagement_potential == "High":
        score += 25
    elif analytics.engagement_potential == "Medium":
        score += 15
    elif analytics.engagement_potential == "Low":
        score += 5
    
    # Tagging component (10 points max)
    if tagging.spam_risk == "Low":
        if tagging.tagging_quality in ["Excellent", "Good"]:
            score += 10
        else:
            score += 5
    elif tagging.spam_risk == "Medium":
        score += 3
    
    # Keyword optimization component (30 points max)
    keyword_score = 0
    
    # SEO score (10 points)
    if keywords.seo_score == "Excellent":
        keyword_score += 10
    elif keywords.seo_score == "Good":
        keyword_score += 7
    elif keywords.seo_score == "Fair":
        keyword_score += 4
    else:
        keyword_score += 1
    
    # Keyword relevance (8 points)
    if keywords.keyword_relevance == "High":
        keyword_score += 8
    elif keywords.keyword_relevance == "Medium":
        keyword_score += 5
    else:
        keyword_score += 2
    
    # Search visibility (12 points) - scaled from 0-100 to 0-12
    keyword_score += int(keywords.search_visibility_score * 0.12)
    
    score += keyword_score
    
    # Ensure score is within 0-100 range
    return min(100, max(0, score))


async def optimize_linkedin_post(post_content: str) -> LinkedInPostOptimization:
    """
    Main function to optimize a LinkedIn post using multi-agent analysis.
    
    This function follows the ConcurrentOrchestration pattern:
    1. Creates specialized agents for different analysis aspects
    2. Sets up concurrent orchestration
    3. Creates and starts an InProcessRuntime
    4. Invokes the orchestration with the post content
    5. Waits for results with timeout
    6. Parses JSON responses from each agent
    7. Combines into a structured LinkedInPostOptimization object
    8. Stops the runtime cleanly
    
    Args:
        post_content: The LinkedIn post text to analyze
        
    Returns:
        LinkedInPostOptimization: Complete analysis and recommendations
        
    Raises:
        TimeoutError: If the orchestration exceeds the timeout period
    """
    # 1. Create agents
    print("🚀 Starting LinkedIn Post Optimization Analysis...")
    print("=" * 60)
    agents = get_agents()
    print(f"✅ Created {len(agents)} specialized agents")
    
    # 2. Create concurrent orchestration
    concurrent_orchestration = ConcurrentOrchestration(
        members=agents,
    )
    print("✅ Configured concurrent orchestration")
    
    # 3. Create and start runtime
    runtime = InProcessRuntime()
    runtime.start()
    print("✅ Runtime started")
    
    try:
        # 4. Invoke orchestration
        print("\n⚙️  Analyzing post across all dimensions...")
        orchestration_result = await concurrent_orchestration.invoke(
        task=f"""Analyze this LinkedIn post and provide comprehensive optimization recommendations:

        POST CONTENT:
        {post_content}

        Analyze the post for:
        1. Structure and formatting (Magic Formula compliance)
        2. Hashtag usage and relevance
        3. Engagement potential and analytics
        4. People tagging strategy
        5. Keyword optimization, SEO alignment, tone analysis, and trending words

        Provide specific, actionable recommendations for each area.
        Remember to respond ONLY with valid JSON - no additional text or explanations.""",
                    runtime=runtime,
                )
        
        # 5. Wait for results
        print("⏳ Waiting for agent responses...")
        value = await orchestration_result.get(timeout=90)
        print("✅ Analysis complete!")
        
        # 6. Process and parse JSON responses from each agent
        parsed_results = {}
        for item in value:
            parsed_results[item.name] = parse_json_response(item.content)
        
        # 7. Map agent results to Pydantic models
        structure_data = parsed_results.get("StructuralAgent", {})
        hashtag_data = parsed_results.get("HashtagAnalyzer", {})
        analytics_data = parsed_results.get("AnalyticsAgent", {})
        tagging_data = parsed_results.get("TagAnalyzerAgent", {})
        keyword_data = parsed_results.get("KeywordOptimizerAgent", {})
        
        # Create Pydantic models with fallback values
        structure = StructureAnalysis(
            hook_length=structure_data.get("hook_length", 0),
            hook_quality=structure_data.get("hook_quality", "Unknown"),
            rehook_present=structure_data.get("rehook_present", False),
            main_content_length=structure_data.get("main_content_length", 0),
            has_wrap_up=structure_data.get("has_wrap_up", False),
            has_cta=structure_data.get("has_cta", False),
            structure_score=structure_data.get("structure_score", "Unknown"),
            recommendations=structure_data.get("recommendations", [])
        )
        
        hashtags = HashtagAnalysis(
            hashtags_found=hashtag_data.get("hashtags_found", []),
            hashtag_count=hashtag_data.get("hashtag_count", 0),
            relevance_score=hashtag_data.get("relevance_score", "Unknown"),
            spam_risk=hashtag_data.get("spam_risk", "Unknown"),
            has_broad_hashtags=hashtag_data.get("has_broad_hashtags", False),
            has_niche_hashtags=hashtag_data.get("has_niche_hashtags", False),
            placement_quality=hashtag_data.get("placement_quality", "Unknown"),
            recommendations=hashtag_data.get("recommendations", [])
        )
        
        analytics = EngagementAnalysis(
            overall_sentiment=analytics_data.get("overall_sentiment", "Unknown"),
            engagement_potential=analytics_data.get("engagement_potential", "Unknown"),
            expected_impressions=analytics_data.get("expected_impressions", "Unknown"),
            expected_engagement_rate=analytics_data.get("expected_engagement_rate", "Unknown"),
            content_type=analytics_data.get("content_type", "Unknown"),
            strengths=analytics_data.get("strengths", []),
            weaknesses=analytics_data.get("weaknesses", []),
            improvement_suggestions=analytics_data.get("improvement_suggestions", [])
        )
        
        tagging = TaggingAnalysis(
            tags_found=tagging_data.get("tags_found", []),
            tag_count=tagging_data.get("tag_count", 0),
            tagging_quality=tagging_data.get("tagging_quality", "Unknown"),
            has_context=tagging_data.get("has_context", False),
            spam_risk=tagging_data.get("spam_risk", "Unknown"),
            recommendations=tagging_data.get("recommendations", [])
        )
        
        # Parse tone analysis from keyword data
        tone_data = keyword_data.get("tone_analysis", {})
        tone_analysis = ToneAnalysis(
            friendly_score=tone_data.get("friendly_score", 50),
            persuasive_score=tone_data.get("persuasive_score", 50),
            formal_score=tone_data.get("formal_score", 50),
            tone_recommendation=tone_data.get("tone_recommendation", "Balance tone for professional engagement"),
            needs_simplification=tone_data.get("needs_simplification", False)
        )
        
        keywords = KeywordOptimization(
            primary_keywords=keyword_data.get("primary_keywords", []),
            keyword_density=keyword_data.get("keyword_density", {}),
            trending_keywords=keyword_data.get("trending_keywords", []),
            trending_keyword_count=keyword_data.get("trending_keyword_count", 0),
            seo_score=keyword_data.get("seo_score", "Fair"),
            keyword_relevance=keyword_data.get("keyword_relevance", "Medium"),
            search_visibility_score=keyword_data.get("search_visibility_score", 50),
            tone_analysis=tone_analysis,
            missing_keywords=keyword_data.get("missing_keywords", []),
            keyword_placement_quality=keyword_data.get("keyword_placement_quality", "Natural"),
            recommendations=keyword_data.get("recommendations", [])
        )
        
        # 8. Calculate virality score
        virality_score = calculate_virality_score(structure, hashtags, analytics, tagging, keywords)
        
        # 9. Calculate overall score and priority actions
        scores = []
        if structure.structure_score in ["Excellent", "Good"]:
            scores.append(1)
        if hashtags.spam_risk == "Low":
            scores.append(1)
        if analytics.engagement_potential in ["High", "Medium"]:
            scores.append(1)
        if tagging.spam_risk == "Low":
            scores.append(1)
        if keywords.seo_score in ["Excellent", "Good"]:
            scores.append(1)
            
        overall_score = "Excellent" if len(scores) >= 4 else "Good" if len(scores) >= 3 else "Fair" if len(scores) >= 2 else "Poor"
        
        # Collect top priority actions
        priority_actions = []
        priority_actions.extend(structure.recommendations[:2])
        priority_actions.extend(hashtags.recommendations[:1])
        priority_actions.extend(analytics.improvement_suggestions[:1])
        priority_actions.extend(keywords.recommendations[:1])
        
        # Create final result
        result = LinkedInPostOptimization(
            structure=structure,
            hashtags=hashtags,
            analytics=analytics,
            tagging=tagging,
            keywords=keywords,
            overall_score=overall_score,
            virality_score=virality_score,
            priority_actions=priority_actions[:5]  # Top 5 actions
        )
        
        return result
            
    finally:
        # 9. Always stop runtime after invocation is complete
        print("\n🛑 Stopping runtime...")
        await runtime.stop_when_idle()
        print("✅ Runtime stopped cleanly")


def print_optimization_results(results: LinkedInPostOptimization):
    """
    Pretty print the optimization results in a formatted report.
    
    Args:
        results: The LinkedInPostOptimization analysis results
    """
    print("\n" + "=" * 60)
    print("📊 LINKEDIN POST OPTIMIZATION REPORT")
    print("=" * 60)
    
    print(f"\n🎯 OVERALL SCORE: {results.overall_score}")
    print(f"\n🔥 VIRALITY SCORE: {results.virality_score}")
    print("\n🔥 PRIORITY ACTIONS:")
    for i, action in enumerate(results.priority_actions, 1):
        print(f"   {i}. {action}")
    
    print("\n" + "-" * 60)
    print("📝 STRUCTURE ANALYSIS")
    print("-" * 60)
    print(f"Hook Length: {results.structure.hook_length} chars (Target: 49)")
    print(f"Hook Quality: {results.structure.hook_quality}")
    print(f"Re-hook Present: {'✅' if results.structure.rehook_present else '❌'}")
    print(f"Main Content: {results.structure.main_content_length} chars (Target: 953)")
    print(f"Has Wrap-up: {'✅' if results.structure.has_wrap_up else '❌'}")
    print(f"Has CTA: {'✅' if results.structure.has_cta else '❌'}")
    print(f"Structure Score: {results.structure.structure_score}")
    print("\n💡 Recommendations:")
    for rec in results.structure.recommendations:
        print(f"   • {rec}")
    
    print("\n" + "-" * 60)
    print("#️⃣ HASHTAG ANALYSIS")
    print("-" * 60)
    print(f"Hashtags Found: {', '.join(results.hashtags.hashtags_found) if results.hashtags.hashtags_found else 'None'}")
    print(f"Count: {results.hashtags.hashtag_count} (Optimal: 3-5)")
    print(f"Relevance Score: {results.hashtags.relevance_score}")
    print(f"Spam Risk: {results.hashtags.spam_risk}")
    print(f"Broad Hashtags: {'✅' if results.hashtags.has_broad_hashtags else '❌'}")
    print(f"Niche Hashtags: {'✅' if results.hashtags.has_niche_hashtags else '❌'}")
    print(f"Placement Quality: {results.hashtags.placement_quality}")
    print("\n💡 Recommendations:")
    for rec in results.hashtags.recommendations:
        print(f"   • {rec}")
    
    print("\n" + "-" * 60)
    print("📈 ENGAGEMENT ANALYTICS")
    print("-" * 60)
    print(f"Overall Sentiment: {results.analytics.overall_sentiment}")
    print(f"Engagement Potential: {results.analytics.engagement_potential}")
    print(f"Expected Impressions: {results.analytics.expected_impressions}")
    print(f"Expected Engagement Rate: {results.analytics.expected_engagement_rate}")
    print(f"Content Type: {results.analytics.content_type}")
    print("\n💪 Strengths:")
    for strength in results.analytics.strengths:
        print(f"   ✅ {strength}")
    print("\n⚠️ Weaknesses:")
    for weakness in results.analytics.weaknesses:
        print(f"   ⚡ {weakness}")
    print("\n💡 Improvement Suggestions:")
    for suggestion in results.analytics.improvement_suggestions:
        print(f"   • {suggestion}")
    
    print("\n" + "-" * 60)
    print("👥 TAGGING ANALYSIS")
    print("-" * 60)
    print(f"Tags Found: {', '.join(results.tagging.tags_found) if results.tagging.tags_found else 'None'}")
    print(f"Tag Count: {results.tagging.tag_count} (Optimal: 2-3)")
    print(f"Tagging Quality: {results.tagging.tagging_quality}")
    print(f"Has Context: {'✅' if results.tagging.has_context else '❌'}")
    print(f"Spam Risk: {results.tagging.spam_risk}")
    print("\n💡 Recommendations:")
    for rec in results.tagging.recommendations:
        print(f"   • {rec}")
    
    print("\n" + "=" * 60)


async def main():
    """
    Main function with example LinkedIn post.
    
    Demonstrates the complete workflow of the LinkedIn Post Optimizer.
    """
    # Example LinkedIn post to analyze
    example_post = """
    We are truly overwhelmed and deeply inspired by the phenomenal response to the 𝗗𝗲𝗳𝗲𝗻𝗰𝗲-𝗧𝗲𝗰𝗵 𝗦𝘁𝗮𝗿𝘁𝘂𝗽 𝗖𝗵𝗮𝗹𝗹𝗲𝗻𝗴𝗲!

    In just a few weeks, we have witnessed a surge of groundbreaking ideas, visionary prototypes, and bold ambitions from across India's innovation ecosystem. From AI-driven threat detection to autonomous surveillance platforms, resilient communication systems to quantum-secure networks, the calibre of submissions has been nothing short of extraordinary.

    What is even more energising? The passionate outreach from startup founders, researchers, and technologists who are asking for more time to refine their concepts and join this transformative journey. 

    We have listened! And we are acting!

    𝗡𝗲𝘄 𝗗𝗲𝗮𝗱𝗹𝗶𝗻𝗲: 𝗦𝗲𝗽𝘁𝗲𝗺𝗯𝗲𝗿 𝟭𝟰, 𝟮𝟬𝟮𝟱 – 𝟮𝟰𝟬𝟬 𝗵𝗿𝘀

    This is not just an extension, it is an open door to the future of national defence. If you are building tech that can redefine battlefield intelligence, enhance strategic capabilities, or fortify our digital borders, this is your moment to shine.

    Bharat's defence landscape is evolving, and it needs your innovation. Let us create the next generation of defence solutions that are smart, scalable, and secure.

    The future is being built now. Will you be part of it?

    hashtag#DefenceTech hashtag#StartupChallenge hashtag#DeadlineExtended hashtag#IITMandiiHUB hashtag#InnovationInDefence hashtag#NationalSecurity hashtag#TechForIndia hashtag#FutureReady hashtag#MakeInIndia hashtag#StrategicInnovation

    Indian Institute of Technology, Mandi IIT Mandi Laxmidhar Behera India DST Abhay Karandikar Ekta Kapoor Rajani Kushwaha Tanushri Sharma Amar Kumar Chandrasekhar Srivari Dr. Balvinder Singh M Balakrishnan Manivannan Muniyandi L Venkata Subramaniam Dr. Satya Gupta Shubhajit Roy Chowdhury Shyam Kumar Masakapalli Bharadwaj Amrutur Balamuralidhar P Somjit Amrit KB Rajendran Volga Verma Ezhilvel Elangovan iDEX Defence Innovation Organization FICCI Indian Army Department of Defence Production India,Ministry of Defence GoI Sahil Jaglan iDEX Defence Innovation Organization Ministry of Defence of India Make In India Invest India NITI Aayog S Vaibhav Startup India Directorate of Public Relations, Ministry of Defence, India
    """
    
    try:
        # Run optimization
        results = await optimize_linkedin_post(example_post)
        
        # Print formatted results
        print_optimization_results(results)
        
        # Print JSON for API response
        print("\n" + "=" * 60)
        print("📄 JSON OUTPUT FOR API")
        print("=" * 60)
        json_output = results.model_dump_json(indent=2)
        print(json_output)
        
        # # Also show how to convert to dict for API response
        # print("\n" + "=" * 60)
        # print("📦 DICT OUTPUT FOR API")
        # print("=" * 60)
        # dict_output = results.model_dump()
        # print(json.dumps(dict_output, indent=2))
        
    except Exception as e:
        print(f"\n❌ Error during optimization: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║   LinkedIn Post Optimizer - Multi-Agent System           ║
    ║   Powered by Semantic Kernel + Ollama                    ║
    ║   Using ConcurrentOrchestration Pattern                  ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    asyncio.run(main())



