import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)

def generate_otp(length=6):
    """Generate a numeric OTP of given length."""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email):
    """
    Generate an OTP, save it to the cache, and send it via email.
    """
    otp = generate_otp()
    # Cache key format: "otp:email_address"
    cache_key = f"otp:{email}"
    
    # Store in cache for 15 minutes (900 seconds)
    cache.set(cache_key, otp, timeout=900)
    
    # Send email
    subject = 'Verify your email address'
    message = f'Your verification code is: {otp}\n\nThis code will expire in 15 minutes.'
    from_email = settings.DEFAULT_FROM_EMAIL
    
    try:
        send_mail(subject, message, from_email, [email])
        logger.info(f"OTP sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP to {email}: {str(e)}")
        return False

def verify_otp(email, otp):
    """
    Verify the provided OTP for the given email.
    """
    cache_key = f"otp:{email}"
    cached_otp = cache.get(cache_key)
    
    if cached_otp and cached_otp == otp:
        # Optional: Delete OTP after successful verification to prevent reuse
        # cache.delete(cache_key)
        return True
    return False
