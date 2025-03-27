from django.contrib.auth.models import AbstractUser
from django.db import models


class Profile(AbstractUser):
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    onboarding_complete = models.BooleanField(default=False)

    def __str__(self):
        return self.username
