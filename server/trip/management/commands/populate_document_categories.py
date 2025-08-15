from django.core.management.base import BaseCommand
from trip.models import DocumentCategory


class Command(BaseCommand):
    help = 'Populate default document categories'

    def handle(self, *args, **options):
        categories = [
            {
                'name': 'Tickets & Reservations',
                'description': 'Boarding passes, train tickets, hotel confirmations',
                'icon': 'ticket',
                'color': '#10B981',
                'is_default': True,
            },
            {
                'name': 'Trip Plans & Guides',
                'description': 'Itineraries, maps, travel tips',
                'icon': 'map',
                'color': '#3B82F6',
                'is_default': True,
            },
            {
                'name': 'Group Documents',
                'description': 'Shared notes, rules, agreements',
                'icon': 'users',
                'color': '#8B5CF6',
                'is_default': True,
            },
            {
                'name': 'Packing & Checklists',
                'description': 'Packing lists and checklists',
                'icon': 'check-square',
                'color': '#F59E0B',
                'is_default': True,
            },
            {
                'name': 'Visa & Documents',
                'description': 'Visa applications, passports, travel documents',
                'icon': 'file-text',
                'color': '#EF4444',
                'is_default': True,
            },
            {
                'name': 'Food & Dining',
                'description': 'Restaurant recommendations, food guides',
                'icon': 'utensils',
                'color': '#EC4899',
                'is_default': True,
            },
        ]

        created_count = 0
        for category_data in categories:
            category, created = DocumentCategory.objects.get_or_create(
                name=category_data['name'],
                defaults=category_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Category already exists: {category.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully processed {len(categories)} categories. Created: {created_count}')
        )
