from celery import shared_task
from django.utils import timezone
from .models import TripInvitation
from user_account.models import Friendship, Notification
from datetime import timedelta


@shared_task
def cleanup_expired_invitations():
    now = timezone.now()

    expired_trip_invitations = TripInvitation.objects.filter(
        status='pending',
        expires_at__lt=now
    )

    expired_count = 0
    for invitation in expired_trip_invitations:
        invitation.status = 'expired'
        invitation.save()

        # Mark related notifications as read/inactive
        Notification.objects.filter(
            notification_type='trip_invite',
            related_object_id=invitation.id,
            is_read=False
        ).update(is_read=True)

        expired_count += 1

    expired_friend_requests = Friendship.objects.filter(
        status='pending',
        expires_at__lt=now
    )

    friend_expired_count = 0
    for friendship in expired_friend_requests:
        friendship.status = 'expired'
        friendship.save()

        Notification.objects.filter(
            notification_type='friend_request',
            related_object_id=friendship.id,
            is_read=False
        ).update(is_read=True)

        friend_expired_count += 1

    return f"Expired {expired_count} trip invitations and {friend_expired_count} friend requests"


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