import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .managers import UserManager

class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)

    username = models.CharField(
        max_length=150,
        unique=True,
        null=True,
        blank=True
    )
    
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    avatar_url = models.URLField(max_length=500, blank=True)
    user_timezone = models.CharField(max_length=50, default="UTC")

    # OAuth
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    github_id = models.CharField(max_length=255, unique=True, null=True, blank=True)

    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    # timestamps
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    timezone = models.CharField(
    max_length=50,
    default="UTC"
    )


    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
