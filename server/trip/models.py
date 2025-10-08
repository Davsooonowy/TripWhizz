from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from datetime import timedelta

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
        ("expired", "Expired"),
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
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["trip", "invitee"]
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.expires_at and self.status == 'pending':
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def is_expired(self):
        return self.expires_at and timezone.now() > self.expires_at

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


class PackingList(models.Model):
    LIST_TYPE_CHOICES = [
        ("private", "Private"),
        ("shared", "Shared"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="packing_lists")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    list_type = models.CharField(max_length=20, choices=LIST_TYPE_CHOICES, default="private")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_packing_lists")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.list_type}) - {self.trip.name}"

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("trip", "name", "list_type")


class PackingItem(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    packing_list = models.ForeignKey(PackingList, on_delete=models.CASCADE, related_name="items")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="medium")
    quantity = models.PositiveIntegerField(default=1)
    is_packed = models.BooleanField(default=False)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_packing_items")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_packing_items")
    packed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="packed_packing_items")
    packed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} x{self.quantity}"

    class Meta:
        ordering = ["-created_at"]


class DocumentCategory(models.Model):
    """Predefined categories for documents"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=20, default="#3B82F6")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Document categories"


class Document(models.Model):
    """Trip documents that can be shared or private"""
    DOCUMENT_TYPE_CHOICES = [
        ("pdf", "PDF"),
        ("image", "Image"),
        ("text", "Text"),
        ("markdown", "Markdown"),
        ("other", "Other"),
    ]

    VISIBILITY_CHOICES = [
        ("private", "Private"),
        ("shared", "Shared"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to="trip_documents/")
    file_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    file_size = models.PositiveIntegerField(help_text="File size in bytes")
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default="shared")
    category = models.ForeignKey(DocumentCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name="documents")
    custom_tags = models.JSONField(default=list, blank=True, help_text="Custom tags like 'Day 1', 'Visa', 'Food'")
    
    # Metadata
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="uploaded_documents")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Auto-cleanup
    auto_delete_after_trip = models.BooleanField(default=False, help_text="Delete document X days after trip ends")
    delete_days_after_trip = models.PositiveIntegerField(default=30, help_text="Days after trip end to delete document")

    def __str__(self):
        return f"{self.title} - {self.trip.name}"

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_image(self):
        return self.file_type == "image"

    @property
    def is_pdf(self):
        return self.file_type == "pdf"

    @property
    def is_text_based(self):
        return self.file_type in ["text", "markdown"]


class DocumentComment(models.Model):
    """Comments and notes on documents"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="document_comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.author.username} on {self.document.title}"

    class Meta:
        ordering = ["created_at"]


class Expense(models.Model):
    SPLIT_METHOD_CHOICES = [
        ("equal", "Equal"),
        ("percentage", "Percentage"),
        ("exact", "Exact Amounts"),
        ("shares", "Shares"),
    ]

    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="expenses")
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="PLN")
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="paid_expenses"
    )
    split_method = models.CharField(max_length=20, choices=SPLIT_METHOD_CHOICES, default="equal")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} ({self.amount} {self.currency}) - {self.trip.name}"

    class Meta:
        ordering = ["-created_at"]


class ExpenseShare(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="shares")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expense_shares")
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    shares_count = models.PositiveIntegerField(null=True, blank=True)
    owed_amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        unique_together = ("expense", "user")

    def __str__(self):
        return f"{self.user.username} owes {self.owed_amount} for {self.expense.description}"


class Settlement(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="settlements")
    payer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="made_settlements")
    payee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_settlements")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=10, default="PLN")
    note = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payer.username} -> {self.payee.username}: {self.amount} {self.currency} ({self.trip.name})"


class ItineraryEvent(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="itinerary_events")
    date = models.DateField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_minutes = models.PositiveIntegerField(help_text="Minutes since 00:00")
    end_minutes = models.PositiveIntegerField(help_text="Minutes since 00:00")
    color = models.CharField(max_length=20, blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_itinerary_events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_minutes"]

    def __str__(self):
        return f"{self.title} ({self.date}) - {self.trip.name}"


class TripMapPin(models.Model):
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="map_pins")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_trip_pins")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.latitude}, {self.longitude}) - {self.trip.name}"


class TripMapSettings(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name="map_settings")
    default_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    default_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    default_zoom = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"MapSettings for {self.trip.name}"