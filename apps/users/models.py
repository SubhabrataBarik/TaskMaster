from django.db import models

# Create your models here.
# models.py

# import django base user model tools

# create CustomUser model instead of default Django User

# fields needed:
# - id (UUID primary key)
# - email (unique, used as login)
# - password (hashed automatically by Django)
# - is_active (true/false)
# - is_staff (admin access)
# - is_superuser
# - created_at
# - updated_at

# IMPORTANT:
# - username is NOT needed
# - email will be used as USERNAME_FIELD

# use AbstractBaseUser + PermissionsMixin

# attach custom UserManager (defined in managers.py)

# set:
# USERNAME_FIELD = "email"
# REQUIRED_FIELDS = []

# create __str__ to return email
