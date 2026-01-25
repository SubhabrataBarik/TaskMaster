from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from .models import Task, SubTask
from .serializers import (
    TaskSerializer,
    TaskCreateUpdateSerializer,
    SubTaskSerializer
)
from .filters import TaskFilter
from rest_framework.filters import OrderingFilter, SearchFilter
from .permissions import IsOwnerOrReadOnly

class TaskViewSet(viewsets.ModelViewSet):
    filter_backends = [
        DjangoFilterBackend,
        OrderingFilter,
        SearchFilter
    ]
    filterset_class = TaskFilter
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    search_fields = ["title", "description", "tags__name"]
    ordering_fields = ["due_date", "priority", "created_at"]

    def get_queryset(self):
        return (
            Task.objects
            .filter(user=self.request.user, is_active=True)
            .prefetch_related("subtasks", "tags")
        )

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TaskCreateUpdateSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = "completed"
        task.completed_at = timezone.now()
        task.save(update_fields=["status", "completed_at"])
        return Response(TaskSerializer(task, context={"request": request}).data)

    @action(detail=True, methods=["get", "post"])
    def subtasks(self, request, pk=None):
        task = self.get_object()

        if request.method == "GET":
            serializer = SubTaskSerializer(task.subtasks.all(), many=True)
            return Response(serializer.data)

        serializer = SubTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(parent_task=task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubTaskViewSet(viewsets.ModelViewSet):
    serializer_class = SubTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SubTask.objects.filter(parent_task__user=self.request.user)

    def perform_create(self, serializer):
        task_id = self.request.data.get("task_id")
        task = get_object_or_404(
            Task,
            id=task_id,
            user=self.request.user
        )

        serializer.save(parent_task=task)

    @action(detail=False, methods=["post"])
    def reorder(self, request):
        """
        Reorder subtasks (drag & drop)
        """
        data = request.data

        with transaction.atomic():
            for item in data:
                SubTask.objects.filter(
                    id=item["id"],
                    parent_task__user=request.user
                ).update(order_index=item["order_index"])

        return Response({"message": "Subtasks reordered successfully"}, status=status.HTTP_200_OK)

