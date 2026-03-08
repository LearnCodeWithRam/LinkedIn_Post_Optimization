from .settings import *  # Import everything from settings.py

# Development-specific overrides
DEBUG = True
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True