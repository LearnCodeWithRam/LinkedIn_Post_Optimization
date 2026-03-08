from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import UserPreference

User = get_user_model()


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    search_fields = ('username', 'email')


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_notifications', 'report_frequency')
