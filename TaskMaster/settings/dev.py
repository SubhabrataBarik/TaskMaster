# taskmaster/settings/dev.py
from .base import *

DEBUG = True

# Local dev hosts
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# Simpler DB for quick local dev: sqlite (overrides base DATABASES if needed)
# If you want Postgres locally via docker, set DATABASE_URL in .env instead.

# Email to console for dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Convenience: allow all CORS during development (be careful)
CORS_ALLOW_ALL_ORIGINS = True

# Speed up templates reload
TEMPLATES[0]["OPTIONS"]["debug"] = True

# Celery in dev -- you may want eager mode for local testing
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
