import secrets
import logging
import os
import requests

from django.template.loader import render_to_string
from django.conf import settings

logger = logging.getLogger(__name__)


def generate_otp():
    return ''.join(secrets.choice('0123456789') for _ in range(6))


def send_email2(subject, html_message, to_list, text_message=None):
    api_key = os.getenv('RESEND_API_KEY')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
    if not api_key or not from_email:
        msg = 'Resend not configured: missing RESEND_API_KEY or DEFAULT_FROM_EMAIL'
        logger.error(msg)
        return

    try:
        requests.post(
            'https://api.resend.com/emails',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'from': from_email,
                'to': to_list,
                'subject': subject,
                'html': html_message,
                **({'text': text_message} if text_message else {}),
            },
            timeout=10,
        )
    except Exception as ex:
        logger.exception('Resend API failed: %s', ex)
        return


def send_password_reset_email(user, reset_link):
    subject = 'Reset Your Password'
    context = {
        'user': user,
        'reset_link': reset_link,
    }
    message = render_to_string('password_reset_email.html', context)
    send_email2(subject, message, [user.email])


def send_otp_email(user, otp_code):
    subject = 'Your OTP Code'
    context = {
        'user': user,
        'otp_code': otp_code,
    }
    message = render_to_string('send_otp_email.html', context)
    send_email2(subject, message, [user.email])


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

    send_email2(subject, html_message=html_message, to_list=[invitation.invitee.email], text_message=text_message)
