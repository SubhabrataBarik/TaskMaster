# taskmaster/settings/prod.py
from .base import *
import os

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["yourdomain.com"])

# Database must be provided via DATABASE_URL in .env
DATABASES = {"default": env.db("DATABASE_URL")}

# Security settings
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # e.g., 30 days; tune as needed
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Static files - collected to STATIC_ROOT by collectstatic
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Celery - real broker/backends should be provided by environment
CELERY_BROKER_URL = env("REDIS_URL")
CELERY_RESULT_BACKEND = "django-db"
