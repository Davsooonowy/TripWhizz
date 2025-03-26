from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    notification_type = models.CharField(max_length=10, choices=[('push', 'Push'), ('email', 'Email')], default='push')
    profile_visibility = models.CharField(max_length=10, choices=[('public', 'Public'), ('private', 'Private')], default='public')
    default_theme = models.CharField(max_length=10, choices=[('light', 'Light'), ('dark', 'Dark')], default='light')
    currency_preference = models.CharField(max_length=3, choices=[('usd', 'USD'), ('eur', 'EUR')], default='usd')
    trip_invitations = models.BooleanField(default=True)
    expense_updates = models.BooleanField(default=True)
    packing_list_reminders = models.BooleanField(default=True)
    voting_polls = models.BooleanField(default=True)
    onboarding_complete = models.BooleanField(default=False)

    def __str__(self):
        return self.username
