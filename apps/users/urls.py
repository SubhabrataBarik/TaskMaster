# urls.py

# import path
# import auth views

# urlpatterns:
# /api/auth/register/
# /api/auth/login/
# /api/auth/token/refresh/

# include users.urls

# path("api/auth/", include("apps.users.urls"))

from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.UserView.as_view(), name ='hello'),

    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.LoginUserView.as_view(), name =''),
    # path('me/', views.MeUserView.as_view(), name =''),
    # path('logout/', views.LogoutView.as_view(), name =''),
    # path('token/refresh/', views.TokenRefreshUserView.as_view(), name =''),
]

# POST /api/auth/register/  new user front page, username password, conform password
# POST /api/auth/login/     the login page in frontend
# POST /api/auth/token/refresh/ 