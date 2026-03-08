from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User, UserPreference

class UserModelTests(TestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': User.Role.USER
        }
        self.user = User.objects.create_user(**self.user_data)

    def test_create_user(self):
        """Test creating a new user"""
        self.assertEqual(self.user.email, self.user_data['email'])
        self.assertTrue(self.user.check_password(self.user_data['password']))
        self.assertTrue(self.user.is_active)
        self.assertFalse(self.user.is_staff)
        self.assertFalse(self.user.is_superuser)

    def test_create_superuser(self):
        """Test creating a new superuser"""
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.assertTrue(admin.is_active)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)
        self.assertEqual(admin.role, User.Role.ADMIN)

    def test_user_str(self):
        """Test the user string representation"""
        self.assertEqual(str(self.user), self.user_data['email'])

    def test_get_full_name(self):
        """Test getting user's full name"""
        expected_name = f"{self.user_data['first_name']} {self.user_data['last_name']}"
        self.assertEqual(self.user.get_full_name(), expected_name)

    def test_is_linkedin_connected(self):
        """Test the is_linkedin_connected property"""
        self.assertFalse(self.user.is_linkedin_connected)
        self.user.linkedin_access_token = 'token123'
        self.user.linkedin_id = 'linkedin123'
        self.user.save()
        self.assertTrue(self.user.is_linkedin_connected)

class UserPreferenceModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.preference = UserPreference.objects.create(user=self.user)

    def test_default_values(self):
        """Test default values for UserPreference"""
        self.assertTrue(self.preference.email_notifications)
        self.assertTrue(self.preference.push_notifications)
        self.assertEqual(self.preference.report_frequency, UserPreference.ReportFrequency.WEEKLY)
        self.assertEqual(self.preference.timezone, 'UTC')

    def test_str_representation(self):
        """Test the string representation"""
        expected = f"{self.user.email}'s preferences"
        self.assertEqual(str(self.preference), expected)

class AuthenticationTests(APITestCase):
    def setUp(self):
        self.user_data = {
            'email': 'test@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        self.user = User.objects.create_user(**self.user_data)
        self.login_url = reverse('accounts:login')

    def test_user_login(self):
        """Test user can login with valid credentials"""
        response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_user_login_invalid_credentials(self):
        """Test user cannot login with invalid credentials"""
        response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': 'wrongpass'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class UserAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpass123'
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            password='userpass123'
        )
        self.users_url = reverse('accounts:user-list')
        self.user_detail_url = reverse('accounts:user-detail', kwargs={'pk': self.user.pk})

    def test_list_users_admin(self):
        """Test admin can list all users"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # admin + user

    def test_list_users_non_admin(self):
        """Test non-admin users cannot list all users"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_own_user(self):
        """Test user can retrieve their own details"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.user_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

class UserPreferenceAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.preference = UserPreference.objects.create(user=self.user)
        self.preferences_url = reverse('accounts:user-preferences')
        self.client.force_authenticate(user=self.user)

    def test_retrieve_preferences(self):
        """Test retrieving user preferences"""
        response = self.client.get(self.preferences_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email_notifications'], True)
        self.assertEqual(response.data['timezone'], 'UTC')

    def test_update_preferences(self):
        """Test updating user preferences"""
        data = {
            'email_notifications': False,
            'timezone': 'America/New_York',
            'report_frequency': UserPreference.ReportFrequency.DAILY
        }
        response = self.client.patch(self.preferences_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.preference.refresh_from_db()
        self.assertEqual(self.preference.email_notifications, False)
        self.assertEqual(self.preference.timezone, 'America/New_York')
        self.assertEqual(self.preference.report_frequency, UserPreference.ReportFrequency.DAILY)
