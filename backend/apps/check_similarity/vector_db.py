"""
Vector Database Service for Viral Post Similarity Search
Uses FAISS for fast semantic similarity search with sentence transformers
"""

import os
import json
import logging
import numpy as np
from typing import List, Dict, Tuple, Optional
from sentence_transformers import SentenceTransformer
import faiss

logger = logging.getLogger(__name__)


class VectorDatabaseService:
    """
    FAISS-based vector database for viral LinkedIn posts.
    Handles embedding generation, indexing, and similarity search.
    """
    
    def __init__(self):
        self.model_name = 'all-MiniLM-L6-v2'
        self.model = None
        self.index = None
        self.post_metadata = {}
        self.embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
        
        # Paths for persistence
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data')
        self.index_path = os.path.join(self.data_dir, 'faiss_index.bin')
        self.metadata_path = os.path.join(self.data_dir, 'post_metadata.json')
        self.viral_posts_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'viralpost_scraping',
            'linkedin_posts.json'
        )
        
        # Create data directory if it doesn't exist
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Lazy load model and index (only when needed)
        self.model = None
        self.index = None
        self.post_metadata = []
    
    def _load_model(self):
        """Load the sentence transformer model (lazy loading)"""
        if self.model is not None:
            return
            
        try:
            logger.info(f"Loading sentence transformer model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def _load_viral_posts(self) -> List[Dict]:
        """Load viral posts from JSON file"""
        try:
            if not os.path.exists(self.viral_posts_path):
                logger.warning(f"Viral posts file not found: {self.viral_posts_path}")
                return []
            
            with open(self.viral_posts_path, 'r', encoding='utf-8') as f:
                posts = json.load(f)
            
            # Ensure each post has an ID
            for idx, post in enumerate(posts):
                if 'id' not in post:
                    post['id'] = f"viral_{idx:03d}"
            
            logger.info(f"Loaded {len(posts)} viral posts")
            return posts
        
        except Exception as e:
            logger.error(f"Error loading viral posts: {str(e)}")
            return []
    
    def _build_index(self, posts: List[Dict]) -> bool:
        """Build FAISS index from viral posts"""
        try:
            if not posts:
                logger.warning("No posts to index")
                return False
            
            # Ensure model is loaded
            self._load_model()
            
            logger.info(f"Building FAISS index for {len(posts)} posts...")
            
            # Extract post contents
            post_texts = [post.get('post_content', '') for post in posts]
            
            # Generate embeddings
            logger.info("Generating embeddings...")
            embeddings = self.model.encode(
                post_texts,
                convert_to_numpy=True,
                show_progress_bar=True
            )
            
            # Create FAISS index
            logger.info("Creating FAISS index...")
            self.index = faiss.IndexFlatIP(self.embedding_dim)  # Inner Product (cosine similarity)
            
            # Normalize embeddings for cosine similarity
            faiss.normalize_L2(embeddings)
            
            # Add to index
            self.index.add(embeddings.astype('float32'))
            
            # Store metadata
            self.post_metadata = {
                post['id']: {
                    'post_content': post.get('post_content', ''),
                    'author_name': post.get('author_name', 'Unknown'),
                    'likes': post.get('likes', '0'),
                    'comments': post.get('comments', 0),
                    'shares': post.get('shares', 0),
                    'linkedin_url': post.get('linkedin_url', ''),
                    'time_posted': post.get('time_posted', ''),
                    'profile_image_url': post.get('profile_image_url', ''),
                    'post_image_url': post.get('post_image_url', ''),
                }
                for post in posts
            }
            
            logger.info(f"Index built successfully with {self.index.ntotal} vectors")
            return True
        
        except Exception as e:
            logger.error(f"Error building index: {str(e)}")
            return False
    
    def _save_index(self):
        """Save FAISS index and metadata to disk"""
        try:
            if self.index is None:
                logger.warning("No index to save")
                return False
            
            # Save FAISS index
            faiss.write_index(self.index, self.index_path)
            logger.info(f"FAISS index saved to {self.index_path}")
            
            # Save metadata
            with open(self.metadata_path, 'w', encoding='utf-8') as f:
                json.dump(self.post_metadata, f, ensure_ascii=False, indent=2)
            logger.info(f"Metadata saved to {self.metadata_path}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error saving index: {str(e)}")
            return False
    
    def _load_index(self) -> bool:
        """Load FAISS index and metadata from disk"""
        try:
            if not os.path.exists(self.index_path) or not os.path.exists(self.metadata_path):
                logger.info("Index files not found, will build new index")
                return False
            
            # Load FAISS index
            self.index = faiss.read_index(self.index_path)
            logger.info(f"FAISS index loaded from {self.index_path}")
            
            # Load metadata
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                self.post_metadata = json.load(f)
            logger.info(f"Metadata loaded: {len(self.post_metadata)} posts")
            
            return True
        
        except Exception as e:
            logger.error(f"Error loading index: {str(e)}")
            return False
    
    def _load_or_build_index(self):
        """Load existing index or build new one"""
        # Try to load existing index
        if self._load_index():
            logger.info("Using existing FAISS index")
            return
        
        # Build new index
        logger.info("Building new FAISS index...")
        posts = self._load_viral_posts()
        if self._build_index(posts):
            self._save_index()
    
    def rebuild_index(self) -> bool:
        """
        Rebuild the FAISS index from scratch.
        Call this after new viral posts are added.
        """
        try:
            logger.info("Rebuilding FAISS index...")
            posts = self._load_viral_posts()
            
            if self._build_index(posts):
                self._save_index()
                logger.info("Index rebuilt successfully")
                return True
            else:
                logger.error("Failed to rebuild index")
                return False
        
        except Exception as e:
            logger.error(f"Error rebuilding index: {str(e)}")
            return False
    
    def search_similar(
        self,
        query_text: str,
        top_k: int = 3
    ) -> List[Dict]:
        """
        Find top K most similar viral posts to the query text.
        
        Args:
            query_text: The user's LinkedIn post content
            top_k: Number of similar posts to return
        
        Returns:
            List of dictionaries with post_id, similarity_score, and metadata
        """
        try:
            # Ensure model is loaded
            self._load_model()
            
            if self.index is None or self.index.ntotal == 0:
                logger.warning("Index is empty, rebuilding...")
                self.rebuild_index()
                
                if self.index is None or self.index.ntotal == 0:
                    logger.error("Failed to build index")
                    return []
            
            # Generate embedding for query
            query_embedding = self.model.encode(
                [query_text],
                convert_to_numpy=True
            )
            
            # Normalize for cosine similarity
            faiss.normalize_L2(query_embedding)
            
            # Search
            top_k = min(top_k, self.index.ntotal)  # Don't request more than available
            scores, indices = self.index.search(query_embedding.astype('float32'), top_k)
            
            # Build results
            results = []
            post_ids = list(self.post_metadata.keys())
            
            for idx, score in zip(indices[0], scores[0]):
                if idx < len(post_ids):
                    post_id = post_ids[idx]
                    metadata = self.post_metadata[post_id]
                    
                    results.append({
                        'post_id': post_id,
                        'similarity_score': round(float(score), 2),
                        'label': 'Recommended',
                        **metadata
                    })
            
            logger.info(f"Found {len(results)} similar posts")
            return results
        
        except Exception as e:
            logger.error(f"Error searching similar posts: {str(e)}")
            return []
    
    def get_post_by_id(self, post_id: str) -> Optional[Dict]:
        """Get post metadata by ID"""
        return self.post_metadata.get(post_id)
    
    def get_index_stats(self) -> Dict:
        """Get statistics about the index"""
        return {
            'total_posts': self.index.ntotal if self.index else 0,
            'embedding_dimension': self.embedding_dim,
            'model_name': self.model_name,
            'index_exists': os.path.exists(self.index_path),
            'metadata_exists': os.path.exists(self.metadata_path),
        }


# Global instance
vector_db_service = VectorDatabaseService()
