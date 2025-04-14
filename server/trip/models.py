from django.db import models
from django.conf import settings


class Trip(models.Model):
    TRIP_TYPE_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
    ]

    INVITE_PERMISSION_CHOICES = [
        ('admin-only', 'Admin Only'),
        ('members-can-invite', 'Members Can Invite'),
    ]

    name = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    trip_type = models.CharField(choices=TRIP_TYPE_CHOICES, default='private')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    icon_color = models.CharField(max_length=50, blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trips'
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='participating_trips',
        blank=True
    )
    tags = models.JSONField(default=list, blank=True)
    invite_permission = models.CharField(
        max_length=50,
        choices=INVITE_PERMISSION_CHOICES,
        default='admin-only'
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-created_at']


class Stage(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    trip = models.ForeignKey(
        Trip,
        on_delete=models.CASCADE,
        related_name='stages'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_custom_category = models.BooleanField(default=False)
    custom_category_color = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.trip.name}"

    class Meta:
        ordering = ['trip', 'order']
