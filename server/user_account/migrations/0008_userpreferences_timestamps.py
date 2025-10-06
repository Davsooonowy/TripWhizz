from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_account', '0007_userpreferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='userpreferences',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='userpreferences',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, null=True),
        ),
    ]


