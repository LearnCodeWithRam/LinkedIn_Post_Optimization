# config/settings.py
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment detection
ENV = os.environ.get('DJANGO_ENV', 'development')
DEBUG = ENV == 'development'

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-key-change-in-production')
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')

# Frontend URL
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'django_celery_beat',
    'django_celery_results',
    'storages',
    
    # Local apps
    'apps.core',
    'apps.accounts',
    'apps.linkedin',
    'apps.analytics',
    'apps.predictions',
    'apps.recommendations',
    'apps.reports',
    'apps.post_analyser',
    'apps.upload_excel_to_json',
    'apps.viralpost_scraping',
    'apps.post_comparison',
    'apps.new_post',
    'apps.personal_story',
]

# Add debug toolbar in development
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.core.middleware.RequestLoggingMiddleware',
]

# Add debug toolbar middleware in development
if DEBUG:
    MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
    INTERNAL_IPS = ['127.0.0.1', 'localhost']

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# =============================================================================
# DATABASE CONFIGURATION - MongoDB Only
# =============================================================================

# MongoDB Configuration - Read from environment or use local
MONGO_CONNECTION_STRING = os.environ.get('MONGO_CONNECTION_STRING', 'mongodb://localhost:27017/')
MONGO_DB_NAME = os.environ.get('MONGO_DB', 'linkedin_db')

# AWS DocumentDB SSL Certificate Path
SSL_CERT_PATH = os.path.join(BASE_DIR, 'global-bundle.pem')

# Using mongoengine as the primary database connection
# Django's default database is set to a dummy database
# DATABASE CONFIGURATION - SQLite for Django auth, MongoDB for app data
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}


# MongoEngine connection for Document models
import mongoengine

# Build the connection parameters
mongo_params = {
    'db': MONGO_DB_NAME,
    'host': MONGO_CONNECTION_STRING,
    'alias': 'default',
    'uuidRepresentation': 'standard',
    'serverSelectionTimeoutMS': 10000,
    'connectTimeoutMS': 10000,
    'socketTimeoutMS': 10000,
}

# Add SSL certificate for AWS DocumentDB if using DocumentDB connection
if 'docdb.amazonaws.com' in MONGO_CONNECTION_STRING and os.path.exists(SSL_CERT_PATH):
    mongo_params['tlsCAFile'] = SSL_CERT_PATH
    mongo_params['tls'] = True
    print(f"✓ Using SSL certificate: {SSL_CERT_PATH}")

# Add authentication if credentials are provided (for MongoDB Atlas)
if os.environ.get('MONGO_USERNAME') and os.environ.get('MONGO_PASSWORD'):
    mongo_params['username'] = os.environ.get('MONGO_USERNAME')
    mongo_params['password'] = os.environ.get('MONGO_PASSWORD')
    mongo_params['authentication_source'] = os.environ.get('MONGO_AUTH_SOURCE', 'admin')

try:
    mongoengine.connect(**mongo_params)
    if DEBUG:
        print(f"✓ MongoEngine connected successfully to database: {MONGO_DB_NAME}")
        print(f"✓ Connection string: {MONGO_CONNECTION_STRING[:50]}...")
except Exception as e:
    logging.error("✗ MongoEngine connection failed: %s", str(e))
    print(f"[ERROR] MongoEngine connection failed: {e}")
    print("[WARN] Application will continue but MongoEngine operations may fail")

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []

# Media files
if DEBUG:
    # Local storage in development
    MEDIA_ROOT = BASE_DIR / 'media'
    MEDIA_URL = '/media/'
else:
    # MinIO/S3 in production
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.environ.get('MINIO_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = os.environ.get('MINIO_SECRET_KEY')
    AWS_STORAGE_BUCKET_NAME = 'linkedin-media'
    AWS_S3_ENDPOINT_URL = os.environ.get('MINIO_ENDPOINT', 'http://localhost:9000')
    AWS_S3_REGION_NAME = 'us-east-1'
    AWS_S3_USE_SSL = not DEBUG
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = None

# =============================================================================
# CACHE CONFIGURATION
# =============================================================================

if DEBUG:
    # Use LocMemCache in development to support OTP verification
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
        }
    }
