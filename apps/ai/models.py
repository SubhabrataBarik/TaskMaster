from django.db import models
from django.conf import settings
import uuid

User = settings.AUTH_USER_MODEL

class ModelVersion(models.Model):

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    model_name = models.CharField(
        max_length=100,
        help_text="e.g., 'priority_classifier'"
    )
    version = models.CharField(
        max_length=50,
        help_text="e.g., 'v1.2.0' or '2025-01-19'"
    )
    
    file_path = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Path to model weights (S3/local)"
    )
    config = models.JSONField(
        blank=True,
        null=True,
        help_text="Model hyperparameters"
    )

    metrics = models.JSONField(
        blank=True,
        null=True,
        help_text="e.g., {'accuracy': 0.95, 'f1_score': 0.93}"
    )

    is_active = models.BooleanField(
        default=False,
        help_text="Only one active version per model_name"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    trained_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ("model_name", "version")
        verbose_name = "Model Version"
        verbose_name_plural = "Model Versions"
        indexes = [
            models.Index(fields=["model_name", "is_active"]),
        ]

    def __str__(self):
        return f"{self.model_name}::{self.version}"





class InferenceLog(models.Model):

    ENDPOINT_CHOICES = [
    ("breakdown_task", "Breakdown Task"),
    ("suggest_priority", "Suggest Priority"),
    ]


    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    task = models.ForeignKey(
        "tasks.Task",  
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inference_logs" 
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="inference_logs"
    )

    model_version = models.ForeignKey(
        ModelVersion,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inference_logs"
    )

    endpoint = models.CharField(
        max_length=100,
        choices=ENDPOINT_CHOICES
    )

    input_text = models.TextField()

    output = models.JSONField(
        help_text="Model prediction payload"
    )

    latency_ms = models.IntegerField(
        help_text="Inference time in milliseconds"
    )

    confidence = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Confidence score between 0.0 and 1.0"
    )

    user_accepted = models.BooleanField(
        null=True,
        blank=True,
        help_text="Whether user accepted AI suggestion (for retraining)"
    )

    user_feedback = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Inference Log"
        verbose_name_plural = "Inference Logs"
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["endpoint"]),
            models.Index(fields=["model_version"]),
        ]

    def __str__(self):
        return f"InferenceLog::{self.endpoint}::{self.user_id}"