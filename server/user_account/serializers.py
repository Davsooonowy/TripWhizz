from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.db import models
from .models import Friendship, Notification, UserPreferences

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "avatar",
            "avatar_url",
            "onboarding_complete",
            "email",
            "password",
        ]
        extra_kwargs = {
            "avatar": {"required": False},
            "username": {"required": False},
            "password": {"required": False},
        }

    def get_avatar_url(self, obj):
        try:
            prefs = obj.preferences
            visible = prefs.data.get('privacy', {}).get('profile_visible', True)
            if visible is False:
                return None
        except UserPreferences.DoesNotExist:
            pass

        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def create(self, validated_data):
        username = validated_data["email"]
        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class FriendshipSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'sender', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        sender = self.context['request'].user
        receiver_id = validated_data.pop('receiver_id')

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"receiver_id": "User does not exist"})

        if sender.id == receiver_id:
            raise serializers.ValidationError({"receiver_id": "You cannot send a friend request to yourself"})

        # Check if friendship already exists
        existing = Friendship.objects.filter(
            (models.Q(sender=sender) & models.Q(receiver=receiver)) |
            (models.Q(sender=receiver) & models.Q(receiver=sender))
        ).first()

        if existing:
            if existing.status == 'accepted':
                raise serializers.ValidationError({"receiver_id": "You are already friends with this user"})
            elif existing.status == 'pending':
                if existing.sender == sender:
                    raise serializers.ValidationError({"receiver_id": "Friend request already sent"})
                else:
                    # If the receiver is sending a request to the sender, accept the existing request
                    existing.status = 'accepted'
                    existing.save()

                    # Create notification for the original sender
                    Notification.objects.create(
                        recipient=existing.sender,
                        sender=existing.receiver,
                        notification_type='friend_accept',
                        title='Friend Request Accepted',
                        message=f'{existing.receiver.username} accepted your friend request',
                        related_object_id=existing.id
                    )

                    return existing
            elif existing.status == 'rejected':
                # If previously rejected, update to pending
                existing.status = 'pending'
                existing.sender = sender
                existing.receiver = receiver
                existing.save()

                # Create notification for the receiver
                Notification.objects.create(
                    recipient=receiver,
                    sender=sender,
                    notification_type='friend_request',
                    title='New Friend Request',
                    message=f'{sender.username} sent you a friend request',
                    related_object_id=existing.id
                )

                return existing

        # Create new friendship
        friendship = Friendship.objects.create(sender=sender, receiver=receiver, status='pending')

        # Create notification for the receiver
        Notification.objects.create(
            recipient=receiver,
            sender=sender,
            notification_type='friend_request',
            title='New Friend Request',
            message=f'{sender.username} sent you a friend request',
            related_object_id=friendship.id
        )

        return friendship


class FriendListSerializer(serializers.ModelSerializer):
    """Serializer for listing friends"""
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar_url']

    def get_avatar_url(self, obj):
        try:
            prefs = obj.preferences
            visible = prefs.data.get('privacy', {}).get('profile_visible', True)
            if visible is False:
                return None
        except UserPreferences.DoesNotExist:
            pass

        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class NotificationSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'sender', 'notification_type', 'title', 'message', 'is_read', 'related_object_id', 'created_at']
        read_only_fields = ['id', 'sender', 'notification_type', 'title', 'message', 'related_object_id', 'created_at']


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)


class GoogleAuthResponseSerializer(serializers.Serializer):
    sub = serializers.CharField()
    email = serializers.EmailField()
    email_verified = serializers.BooleanField()
    name = serializers.CharField()
    given_name = serializers.CharField()
    family_name = serializers.CharField(required=False)


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'id',
            'data',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
