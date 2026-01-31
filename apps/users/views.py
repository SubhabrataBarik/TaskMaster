from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from .serializers import UserRegistrationSerializer
from .serializers import LoginSerializer
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name="dispatch")
class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name="dispatch")
class UserLoginView(APIView):
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

class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email
        })

@method_decorator(csrf_exempt, name="dispatch")
class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required."},
                                status=status.HTTP_400_BAD_REQUEST)
            token = RefreshToken(refresh_token)
            token.blacklist()  # Add token to blacklist

            return Response({"message": "Successfully logged out."},
                            status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)


import requests
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from allauth.socialaccount.models import SocialAccount
User = get_user_model()
@method_decorator(csrf_exempt, name="dispatch")
class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # 1. Get the Google Access Token from the request
        google_access_token = request.data.get('access_token')
        
        if not google_access_token:
            return Response({'detail': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Verify the token with Google directly
        google_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            params={'access_token': google_access_token}
        )

        if not google_response.ok:
            return Response({'detail': 'Invalid Google token'}, status=status.HTTP_401_UNAUTHORIZED)

        user_info = google_response.json()
        email = user_info.get('email')
        
        if not email:
            return Response({'detail': 'Google account has no email'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Normalize email to lowercase (Crucial for matching manual signups)
        email = email.lower()

        # 4. Find or Create User
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                username=username,
                email=email,
                password=None
            )

        # 5. Link to AllAuth SocialAccount (Good practice)
        if not SocialAccount.objects.filter(user=user, provider='google').exists():
            SocialAccount.objects.create(
                user=user,
                provider='google',
                uid=user_info.get('sub'),
                extra_data=user_info
            )

        # 6. Generate JWT Tokens Manually
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username
            }
        }, status=status.HTTP_200_OK)