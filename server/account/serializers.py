from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "avatar",
            "onboarding_complete",
            "email",
            "password",
        ]
        extra_kwargs = {
            "avatar": {"required": False},
            "username": {"required": False},
            "password": {"required": False},
        }

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


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)
