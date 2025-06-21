from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Trip(models.Model):
    TRIP_TYPE_CHOICES = [
        ("private", "Private"),
        ("public", "Public"),
    ]

    INVITE_PERMISSION_CHOICES = [
        ("admin-only", "Admin Only"),
        ("members-can-invite", "Members Can Invite"),
    ]

    name = models.CharField(max_length=255)
    destination = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    trip_type = models.CharField(choices=TRIP_TYPE_CHOICES, default="private")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    icon_color = models.CharField(max_length=50, blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trips"
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="participating_trips", blank=True
    )
    tags = models.JSONField(default=list, blank=True)
    invite_permission = models.CharField(
        max_length=50, choices=INVITE_PERMISSION_CHOICES, default="admin-only"
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-created_at"]


class TripInvitation(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="invitations")
    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_trip_invitations"
    )
    invitee = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_trip_invitations"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["trip", "invitee"]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.inviter.username} invited {self.invitee.username} to {self.trip.name}"


class Stage(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="stages")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_custom_category = models.BooleanField(default=False)
    custom_category_color = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.trip.name}"

    class Meta:
        ordering = ["trip", "order"]


class StageElement(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    # image = models.ImageField(upload_to=upload_path, blank=True, null=True)
    averageReaction = models.FloatField(blank=True, null=True)

    stage = models.ForeignKey(Stage, on_delete=models.CASCADE, related_name="elements")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    user_reactions = models.ManyToManyField(
        User,
        through="StageElementReaction",
        related_name="stage_element_reactions",
        blank=True,
    )

    def __str__(self):
        return f"{self.name} - {self.stage.name}"

    class Meta:
        ordering = ["-created_at"]


class StageElementReaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    stage_element = models.ForeignKey(StageElement, on_delete=models.CASCADE)
    reaction = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    created_at = models.DateTimeField(auto_now_add=True)
