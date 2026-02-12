# app/ai/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('ai/breakdown-task/', views.BreakdownTaskView.as_view(), name='ai-breakdown-task'),
    path('ai/suggest-priority/', views.SuggestPriorityView.as_view(), name='ai-suggest-priority'),
]
