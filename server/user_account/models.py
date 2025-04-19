import uuid
from datetime import timedelta
import os

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


def avatar_upload_path(instance, filename):
    """
    Custom function to determine the upload path for avatar images.
    Uses the user's email as the filename.
    """
    # Get file extension
    ext = filename.split('.')[-1]
    sanitized_email = instance.email.replace('@', '_at_').replace('.', '_dot_')
    return os.path.join('media', f"{sanitized_email}.{ext}")


class Profile(AbstractUser):
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    onboarding_complete = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class PendingUser(models.Model):
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    otp = models.CharField(max_length=6)
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
    ]

    sender = models.ForeignKey(Profile, related_name='sent_friendships', on_delete=models.CASCADE)
    receiver = models.ForeignKey(Profile, related_name='received_friendships', on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        ('trip_invite', 'Trip Invitation'),
        ('trip_update', 'Trip Update'),
        ('expense_update', 'Expense Update'),
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
