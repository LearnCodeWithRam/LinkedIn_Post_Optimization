import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class BaseModel(models.Model):
    """
    Abstract base model that provides common fields for all models.
    
    All models should inherit from this to ensure consistent
    tracking of creation and modification times, plus soft delete capability.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_('Unique identifier for this record.')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('Timestamp when this record was created.')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=_('Timestamp when this record was last updated.')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this record is active (soft delete).')
    )
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
    
    def soft_delete(self):
        """Soft delete this record by setting is_active to False."""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])
    
    def restore(self):
        """Restore a soft-deleted record."""
        self.is_active = True
        self.save(update_fields=['is_active', 'updated_at'])


class TimestampedModel(models.Model):
    """
    Abstract model that only provides timestamp fields.
    Use this for models that don't need UUID or soft delete.
    """
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=_('Timestamp when this record was created.')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=_('Timestamp when this record was last updated.')
    )
    
    class Meta:
        abstract = True
        ordering = ['-created_at']