else:
    # Redis cache in production
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': os.environ.get('REDIS_URL', 'redis://localhost:6379/0'),
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'PASSWORD': os.environ.get('REDIS_PASSWORD', ''),
                'SOCKET_CONNECT_TIMEOUT': 5,
                'SOCKET_TIMEOUT': 5,
            }
        }
    }

# Cache TTL
CACHE_TTL = {
    'default': 300,
    'posts': 300,
    'analytics': 1800,
    'recommendations': 3600,
    'dashboard': 300,
}

# Session
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'  # Important for OAuth flows

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

CSRF_COOKIE_HTTPONLY = True
CSRF_USE_SESSIONS = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# =============================================================================
# CELERY CONFIGURATION
# =============================================================================

CELERY_BROKER_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_CACHE_BACKEND = 'default'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'analyze-content': {
        'task': 'apps.analytics.tasks.analyze_recent_posts',
        'schedule': timedelta(hours=12),
    },
    'generate-recommendations': {
        'task': 'apps.recommendations.tasks.generate_user_recommendations',
        'schedule': timedelta(days=1),
    },
}

# =============================================================================
# REST FRAMEWORK CONFIGURATION
# =============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'linkedin_sync': '10/hour',
    },
    'DATETIME_FORMAT': '%Y-%m-%dT%H:%M:%S%z',
    'DATE_FORMAT': '%Y-%m-%d',
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}

# Add browsable API in development
if DEBUG:
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append('rest_framework.renderers.BrowsableAPIRenderer')

# =============================================================================
# JWT CONFIGURATION
# =============================================================================

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = os.environ.get(
        'CORS_ALLOWED_ORIGINS',
        os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    ).split(',')

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# API DOCUMENTATION
# =============================================================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'LinkedIn Post Analytics API',
    'DESCRIPTION': 'AI-powered LinkedIn post performance optimization',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
}

# =============================================================================
# EXTERNAL SERVICES
# =============================================================================

# LinkedIn OAuth
LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")

# LinkedIn Sign-In (for authentication/login)
LINKEDIN_SIGNIN_REDIRECT_URI = os.getenv("LINKEDIN_SIGNIN_REDIRECT_URI")

# LinkedIn OAuth Scopes (includes OpenID Connect for sign-in)
LINKEDIN_SCOPE = ['openid', 'profile', 'email', 'w_member_social', 'r_profile_basicinfo']
LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo"

# Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_SIGNIN_REDIRECT_URI = os.getenv("GOOGLE_SIGNIN_REDIRECT_URI")
GOOGLE_SCOPE = ['openid', 'email', 'profile']
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = 'gpt-4-turbo-preview'

# Hugging Face
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HUGGINGFACE_MODEL = 'sentence-transformers/all-mpnet-base-v2'

# Qdrant
QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION_SIZE = 768

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "rmnjsaket4664@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "qdhxgcnbxaromxbz")

DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "rmnjsaket4664@gmail.com")





# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'django.log',
            'maxBytes': 1024 * 1024 * 15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'pymongo': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'djongo': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# PRINT CONFIGURATION ON STARTUP
# =============================================================================

if DEBUG:
    print("\n" + "="*70)
    print("LINKEDIN ANALYTICS API - DEVELOPMENT MODE")
    print("="*70)
    print(f"Environment: {ENV}")
    print(f"MongoDB: {MONGO_DB_NAME}")
    print(f"   Connection: {MONGO_CONNECTION_STRING[:60]}...")
    print(f"Debug Mode: {DEBUG}")
    print(f"CORS: Allow All Origins")
    print(f"Email: Console Backend")
    print(f"Cache: Dummy Cache (Development)")
    print("="*70 + "\n")