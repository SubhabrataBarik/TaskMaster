from rest_framework import serializers
from datetime import date
import uuid

class BreakdownTaskRequestSerializer(serializers.Serializer):
    task_id = serializers.UUIDField(required=True)

    def validate_task_id(self, value):
        if not value:
            raise serializers.ValidationError("task_id is required.")
        return value

class SubtaskSuggestionSerializer(serializers.Serializer):
    title = serializers.CharField()
    estimated_time = serializers.CharField()

class BreakdownTaskResponseSerializer(serializers.Serializer):
    subtasks = SubtaskSuggestionSerializer(many=True)
    reasoning = serializers.CharField()

class SuggestPriorityRequestSerializer(serializers.Serializer):
    task_id = serializers.UUIDField(required=True)

    def validate_task_id(self, value):
        if not value:
            raise serializers.ValidationError("task_id is required.")
        return value

class SuggestPriorityResponseSerializer(serializers.Serializer):
    suggested_priority = serializers.ChoiceField(
        choices=["low", "medium", "high"]
    )
    confidence = serializers.FloatField(min_value=0, max_value=1)
    reasoning = serializers.CharField()
