from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.core.base_models import BaseModel
from django.contrib.auth.models import BaseUserManager
from django.core.validators import validate_email
import uuid

class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of username.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        validate_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser, BaseModel):
    """
    Custom User model that uses email as the unique identifier and 
    adds additional fields for LinkedIn integration and organization management.
    """
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        MANAGER = 'MANAGER', _('Manager')
        ANALYST = 'ANALYST', _('Analyst')
        USER = 'USER', _('User')

    username = models.CharField(
        _('username'),
        max_length=150,
        unique=True,
        null=True,
        blank=True,
        help_text=_('Optional. 150 characters or fewer. Letters, digits and @/./+/-/_ only.'),
    )
    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER,
        help_text=_('Designates the role and permissions of this user.')
    )

    # LinkedIn Integration
    linkedin_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text=_('LinkedIn user ID for OAuth integration.')
    )
    linkedin_access_token = models.CharField(
        max_length=2048,
        null=True,
        blank=True,
        help_text=_('OAuth access token from LinkedIn.')
    )
    linkedin_refresh_token = models.CharField(
        max_length=2048,
        null=True,
        blank=True,
        help_text=_('OAuth refresh token from LinkedIn.')
    )
    linkedin_token_expiry = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When the current LinkedIn access token expires.')
    )
    linkedin_profile_picture = models.URLField(
        max_length=2048,
        null=True,
        blank=True,
        help_text=_('LinkedIn profile picture URL from OAuth.')
    )

    # Google Integration
    google_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text=_('Google user ID for OAuth integration.')
    )
    google_access_token = models.CharField(
        max_length=2048,
        null=True,
        blank=True,
        help_text=_('OAuth access token from Google.')
    )
    google_refresh_token = models.CharField(
        max_length=2048,
        null=True,
        blank=True,
        help_text=_('OAuth refresh token from Google.')
    )
    google_profile_picture = models.URLField(
        max_length=2048,
        null=True,
        blank=True,
        help_text=_('Google profile picture URL from OAuth.')
    )
    
    # Organization Details
    organization_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_('LinkedIn organization ID.')
    )
    organization_name = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_('LinkedIn organization name.')
    )

    # Profile
    profile_picture = models.ImageField(
        upload_to='profile-pictures/%Y/%m/',
        null=True,
        blank=True,
        help_text=_('User profile picture.')
    )
    phone_number = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text=_('Contact phone number.')
    )
    title = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_('Professional title or position.')
    )

    # Onboarding Status
    onboarding_completed = models.BooleanField(
        default=False,
        help_text=_('Whether user has completed the onboarding flow.')
    )
    data_uploaded = models.BooleanField(
        default=False,
        help_text=_('Whether user has uploaded their LinkedIn analytics data.')
    )
    onboarding_completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Timestamp when onboarding was completed.')
    )
    data_uploaded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Timestamp when data was first uploaded.')
    )

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # email is already required by default

    class Meta:
        db_table = 'users'
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """
        Return the first_name plus the last_name, with a space in between.
        """
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name if full_name else self.email

    @property
    def is_linkedin_connected(self):
        """Check if user has connected their LinkedIn account."""
        return bool(self.linkedin_access_token and self.linkedin_id)

    @property
    def is_google_connected(self):
        """Check if user has connected their Google account."""
        return bool(self.google_access_token and self.google_id)

class UserPreference(BaseModel):
    """
    Store user preferences for notifications, reports, and application settings.
    """
    class ReportFrequency(models.TextChoices):
        DAILY = 'DAILY', _('Daily')
        WEEKLY = 'WEEKLY', _('Weekly')
        MONTHLY = 'MONTHLY', _('Monthly')
        NEVER = 'NEVER', _('Never')

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='preferences',
        help_text=_('The user these preferences belong to.')
    )
    email_notifications = models.BooleanField(
        default=True,
        help_text=_('Whether to send email notifications.')
    )
    push_notifications = models.BooleanField(
        default=True,
        help_text=_('Whether to send push notifications.')
    )
    report_frequency = models.CharField(
        max_length=20,
        choices=ReportFrequency.choices,
        default=ReportFrequency.WEEKLY,
        help_text=_('How often to send analytics reports.')
    )
    custom_report_time = models.TimeField(
        null=True,
        blank=True,
        help_text=_('Preferred time to receive reports.')
    )
    timezone = models.CharField(
        max_length=50,
        default='UTC',
        help_text=_('User timezone for reports and notifications.')
    )
    dashboard_layout = models.JSONField(
        null=True,
        blank=True,
        help_text=_('Saved dashboard widget layout preferences.')
    )

    class Meta:
        db_table = 'user_preferences'
        verbose_name = _('user preference')
        verbose_name_plural = _('user preferences')

    def __str__(self):
        return f"{self.user.email}'s preferences"