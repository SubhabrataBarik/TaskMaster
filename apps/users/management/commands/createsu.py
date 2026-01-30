from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="TaskMaster",
                email="TaskMaster@gmail.com",
                password=os.getenv("ADMIN_PASSWORD", "admin123")
            )
            print("Superuser created")
        else:
            print("Superuser already exists")
