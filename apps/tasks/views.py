from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from apps.ai.models import InferenceLog
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
            .prefetch_related(
                "subtasks",
                "tags"
            )
            .only(
                "id", "title", "description", "priority",
                "status", "due_date", "created_at"
            )
        )


    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TaskCreateUpdateSerializer
        return TaskSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        self.perform_create(serializer)

        read_serializer = TaskSerializer(
            serializer.instance,
            context={"request": request}
        )

        headers = self.get_success_headers(read_serializer.data)
        return Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
    
        serializer = self.get_serializer(
            instance,
            data=request.data,
            partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
    
        read_serializer = TaskSerializer(
            serializer.instance,
            context={"request": request}
        )
    
        return Response(read_serializer.data)

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

    @action(detail=True, methods=["post"], url_path="subtasks/bulk-create")
    def subtasks_bulk_create(self, request, pk=None):
        task = self.get_object()
        
        latest_log = (
            InferenceLog.objects
            .filter(
                task=task,
                endpoint="breakdown_task"
            )
            .order_by("-created_at")
            .first()
        )

        if not latest_log:
            return Response(
                {"detail": "No AI breakdown found for this task."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ai_output = latest_log.output
        subtasks = ai_output.get("subtasks", [])

        if not isinstance(subtasks, list) or not subtasks:
            return Response(
                {"detail": "AI breakdown contained no valid subtasks."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        with transaction.atomic():
            for index, st in enumerate(subtasks):
                serializer = SubTaskSerializer(
                    data={
                        "title": st.get("title"),
                        "estimated_hours": st.get("estimated_time")
                        or st.get("estimated_hours"),
                        "order_index": index,
                    }
                )
                serializer.is_valid(raise_exception=True)
                serializer.save(parent_task=task)
                created.append(serializer.data)
                
        latest_log.user_accepted = True
        latest_log.save(update_fields=["user_accepted"])

        return Response(created, status=status.HTTP_201_CREATED)


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

    def perform_update(self, serializer):
        instance = serializer.instance
        new_status = self.request.data.get("status")
    
        if new_status == "completed" and instance.completed_at is None:
            serializer.save(completed_at=timezone.now())
        elif new_status == "pending":
            serializer.save(completed_at=None)
        else:
            serializer.save()

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

