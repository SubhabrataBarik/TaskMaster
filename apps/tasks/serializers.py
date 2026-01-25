# serializers.py

# Imports:
from rest_framework import serializers
from django.db import transaction
from .models import Task, Tag, SubTask

# TagSerializer (used for write/read)
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color"]

# SubTaskSerializer (nested)
class SubTaskSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)

    class Meta:
        model = SubTask
        fields = [
            "id",
            "title",
            "status",
            "order_index",
            "completed_at",
        ]

# TaskSerializer (read)
class TaskSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(read_only=True)
    tags = TagSerializer(many=True, read_only=True, source="tags.all")
    subtasks = SubTaskSerializer(many=True, read_only=True)
    owner = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "due_time",
            "tags",
            "subtasks",
            "created_at",
            "updated_at",
            "owner",
        ]

# TaskCreateUpdateSerializer (write)
class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    
    subtasks = SubTaskSerializer(many=True, required=False)

    class Meta:
        model = Task
        fields = [
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "due_time",
            "tags",
            "subtasks",
        ]

    def validate_tags(self, value):
        if len(value) > 20:
            raise serializers.ValidationError("Too many tags.")
        return value
    
    def create(self, validated_data):
        # request = self.context.get("request")
        tags_data = validated_data.pop("tags", [])
        subtasks_data = validated_data.pop("subtasks", [])

        with transaction.atomic():
            task = Task.objects.create(**validated_data)

            # tags
            for tag_name in tags_data:
                tag_name = tag_name.strip().lower()
                tag, _ = Tag.objects.get_or_create(
                    user=task.user,
                    name=tag_name
                )
                task.tags.add(tag)

            # subtasks
            for index, subtask in enumerate(subtasks_data):
                SubTask.objects.create(
                    parent_task=task,
                    order_index=index,
                    **subtask
                )

        return task

    
    def update(self, instance, validated_data):
        tags_data = validated_data.pop("tags", None)
        subtasks_data = validated_data.pop("subtasks", None)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)

            instance.save()

            if tags_data is not None:
                instance.tags.clear()
                for tag_name in tags_data:
                    tag, _ = Tag.objects.get_or_create(
                        user=instance.user,
                        name=tag_name.strip().lower()
                    )
                    instance.tags.add(tag)

        return instance


