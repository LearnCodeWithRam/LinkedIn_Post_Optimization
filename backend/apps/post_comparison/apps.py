from django.apps import AppConfig


class PostComparisonConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.post_comparison'
    verbose_name = 'LinkedIn Post Comparison'
    
    def ready(self):
        """Import signals when app is ready."""
        # Import signals here if you create any
        pass