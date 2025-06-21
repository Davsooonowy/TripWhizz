import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tripwhizz.settings')

app = Celery('tripwhizz')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

app.conf.beat_schedule = {
    'cleanup-expired-invitations': {
        'task': 'trip.tasks.cleanup_expired_invitations',
        'schedule': 1800.0,
    },
    'send-invitation-reminders': {
        'task': 'trip.tasks.send_invitation_reminder',
        'schedule': 3600.0 * 6,
    },
}

app.conf.timezone = 'UTC'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
