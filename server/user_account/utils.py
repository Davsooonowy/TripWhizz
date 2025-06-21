import secrets

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings


def generate_otp():
    return ''.join(secrets.choice('0123456789') for _ in range(6))


def send_password_reset_email(user, reset_link):
    subject = 'Reset Your Password'
    context = {
        'user': user,
        'reset_link': reset_link,
    }
    message = render_to_string('password_reset_email.html', context)
    send_mail(subject, '', settings.DEFAULT_FROM_EMAIL, [user.email], html_message=message)


def send_otp_email(user, otp_code):
    subject = 'Your OTP Code'
    context = {
        'user': user,
        'otp_code': otp_code,
    }
    message = render_to_string('send_otp_email.html', context)
    send_mail(subject, '', settings.DEFAULT_FROM_EMAIL, [user.email], html_message=message)


def send_trip_invitation_email(invitation):
    subject = f'🌍 You\'re invited to join "{invitation.trip.name}" on TripWhizz!'

    participant_count = invitation.trip.participants.count() + 1  # +1 for owner

    context = {
        'trip': invitation.trip,
        'inviter': invitation.inviter,
        'invitee': invitation.invitee,
        'participant_count': participant_count,
        'app_url': settings.FRONTEND_URL,
        'invitation': invitation,
    }

    html_message = render_to_string('trip_invitation_email.html', context)

    text_message = f"""
    Hi {invitation.invitee.first_name or invitation.invitee.username}!

    {invitation.inviter.first_name or invitation.inviter.username} has invited you to join their trip "{invitation.trip.name}" to {invitation.trip.destination}.

    Open TripWhizz to view and respond to this invitation: {settings.FRONTEND_URL}

    This invitation will expire in 7 days.

    Happy travels!
    The TripWhizz Team
    """

    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[invitation.invitee.email],
        html_message=html_message,
        fail_silently=False,
    )
