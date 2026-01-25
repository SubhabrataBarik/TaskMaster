from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import TaskViewSet, SubTaskViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"subtasks", SubTaskViewSet, basename="subtasks")

urlpatterns = [
    path("", include(router.urls)),
]