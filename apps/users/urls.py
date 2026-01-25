from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name ='login'),
    path('me/', views.UserMeView.as_view(), name ='me'),
    path('logout/', views.UserLogoutView.as_view(), name ='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('google/', views.GoogleLoginView.as_view(), name ='google_login'),
]
