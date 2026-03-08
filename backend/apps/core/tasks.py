import logging
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(name='apps.core.tasks.cleanup_expired_data')
def cleanup_expired_data():
    """
    Periodic task to clean up expired or old data from the database.
    Runs daily to maintain database health and performance.
    """
    logger.info("Starting cleanup of expired data...")
    
    try:
        # Calculate cutoff date (e.g., 90 days ago)
        cutoff_date = timezone.now() - timedelta(days=90)
        
        # TODO: Add cleanup logic for different models
        # Example:
        # - Delete old sessions
        # - Archive old analytics data
        # - Clean up temporary files
        # - Remove expired cache entries
        
        deleted_count = 0
        
        # Clean up old soft-deleted records
        from django.apps import apps
        for model in apps.get_models():
            if hasattr(model, 'is_active') and hasattr(model, 'updated_at'):
                # Delete records that have been soft-deleted for more than 90 days
                result = model.objects.filter(
                    is_active=False,
                    updated_at__lt=cutoff_date
                ).delete()
                deleted_count += result[0] if result else 0
        
        logger.info(f"Cleanup completed. Deleted {deleted_count} records.")
        return {
            'status': 'success',
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat()
        }
        
    except Exception as e:
        logger.exception(f"Error during cleanup: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task(name='apps.core.tasks.health_check')
def health_check():
    """
    Simple health check task to verify Celery is working.
    """
    logger.info("Health check task executed successfully")
    return {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    }


@shared_task(name='apps.core.tasks.send_notification')
def send_notification(user_id, notification_type, message, **kwargs):
    """
    Send a notification to a user.
    
    Args:
        user_id: User ID to send notification to
        notification_type: Type of notification (email, push, etc.)
        message: Notification message
        **kwargs: Additional notification parameters
    """
    logger.info(f"Sending {notification_type} notification to user {user_id}")
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        user = User.objects.get(id=user_id)
        
        # Handle different notification types
        if notification_type == 'email':
            return send_email_notification(user, message, **kwargs)
        elif notification_type == 'push':
            return send_push_notification(user, message, **kwargs)
        else:
            logger.warning(f"Unknown notification type: {notification_type}")
            return {'status': 'error', 'error': 'Unknown notification type'}
            
    except Exception as e:
        logger.exception(f"Error sending notification: {str(e)}")
        return {'status': 'error', 'error': str(e)}


def send_email_notification(user, message, subject=None, **kwargs):
    """Send email notification to user."""
    from django.core.mail import send_mail
    from django.conf import settings
    
    try:
        send_mail(
            subject=subject or 'LinkedIn Analytics Notification',
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {user.email}")
        return {'status': 'success', 'type': 'email'}
    except Exception as e:
        logger.exception(f"Failed to send email: {str(e)}")
        return {'status': 'error', 'error': str(e)}


def send_push_notification(user, message, **kwargs):
    """Send push notification to user."""
    # TODO: Implement push notification logic
    logger.info(f"Push notification would be sent to user {user.id}")
    return {'status': 'success', 'type': 'push'}