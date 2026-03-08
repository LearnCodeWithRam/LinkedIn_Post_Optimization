"""
Personal Story URL Configuration
"""
from django.urls import path
from .views import get_choices, personal_story, delete_personal_story

urlpatterns = [
    path('choices/', get_choices, name='personal-story-choices'),
    path('', personal_story, name='personal-story'),
    path('delete/', delete_personal_story, name='delete-personal-story'),
]
