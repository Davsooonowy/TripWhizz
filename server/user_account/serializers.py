from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
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
