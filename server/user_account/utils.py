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