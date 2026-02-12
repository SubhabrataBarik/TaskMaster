from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
import time

from .models import InferenceLog
from apps.tasks.models import Task
from .serializers import (
    BreakdownTaskRequestSerializer,
    BreakdownTaskResponseSerializer,
    SuggestPriorityRequestSerializer,
    SuggestPriorityResponseSerializer,
)
from .services.ai_engine import analyze_task_for_breakdown, suggest_priority


class BreakdownTaskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BreakdownTaskRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        task = get_object_or_404(
            Task,
            id=data["task_id"],
            user=request.user,
            is_active=True
        )
        
        start = time.time()
        result = analyze_task_for_breakdown(
            title=task.title,
            description=task.description or ""
        )

        if "_error" in result:
            return Response(
                {"detail": "AI service temporarily unavailable"},
                status=503
            )
        
        latency_ms = int((time.time() - start) * 1000)
        InferenceLog.objects.create(
            task=task,
            user=request.user,
            endpoint="breakdown_task",
            input_text=f"{task.title}\n{task.description or ''}",
            output=result,
            latency_ms=latency_ms,
            confidence=None
        )

        response_serializer = BreakdownTaskResponseSerializer(result)
        return Response(response_serializer.data, status=200)


class SuggestPriorityView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SuggestPriorityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        task = get_object_or_404(
            Task,
            id=data["task_id"],
            user=request.user,
            is_active=True
        )

        result = suggest_priority(
            title=task.title,
            description=task.description or "",
            due_date=task.due_date
        )

        if "_error" in result:
            return Response(
                {"detail": "AI service temporarily unavailable"},
                status=503
            )

        response_serializer = SuggestPriorityResponseSerializer(result)
        return Response(response_serializer.data, status=200)
