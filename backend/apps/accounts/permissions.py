from rest_framework import permissions
from apps.accounts.models import User

class IsAdmin(permissions.BasePermission):
    """
    Permission check for admin users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.Role.ADMIN

class IsManager(permissions.BasePermission):
    """
    Permission check for manager users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.Role.ADMIN,
            User.Role.MANAGER
        ]

class IsAnalyst(permissions.BasePermission):
    """
    Permission check for analyst users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            User.Role.ADMIN,
            User.Role.MANAGER,
            User.Role.ANALYST
        ]

class IsOwner(permissions.BasePermission):
    """
    Permission check for object ownership.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the object has a user attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Check if the object is a user
        if isinstance(obj, User):
            return obj == request.user
        return False
