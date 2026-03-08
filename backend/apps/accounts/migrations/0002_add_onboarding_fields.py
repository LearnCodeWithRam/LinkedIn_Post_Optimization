# Generated manually for onboarding tracking fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='onboarding_completed',
            field=models.BooleanField(default=False, help_text='Whether user has completed the onboarding flow.'),
        ),
        migrations.AddField(
            model_name='user',
            name='data_uploaded',
            field=models.BooleanField(default=False, help_text='Whether user has uploaded their LinkedIn analytics data.'),
        ),
        migrations.AddField(
            model_name='user',
            name='onboarding_completed_at',
            field=models.DateTimeField(blank=True, help_text='Timestamp when onboarding was completed.', null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='data_uploaded_at',
            field=models.DateTimeField(blank=True, help_text='Timestamp when data was first uploaded.', null=True),
        ),
    ]
