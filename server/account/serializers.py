from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def create(self, validated_data):
        username = validated_data['email'].split('@')[0]
        user = User.objects.create_user(username=username, email=validated_data['email'], password=validated_data['password'])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UpdateUserSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    name = serializers.CharField(required=False)
    surname = serializers.CharField(required=False)

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('name', instance.first_name)
        instance.last_name = validated_data.get('surname', instance.last_name)
        instance.username = validated_data.get('username', instance.username)
        instance.save()
        return instance