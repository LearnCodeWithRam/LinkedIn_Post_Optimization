"""
Background tasks for vector index management
"""

import logging
from .vector_db import vector_db_service

logger = logging.getLogger(__name__)


def rebuild_vector_index_task():
    """
    Rebuild the FAISS vector index.
    Call this after new viral posts are scraped.
    """
    try:
        logger.info("Starting vector index rebuild task...")
        success = vector_db_service.rebuild_index()
        
        if success:
            stats = vector_db_service.get_index_stats()
            logger.info(f"Vector index rebuilt successfully: {stats['total_posts']} posts indexed")
            return {
                'success': True,
                'message': 'Vector index rebuilt successfully',
                'stats': stats
            }
        else:
            logger.error("Failed to rebuild vector index")
            return {
                'success': False,
                'error': 'Failed to rebuild vector index'
            }
    
    except Exception as e:
        logger.error(f"Error in rebuild_vector_index_task: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
