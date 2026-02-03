# taskmaster/settings/prod.py
from .base import *
import environ
env = environ.Env()

DEBUG = False

default=[".onrender.com"]
CSRF_TRUSTED_ORIGINS = [
    "https://*.onrender.com",
    "https://task-master-umber-beta.vercel.app",
]

CORS_ALLOWED_ORIGINS = [
    "https://task-master-umber-beta.vercel.app",
]

ALLOWED_HOSTS = [".onrender.com",]
# DATABASES = {
#     "default": env.db("DATABASE_URL")
#     }
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("PGDATABASE"),
        "USER": env("PGUSER"),
        "PASSWORD": env("PGPASSWORD"),
        "HOST": env("PGHOST"),
        "PORT": env("PGPORT", default="5432"),
        "CONN_MAX_AGE": 0,   # CRITICAL for Render Free tier
        "OPTIONS": {
            "sslmode": "require",
        },
    }
}

LOGIN_REDIRECT_URL = "https://task-master-umber-beta.vercel.app/"
LOGOUT_REDIRECT_URL = "https://task-master-umber-beta.vercel.app/"

# Security settings
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)

# Start LOW — increase later
SECURE_HSTS_SECONDS = 0 # 60 * 60 * 24 * 30
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Static files
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Celery
CELERY_TASK_ALWAYS_EAGER = True
