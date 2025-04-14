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
