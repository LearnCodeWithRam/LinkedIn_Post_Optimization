# apps/linkedin/apps.py
from django.apps import AppConfig


class LinkedinConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.linkedin'
    verbose_name = 'LinkedIn Integration'
