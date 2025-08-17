from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('trip', '0009_documentcategory_document_documentcomment'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Expense',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(max_length=255)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('currency', models.CharField(default='PLN', max_length=10)),
                ('split_method', models.CharField(choices=[('equal', 'Equal'), ('percentage', 'Percentage'), ('exact', 'Exact Amounts'), ('shares', 'Shares')], default='equal', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('paid_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='paid_expenses', to=settings.AUTH_USER_MODEL)),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expenses', to='trip.trip')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Settlement',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('currency', models.CharField(default='PLN', max_length=10)),
                ('note', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('payee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_settlements', to=settings.AUTH_USER_MODEL)),
                ('payer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='made_settlements', to=settings.AUTH_USER_MODEL)),
                ('trip', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='settlements', to='trip.trip')),
            ],
        ),
        migrations.CreateModel(
            name='ExpenseShare',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('shares_count', models.PositiveIntegerField(blank=True, null=True)),
                ('owed_amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('expense', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shares', to='trip.expense')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='expense_shares', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('expense', 'user')},
            },
        ),
    ]


