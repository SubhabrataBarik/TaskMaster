from django.contrib import admin
from django.utils.html import format_html
from .models import ModelVersion, InferenceLog


# ----------------------------
# ModelVersion Admin
# ----------------------------

@admin.register(ModelVersion)
class ModelVersionAdmin(admin.ModelAdmin):
    list_display = (
        "model_name",
        "version",
        "is_active",
        "trained_at",
        "created_at",
    )

    list_filter = (
        "model_name",
        "is_active",
        "created_at",
    )

    search_fields = (
        "model_name",
        "version",
    )

    ordering = ("-created_at",)

    list_per_page = 25

    readonly_fields = ("created_at",)

    fieldsets = (
        ("Basic Info", {
            "fields": ("model_name", "version", "is_active")
        }),
        ("Files & Config", {
            "fields": ("file_path", "config")
        }),
        ("Metrics", {
            "fields": ("metrics",)
        }),
        ("Timestamps", {
            "fields": ("trained_at", "created_at")
        }),
    )


# ----------------------------
# InferenceLog Admin
# ----------------------------

@admin.register(InferenceLog)
class InferenceLogAdmin(admin.ModelAdmin):
    list_display = (
        "endpoint",
        "user",
        "task",
        "model_version",
        "latency_ms",
        "confidence",
        "user_accepted",
        "created_at",
    )

    list_filter = (
        "endpoint",
        "user_accepted",
        "model_version",
        "created_at",
    )

    search_fields = (
        "user__email",
        "user__username",
        "endpoint",
    )

    ordering = ("-created_at",)

    list_per_page = 25

    readonly_fields = ("created_at",)

    autocomplete_fields = (
        "user",
        "task",
        "model_version",
    )

    fieldsets = (
        ("Request Info", {
            "fields": ("endpoint", "user", "task", "model_version")
        }),
        ("Model IO", {
            "fields": ("input_text", "output")
        }),
        ("Metrics", {
            "fields": ("latency_ms", "confidence")
        }),
        ("User Feedback", {
            "fields": ("user_accepted", "user_feedback")
        }),
        ("Timestamp", {
            "fields": ("created_at",)
        }),
    )
