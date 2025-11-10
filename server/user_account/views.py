import json
import os
import logging

import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction, models
from django.http import JsonResponse
from django.utils.crypto import get_random_string
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, filters
from rest_framework.authtoken.models import Token
from rest_framework.generics import GenericAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PendingUser, Profile, Friendship, Notification, UserPreferences
from .serializers import (
    UserSerializer,
    LoginSerializer,
    GoogleAuthResponseSerializer,
    FriendshipSerializer,
    FriendListSerializer,
    NotificationSerializer,
    UserPreferencesSerializer,
)
from .utils import generate_otp, send_otp_email, send_password_reset_email
from .redis_utils import check_friend_request_rate_limit, get_redis_connection

User = get_user_model()
logger = logging.getLogger(__name__)


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
            return Response(
                {"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        otp_code = generate_otp()
        pending_user, created = PendingUser.objects.get_or_create(email=email)
        if created is False:
            if hasattr(pending_user, "password"):
                pending_user.password = ""
            if hasattr(pending_user, "otp"):
                pending_user.otp = ""
            pending_user.save(update_fields=[f for f in ["password", "otp"] if hasattr(pending_user, f)])

        r = get_redis_connection()
        # 10 minutes TTL for OTP and password
        r.setex(f"signup:otp:{email}", 10 * 60, otp_code)
        r.setex(f"signup:pwd:{email}", 10 * 60, password)

        send_otp_email(pending_user, otp_code)

        return Response(
            {"message": "OTP sent. Please verify.", "email": str(pending_user.email)}
        )


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=UserSerializer,
        responses={200: openapi.Response("User updated successfully")},
    )
    def put(self, request, user_id=None):
        user = request.user if user_id is None else User.objects.get(id=user_id)

        serializer = UserSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        if request.user.id != user_id:
            return JsonResponse({"error": "You can only delete your own account"}, status=403)
        try:
            user = User.objects.get(id=user_id)
            user.delete()
            return JsonResponse({"message": "User deleted successfully"}, status=200)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user, context={"request": request})
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

                send_password_reset_email(user, reset_link)

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
            access_token = request.data.get("token")
            if not access_token:
                logger.warning("GoogleAuthView: missing token in request body")
                return Response(
                    {"status": "error", "message": "Token is required", "payload": {}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Mask sensitive token in logs
            try:
                masked = (
                    f"{access_token[:6]}...{access_token[-4:]}"
                    if isinstance(access_token, str) and len(access_token) > 10
                    else "(short/invalid)"
                )
                logger.info(
                    "GoogleAuthView: received token len=%s masked=%s",
                    len(access_token) if isinstance(access_token, str) else None,
                    masked,
                )
            except Exception:
                logger.info("GoogleAuthView: received token (masking failed)")
            logger.info("GoogleAuthView: GOOGLE_RESPONSE_URL=%s", os.getenv("GOOGLE_RESPONSE_URL"))

            response = requests.get(
                os.getenv("GOOGLE_RESPONSE_URL"),
                headers={"Authorization": f"Bearer {access_token}"},
            )
            logger.info("GoogleAuthView: userinfo status=%s", response.status_code)
            try:
                response_text_preview = response.text[:500]
            except Exception:
                response_text_preview = "<no text>"
            logger.debug("GoogleAuthView: userinfo body preview=%s", response_text_preview)
            response_data = response.json()

            if "error" in response_data:
                logger.warning("GoogleAuthView: userinfo error payload=%s", response_data)
                return Response(
                    {
                        "status": "error",
                        "message": "Wrong google token / this google token is already expired.",
                        "payload": {},
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as ex:
            logger.exception("GoogleAuthView: exception while verifying Google token: %s", ex)
            return Response(
                {
                    "status": "error",
                    "message": "Unexpected error occurred, contact support for more info",
                    "payload": {},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        google_response_serializer = GoogleAuthResponseSerializer(data=response_data)
        if google_response_serializer.is_valid() is False:
            logger.error(
                "GoogleAuthView: serializer invalid errors=%s data=%s",
                google_response_serializer.errors,
                response_data,
            )
            return Response(
                {
                    "status": "error",
                    "message": "Unexpected error occurred, contact support for more info",
                    "payload": {},
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        validated_data = google_response_serializer.validated_data
        email = validated_data["email"].lower()
        given_name = validated_data["given_name"]
        family_name = validated_data.get("family_name", "")

        with transaction.atomic():
            user = User.objects.filter(email=email).first()
            if user is None:
                username = email
                password = get_random_string(12)
                user = User.objects.create_user(
                    username=username,
                    password=password,
                    email=email,
                    first_name=given_name,
                    last_name=family_name,
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

        r = get_redis_connection()
        stored_otp = r.get(f"signup:otp:{email}")
        if stored_otp is None or stored_otp != otp:
            return Response({"error": "Invalid OTP"}, status=400)

        raw_password = r.get(f"signup:pwd:{email}")
        if raw_password is None:
            return Response({"error": "Session expired. Please sign up again."}, status=400)

        user = Profile.objects.create_user(
            username=pending_user.email,
            email=pending_user.email,
            password=raw_password,
        )

        token, _ = Token.objects.get_or_create(user=user)
        r.delete(f"signup:otp:{email}")
        r.delete(f"signup:pwd:{email}")
        pending_user.delete()

        return Response(
            {
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
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        otp_code = generate_otp()
        r = get_redis_connection()
        r.setex(f"signup:otp:{email}", 10 * 60, otp_code)
        send_otp_email(pending_user, otp_code)

        return Response(
            {"message": "OTP resent successfully"}, status=status.HTTP_200_OK
        )


class FriendListView(ListAPIView):
    """View to list all accepted friends"""

    permission_classes = [IsAuthenticated]
    serializer_class = FriendListSerializer

    def get_queryset(self):
        user = self.request.user
        # Get all accepted friendships where the user is either sender or receiver
        friendships = Friendship.objects.filter(
            (models.Q(sender=user) | models.Q(receiver=user))
            & models.Q(status="accepted")
        )

        # Extract the friend from each friendship
        friend_ids = []
        for friendship in friendships:
            if friendship.sender == user:
                friend_ids.append(friendship.receiver.id)
            else:
                friend_ids.append(friendship.sender.id)

        return User.objects.filter(id__in=friend_ids)


class FriendRequestListView(APIView):
    """View to list all pending friend requests"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get sent requests
        sent_requests = Friendship.objects.filter(sender=user, status="pending")
        sent_serializer = FriendshipSerializer(
            sent_requests, many=True, context={"request": request}
        )

        # Get received requests
        received_requests = Friendship.objects.filter(receiver=user, status="pending")
        received_serializer = FriendshipSerializer(
            received_requests, many=True, context={"request": request}
        )

        return Response(
            {"sent": sent_serializer.data, "received": received_serializer.data}
        )


class SendFriendRequestView(APIView):
    """View to send a friend request"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Check rate limit before processing the request
        user_id = request.user.id
        allowed, current_count, reset_time = check_friend_request_rate_limit(user_id)

        if not allowed:
            return Response(
                {
                    "error": "Rate limit exceeded",
                    "message": "You've sent too many friend requests. Please try again later.",
                    "reset_time": reset_time,
                    "current_count": current_count,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = FriendshipSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            friendship = serializer.save()
            return Response(
                FriendshipSerializer(friendship, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FriendRequestActionView(APIView):
    """View to accept or reject a friend request"""

    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            friendship = Friendship.objects.get(
                pk=pk, receiver=request.user, status="pending"
            )
        except Friendship.DoesNotExist:
            return Response(
                {"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get("action")
        if action not in ["accept", "reject"]:
            return Response(
                {"error": "Invalid action. Use 'accept' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        friendship.status = "accepted" if action == "accept" else "rejected"
        friendship.save()

        # Create notification if request is accepted
        if action == "accept":
            Notification.objects.create(
                recipient=friendship.sender,
                sender=request.user,
                notification_type="friend_accept",
                title="Friend Request Accepted",
                message=f"{request.user.username} accepted your friend request",
                related_object_id=friendship.id,
            )

        return Response(
            FriendshipSerializer(friendship, context={"request": request}).data
        )


class FriendSearchView(ListAPIView):
    """View to search for users to add as friends"""

    permission_classes = [IsAuthenticated]
    serializer_class = FriendListSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "email", "first_name", "last_name"]

    def get_queryset(self):
        user = self.request.user

        friendships = Friendship.objects.filter(
            (models.Q(sender=user) | models.Q(receiver=user))
            & models.Q(status="accepted")
        )

        friend_ids = []
        for friendship in friendships:
            if friendship.sender == user:
                friend_ids.append(friendship.receiver.id)
            else:
                friend_ids.append(friendship.sender.id)

        exclude_ids = [user.id] + friend_ids
        return User.objects.exclude(id__in=exclude_ids)


class FriendDeleteView(APIView):
    """View to remove a friend"""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        user = request.user
        try:
            friend = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        friendship = Friendship.objects.filter(
            (
                models.Q(sender=user, receiver=friend)
                | models.Q(sender=friend, receiver=user)
            )
            & models.Q(status__in=["accepted", "pending"])
        ).first()

        if not friendship:
            return Response(
                {"error": "Friendship not found"}, status=status.HTTP_404_NOT_FOUND
            )

        friendship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class NotificationListView(ListAPIView):
    """View to list all notifications for the current user"""

    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationCountView(APIView):
    """View to get the count of unread notifications"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({"count": count})


class NotificationMarkReadView(APIView):
    """View to mark notifications as read"""

    permission_classes = [IsAuthenticated]

    def put(self, request, pk=None):
        if pk:
            try:
                notification = Notification.objects.get(pk=pk, recipient=request.user)
                notification.is_read = True
                notification.save()
                return Response(NotificationSerializer(notification).data)
            except Notification.DoesNotExist:
                return Response(
                    {"error": "Notification not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            Notification.objects.filter(recipient=request.user).update(is_read=True)
            return Response({"message": "All notifications marked as read"})


class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs)
        return Response(serializer.data)

    def put(self, request):
        prefs, _ = UserPreferences.objects.get_or_create(user=request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
