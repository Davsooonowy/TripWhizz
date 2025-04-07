import random

from django.core.mail import send_mail
from django.conf import settings


def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(user, otp_code):
    subject = 'Your OTP Code'
    message = f'Your verification code is {otp_code}'
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
