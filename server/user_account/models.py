import uuid
from datetime import timedelta
from utils.upload_paths import upload_path

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Profile(AbstractUser):
    avatar = models.ImageField(upload_to=upload_path, blank=True, null=True)
    onboarding_complete = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    # Legacy columns password/otp kept in DB for existing migrations; avoid using them.
    password = models.CharField(max_length=128, blank=True, default="")
    otp = models.CharField(max_length=6, blank=True, default="")
    session_token = models.UUIDField(default=uuid.uuid4)


class OTP(models.Model):
    user = models.OneToOneField(Profile, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.user.email} - {self.code}"


class Friendship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    sender = models.ForeignKey(Profile, related_name='sent_friendships', on_delete=models.CASCADE)
    receiver = models.ForeignKey(Profile, related_name='received_friendships', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def save(self, *args, **kwargs):
        if not self.expires_at and self.status == 'pending':
            self.expires_at = timezone.now() + timedelta(days=15)
        super().save(*args, **kwargs)

    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        ('trip_invite', 'Trip Invitation'),
        ('trip_update', 'Trip Update'),
        ('expense_update', 'Expense Update'),
        ('document_added', 'Document Added'),
        ('packing_added', 'Packing Item Added'),
    ]

    recipient = models.ForeignKey(Profile, related_name='notifications', on_delete=models.CASCADE)
    sender = models.ForeignKey(Profile, related_name='sent_notifications', on_delete=models.CASCADE, null=True,
                               blank=True)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=100)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_object_id = models.IntegerField(null=True,
                                            blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username} from {self.sender.username if self.sender else 'System'}"


class UserPreferences(models.Model):
    user = models.OneToOneField(Profile, related_name="preferences", on_delete=models.CASCADE)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"
