import json
import os

import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.http import JsonResponse
from django.template.loader import render_to_string
from django.utils.crypto import get_random_string
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PendingUser, Profile
from .serializers import UserSerializer, LoginSerializer, GoogleAuthResponseSerializer
from .utils import generate_otp, send_otp_email

User = get_user_model()


class LoginView(APIView):
    @swagger_auto_schema(
        request_body=LoginSerializer,
        responses={200: openapi.Response("Token generated successfully")},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=user.username, password=password)
        if user is None:
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
            )

        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key}, status=status.HTTP_200_OK)


class AddUserView(APIView):
    @swagger_auto_schema(
        request_body=UserSerializer,
        responses={201: openapi.Response("User created successfully")},
    )
    def post(self, request):
        data = json.loads(request.body)
        email = data.get("email")
        password = data.get("password")

        if User.objects.filter(email=email).exists():
            return Response({"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = generate_otp()
        pending_user, created = PendingUser.objects.get_or_create(email=email)
        pending_user.password = password
        pending_user.otp = otp_code
        pending_user.save()

        send_otp_email(pending_user, otp_code)

        return Response({
            "message": "OTP sent. Please verify.",
            "email": str(pending_user.email)
        })


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=UserSerializer,
        responses={200: openapi.Response("User updated successfully")},
    )
    def put(self, request, user_id=None):
        user = request.user if user_id is None else User.objects.get(id=user_id)

        data = request.data.copy()

        serializer = UserSerializer(user, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return JsonResponse({"message": "User deleted successfully"}, status=200)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordResetView(APIView):
    @swagger_auto_schema(
        request_body=LoginSerializer,
        responses={200: openapi.Response("Password reset successfully")},
    )
    def post(self, request, uidb64=None, token=None):
        if uidb64 and token:
            return self.confirm_reset(request, uidb64, token)
        return self.request_reset(request)

    def request_reset(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            try:
                user = User.objects.get(email=email)
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
                message = render_to_string(
                    "password_reset_email.html",
                    {
                        "user": user,
                        "reset_link": reset_link,
                    },
                )
                send_mail(
                    "Password Reset Request",
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [user.email],
                    fail_silently=False,
                )
                return Response(
                    {"message": "Password reset link sent successfully"},
                    status=status.HTTP_200_OK,
                )
            except User.DoesNotExist:
                return Response(
                    {"error": "User with this email does not exist"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def confirm_reset(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            if default_token_generator.check_token(user, token):
                serializer = LoginSerializer(data=request.data)
                if serializer.is_valid():
                    user.set_password(serializer.validated_data["new_password"])
                    user.save()
                    return Response(
                        {"message": "Password reset successfully"},
                        status=status.HTTP_200_OK,
                    )
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class GoogleAuthView(GenericAPIView):
    def post(self, request):
        try:
            access_token = request.data.get('token')
            if not access_token:
                return Response(
                    {"status": "error", "message": "Token is required", "payload": {}},
                    status=status.HTTP_400_BAD_REQUEST
                )

            response = requests.get(
                os.getenv('GOOGLE_RESPONSE_URL'),
                headers={'Authorization': f'Bearer {access_token}'}
            )
            response_data = response.json()

            if 'error' in response_data:
                return Response({
                    "status": "error",
                    "message": "Wrong google token / this google token is already expired.",
                    "payload": {}
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception:
            return Response({
                "status": "error",
                "message": "Unexpected error occurred, contact support for more info",
                "payload": {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        google_response_serializer = GoogleAuthResponseSerializer(data=response_data)
        if google_response_serializer.is_valid() is False:
            return Response({
                "status": "error",
                "message": "Unexpected error occurred, contact support for more info",
                "payload": {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        validated_data = google_response_serializer.validated_data
        email = validated_data['email'].lower()
        given_name = validated_data["given_name"]
        family_name = validated_data.get("family_name", "")

        with transaction.atomic():
            user = User.objects.filter(email=email).first()
            if user is None:
                username = email
                password = get_random_string(12)
                user = User.objects.create_user(
                    username=username, password=password, email=email, first_name=given_name, last_name=family_name
                )

        token, created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key}, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    def post(self, request):
        email = request.data.get("email")
        otp = request.data.get("code")

        try:
            pending_user = PendingUser.objects.get(email=email)
        except PendingUser.DoesNotExist:
            return Response({"error": "Invalid session"}, status=404)

        if pending_user.otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)

        user = Profile.objects.create_user(
            username=pending_user.email,
            email=pending_user.email,
            password=pending_user.password
        )

        token, _ = Token.objects.get_or_create(user=user)
        pending_user.delete()

        return Response({
            "message": "User created successfully!",
            "token": token.key,
            "user_id": user.id,
            "onboarding_complete": user.onboarding_complete,
        },
            status=status.HTTP_201_CREATED,
        )


class ResendOtpView(APIView):
    def post(self, request):
        email = request.data.get("email")

        try:
            pending_user = PendingUser.objects.get(email=email)
        except PendingUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        otp_code = generate_otp()
        pending_user.otp = otp_code
        pending_user.save()

        send_otp_email(pending_user, otp_code)

        return Response({"message": "OTP resent successfully"}, status=status.HTTP_200_OK)
