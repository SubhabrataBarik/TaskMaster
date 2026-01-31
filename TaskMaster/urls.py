# TaskMaster/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt import views as jwt_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # OAuth
    # path('accounts/', include('allauth.urls')),

    # apps
    path("api/auth/", include("apps.users.urls")),
    path("api/", include("apps.tasks.urls")),
]


# http://localhost:8080
# http://127.0.0.1:8000/accounts/google/login/callback/