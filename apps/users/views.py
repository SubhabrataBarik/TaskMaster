from django.shortcuts import render

# Create your views here.
# RegisterAPIView

# POST /api/auth/register/

# steps:
# 1. receive request data
# 2. pass data to RegisterSerializer
# 3. serializer validates input
# 4. create user
# 5. generate JWT tokens for user
# 6. return:
#    {
#      user,
#      access_token,
#      refresh_token
#    }
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer
from .serializers import LoginSerializer


class UserView(APIView):
    permission_classes = (IsAuthenticated, )

    def get(self, request):
        content = {'message': 'Hello, GeeksforGeeks'}
        return Response(content)
    


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
              "message": "User registered successfully"
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        })


# class viewsTokenRefreshUserView(APIView):
#     permission_classes = (IsAuthenticated, )

# class MeUserView(APIView):
#     permission_classes = (IsAuthenticated, )

# class LogoutView(APIView):
#     permission_classes = (IsAuthenticated, )
