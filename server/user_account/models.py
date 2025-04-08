import uuid
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Profile(AbstractUser):
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
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
