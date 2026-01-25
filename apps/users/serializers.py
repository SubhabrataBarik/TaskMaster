from rest_framework import serializers
# from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

User = get_user_model()

# class UserRegistrationSerializer(serializers.ModelSerializer):
#     password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

#     class Meta:
#         model = User
#         fields = ['email', 'username', 'password', 'password2']
#         extra_kwargs = {
#             'password': {'write_only': True}
#         }

#     def validate_email(self, value):
#         return value.lower()

#     def validate(self, attrs):
#         if attrs['password'] != attrs['password2']:
#             raise serializers.ValidationError({"password": "Password fields didn't match."})
#         email = attrs.get('email')
#         if User.objects.filter(email__iexact=email).exists():
#             raise serializers.ValidationError({"email": "Email already exists."})
#         return attrs

#     def create(self, validated_data):
#         validated_data.pop('password2')
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data['email'],
#             password=validated_data['password']
#         )
#         return user
    
# class LoginSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField(write_only=True)

#     def validate(self, data):
#         email = data.get("email")
#         password = data.get("password")
#         try:
#             user_obj = User.objects.get(email=email)
#         except User.DoesNotExist:
#             raise serializers.ValidationError("Invalid credentials")
#         user = authenticate(email=email, password=password)
#         if not user:
#             raise serializers.ValidationError("Invalid credentials")
#         data["user"] = user
#         return data

# class UserRegistrationSerializer(serializers.ModelSerializer):
#     password2 = serializers.CharField(write_only=True)

#     class Meta:
#         model = User
#         fields = ["email", "password", "password2"]
#         extra_kwargs = {
#             "password": {"write_only": True}
#         }

#     def validate_email(self, value):
#         return value.lower()

#     def validate(self, attrs):
#         if attrs["password"] != attrs["password2"]:
#             raise serializers.ValidationError("Passwords do not match")

#         if User.objects.filter(email__iexact=attrs["email"]).exists():
#             raise serializers.ValidationError("Email already exists")

#         return attrs

#     def create(self, validated_data):
#         validated_data.pop("password2")
#         user = User.objects.create_user(
#             email=validated_data["email"],
#             password=validated_data["password"]
#         )
#         return user

class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "username", "password", "password2"]
        extra_kwargs = {
            "password": {"write_only": True}
        }

    def validate_email(self, value):
        return value.lower()

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError("Passwords do not match")

        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError("Email already exists")

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            email=data["email"],
            password=data["password"]
        )

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        data["user"] = user
        return data

