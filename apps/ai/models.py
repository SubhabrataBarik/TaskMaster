from django.db import models
from django.conf import settings
import uuid

User = settings.AUTH_USER_MODEL

class InferenceLog(models.Model):

    ENDPOINT_CHOICES = [
        ("breakdown-task"),
        ("suggest-priority"),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    











# Create your models here.
# Create an AIModelVersion table (optional but very good practice)
# Fields to include:
# - id (UUID or AutoField)
# - model_name (e.g., "gpt-4o", "gpt-4.1", "claude-3")
# - version (string, e.g. "2025-01")
# - is_active (boolean)   # which model is currently used
# - created_at (timestamp)

# Create an InferenceLog table (very useful for production)
# Fields to include:
# - id
# - endpoint (e.g., "breakdown-task" or "suggest-priority")
# - input_payload (JSONField)   # store what user sent
# - output_payload (JSONField)  # store AI response
# - latency_ms (integer)        # how long AI took
# - created_at (timestamp)

# (Optional but nice)
# Add ForeignKey to User so you know who triggered AI
# - user = FK to AUTH_USER_MODEL (nullable if public)
