# from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import get_user_model

from account.models import CustomUser


User = get_user_model()


class UserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    onboarding_complete = serializers.BooleanField(default=False)

    def create(self, validated_data):
        username = validated_data["email"]
        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "username",
            "first_name",
            "last_name",
            "avatar",
            "notification_type",
            "profile_visibility",
            "default_theme",
            "currency_preference",
            "onboarding_complete",
            "trip_invitations",
            "expense_updates",
            "packing_list_reminders",
            "voting_polls",
        ]
        extra_kwargs = {
            "avatar": {"required": False},
        }

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class EmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordChangeSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data
