"""
Keyword and Theme Extraction Service
Extracts important keywords and themes from LinkedIn posts
"""

import re
from typing import List, Set
from collections import Counter


class KeywordExtractor:
    """
    Extract keywords and themes from LinkedIn posts.
    Uses a combination of:
    - Hashtag extraction
    - Important word identification (nouns, verbs, adjectives)
    - Frequency analysis
    """
    
    # Common LinkedIn-related stop words to filter out
    STOP_WORDS = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that',
        'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them',
        'their', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
        'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
        'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        's', 't', 'just', 'don', 'now', 'get', 'got', 'like', 'make', 'made',
        'know', 'think', 'see', 'want', 'go', 'use', 'find', 'give', 'tell',
        'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'good', 'new',
        'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
        'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early',
        'young', 'important', 'public', 'bad', 'same', 'able', 'post', 'share',
        'linkedin', 'follow', 'comment', 'read', 'article', 'blog', 'check',
        'out', 'here', 'today', 'yesterday', 'tomorrow', 'week', 'month', 'year'
    }
    
    @staticmethod
    def extract_hashtags(text: str) -> List[str]:
        """Extract hashtags from text"""
        hashtags = re.findall(r'#(\w+)', text)
        return [tag.lower() for tag in hashtags]
    
    @staticmethod
    def extract_important_words(text: str, min_length: int = 4) -> List[str]:
        """
        Extract important words from text.
        Filters out stop words and short words.
        """
        # Remove URLs
        text = re.sub(r'http\S+|www\S+', '', text)
        
        # Remove hashtags (we handle them separately)
        text = re.sub(r'#\w+', '', text)
        
        # Remove special characters and split into words
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        
        # Filter words
        important_words = [
            word for word in words
            if len(word) >= min_length and word not in KeywordExtractor.STOP_WORDS
        ]
        
        return important_words
    
    @staticmethod
    def extract_keywords(text: str, max_keywords: int = 8) -> List[str]:
        """
        Extract top keywords from text.
        Combines hashtags and important words.
        
        Args:
            text: The LinkedIn post content
            max_keywords: Maximum number of keywords to return
            
        Returns:
            List of top keywords/themes
        """
        keywords = []
        
        # 1. Extract hashtags (high priority)
        hashtags = KeywordExtractor.extract_hashtags(text)
        keywords.extend(hashtags[:5])  # Take top 5 hashtags
        
        # 2. Extract important words
        important_words = KeywordExtractor.extract_important_words(text)
        
        # Count word frequency
        word_freq = Counter(important_words)
        
        # Get most common words
        common_words = [word for word, _ in word_freq.most_common(max_keywords)]
        
        # Add words that aren't already in keywords (from hashtags)
        for word in common_words:
            if word not in keywords and len(keywords) < max_keywords:
                keywords.append(word)
        
        return keywords[:max_keywords]
    
    @staticmethod
    def generate_search_query(keywords: List[str]) -> str:
        """
        Generate a search query from keywords.
        
        Args:
            keywords: List of extracted keywords
            
        Returns:
            Search query string
        """
        if not keywords:
            return ""
        
        # Take top 3-5 keywords
        top_keywords = keywords[:5]
        
        # Format as search query
        # Use hashtags if available, otherwise use keywords
        query_parts = []
        for keyword in top_keywords:
            if keyword and keyword.strip():
                # Add # if it looks like a hashtag topic
                if len(keyword) > 2 and keyword.isalnum():
                    query_parts.append(f"#{keyword}")
                else:
                    query_parts.append(keyword)
        
        return " ".join(query_parts)


# Global instance
keyword_extractor = KeywordExtractor()
