from celery import shared_task
from django.utils import timezone
from .models import TripInvitation
from user_account.models import Friendship, Notification
from datetime import timedelta

from .models import Document, Trip


@shared_task
def cleanup_expired_documents():
    """
    Clean up documents that are set to auto-delete after trip ends
    """
    now = timezone.now()
    deleted_count = 0
    
    # Find documents that should be deleted
    documents_to_delete = Document.objects.filter(
        auto_delete_after_trip=True,
        trip__end_date__lt=now - timedelta(days=1)  # Trip ended at least 1 day ago
    )
    
    for document in documents_to_delete:
        # Check if enough days have passed since trip ended
        days_since_trip_end = (now.date() - document.trip.end_date).days
        if days_since_trip_end >= document.delete_days_after_trip:
            try:
                # Delete the document file first
                if document.file:
                    document.file.delete(save=False)
                # Delete the document record
                document.delete()
                deleted_count += 1
            except Exception as e:
                print(f"Error deleting document {document.id}: {e}")
    
    print(f"Cleaned up {deleted_count} expired documents")
    return deleted_count


@shared_task
def cleanup_expired_trip_invitations():
    """
    Clean up expired trip invitations
    """
    now = timezone.now()
    
    # Find expired invitations
    expired_invitations = TripInvitation.objects.filter(
        status='pending',
        expires_at__lt=now
    )
    
    # Update status to expired
    expired_count = expired_invitations.update(status='expired')
    
    print(f"Marked {expired_count} trip invitations as expired")
    return expired_count


@shared_task
def send_invitation_reminder():

    tomorrow = timezone.now() + timedelta(hours=24)
    expiring_soon = timezone.now() + timedelta(hours=25)

    expiring_invitations = TripInvitation.objects.filter(
        status='pending',
        expires_at__gte=tomorrow,
        expires_at__lt=expiring_soon
    )

    notification_count = 0

    for invitation in expiring_invitations:
        try:
            Notification.objects.create(
                recipient=invitation.invitee,
                sender=invitation.inviter,
                notification_type='trip_invite_reminder',
                title='Trip Invitation Reminder',
                message=f'Reminder: Your invitation to join "{invitation.trip.name}" is expiring soon.',
                related_object_id=invitation.id
            )
            notification_count += 1
        except Exception as e:
            print(f"Failed to send reminder for invitation {invitation.id}: {e}")

    return f"created {notification_count} notifications"