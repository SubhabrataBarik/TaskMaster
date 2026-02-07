from django.shortcuts import render
from .serializers import BreakdownTaskRequestSerializer, BreakdownTaskResponseSerializer, SuggestPriorityRequestSerializer, SuggestPriorityResponseSerializer

# class AIViewSet(APIView):
#     permission_classes = [IsAuthenticated]

#     serializer = BreakdownTaskRequestSerializer(data=request.data)
#     serializer.is_valid(raise_exception=True)

#     result = run_priority_model(serializer.validated_data)
#     return BreakdownTaskResponseSerializer(data)




# Create your views here.
# Class: AIViewSet(viewsets.ViewSet)

# permission_classes = [IsAuthenticated]  # only logged-in users

# Action 1: breakdown_task (POST)
# URL: /api/ai/breakdown-task/

# Steps inside method:
# 1. Validate request using BreakdownTaskRequestSerializer
# 2. Call analyze_task_for_breakdown(title, description)
# 3. Log input + output in InferenceLog (if you implemented it)
# 4. Return BreakdownTaskResponseSerializer(data)

# Action 2: suggest_priority (POST)
# URL: /api/ai/suggest-priority/

# Steps inside method:
# 1. Validate request using SuggestPriorityRequestSerializer
# 2. Call suggest_priority(title, description, due_date)
# 3. Log inference
# 4. Return SuggestPriorityResponseSerializer(data)
