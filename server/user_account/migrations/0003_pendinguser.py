# Generated by Django 5.1.7 on 2025-04-04 09:55

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_account', '0002_otp'),
    ]

    operations = [
        migrations.CreateModel(
            name='PendingUser',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('password', models.CharField(max_length=128)),
                ('otp', models.CharField(max_length=6)),
                ('session_token', models.UUIDField(default=uuid.uuid4)),
            ],
        ),
    ]
