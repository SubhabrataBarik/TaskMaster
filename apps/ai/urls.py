# Create DefaultRouter()
# Register AIViewSet with basename="ai"

# Add custom routes:
# POST /api/ai/breakdown-task/
# POST /api/ai/suggest-priority/

# users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # path('ai/breakdown-task', views.BreakdownTaskView.as_view(), name='breakdown'),
    # path('ai/suggest-priority', views.SuggestPriorityView.as_view(), name ='Suggest'),
]
