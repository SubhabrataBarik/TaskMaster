# managers.py

# import BaseUserManager

# create UserManager class

# define create_user(email, password)
# - normalize email
# - check email exists
# - set password using set_password()
# - save user

# define create_superuser(email, password)
# - call create_user
# - set is_staff = True
# - set is_superuser = True
from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(email, password, **extra_fields)