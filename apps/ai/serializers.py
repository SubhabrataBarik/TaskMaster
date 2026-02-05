from rest_framework import serializers
from datetime import date
from django.db import transaction
from .models import InferenceLog, ModelVersion
from apps.tasks.models import Task

class BreakdownTaskRequestSerializer(serializers.Serializer):

    title = serializers.CharField(
        max_length=255,
        required=True,
        trim_whitespace=True
    )

    description =serializers.CharField(
        required=False,
        allow_blank=True
    )

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError("Title cannot be empty or whitespace.")
        if len(value) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters long.")
        
        return value

class SubtaskSuggestionSerializer(serializers.Serializer):
    title = serializers.CharField()
    estimated_time = serializers.CharField()

class BreakdownTaskResponseSerializer(serializers.Serializer):
    subtasks = SubtaskSuggestionSerializer(many=True)
    reasoning = serializers.CharField()

class SuggestPriorityRequestSerializer(serializers.Serializer):
    title = serializers.CharField(
        max_length=255,
        required=True,
        trim_whitespace=True
    )

    description =serializers.CharField(
        required=False,
        allow_blank=True
    )

    due_date = serializers.DateField(required=False)

    def validate_due_date(self, value):
        if value and value< date.today():
            raise serializers.ValidationError("due date cannot be in the past")
        return value

class SuggestPriorityResponseSerializer(serializers.Serializer):
    suggested_priority = serializers.ChoiceField(
        choices=["low", "medium", "high"]
    )
    confidence = serializers.FloatField(min_value=0, max_value=1)
    reasoning = serializers.CharField()
