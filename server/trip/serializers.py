from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Trip, Stage, StageElement

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar_url']

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class StageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = [
            "id",
            "name",
            "category",
            "description",
            "start_date",
            "end_date",
            "order",
            "trip",
            "is_custom_category",
            "custom_category_color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = [
            "id",
            "name",
            "category",
            "description",
            "start_date",
            "end_date",
            "order",
            "is_custom_category",
            "custom_category_color",
        ]


class TripSerializer(serializers.ModelSerializer):
    stages = StageListSerializer(many=True, read_only=True)
    participants = UserBasicSerializer(many=True, read_only=True)
    participants_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), required=False, write_only=True, source='participants'
    )
    owner = UserBasicSerializer(read_only=True)
    tags = serializers.JSONField(required=False)

    class Meta:
        model = Trip
        fields = [
            "id",
            "name",
            "destination",
            "description",
            "start_date",
            "end_date",
            "trip_type",
            "owner",
            "participants",
            "participants_ids",
            "stages",
            "created_at",
            "updated_at",
            "icon",
            "icon_color",
            "tags",
            "invite_permission",
        ]
        read_only_fields = ["created_at", "updated_at", "owner"]

    def create(self, validated_data):
        participants_data = validated_data.pop('participants', [])
        validated_data["owner"] = self.context["request"].user
        trip = super().create(validated_data)

        if participants_data:
            trip.participants.set(participants_data)

        trip.participants.add(self.context["request"].user)

        return trip

    def update(self, instance, validated_data):
        participants_data = validated_data.pop('participants', None)
        trip = super().update(instance, validated_data)

        if participants_data is not None:
            trip.participants.set(participants_data)
            trip.participants.add(trip.owner)

        return trip


class TripListSerializer(serializers.ModelSerializer):
    stage_count = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "name",
            "destination",
            "start_date",
            "end_date",
            "trip_type",
            "stage_count",
            "participants_count",
            "created_at",
        ]

    def get_stage_count(self, obj):
        return obj.stages.count()

    def get_participants_count(self, obj):
        return obj.participants.count()


class StageElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StageElement
        fields = ["id", "name", "description", "url", "stage", "averageReaction"]
        read_only_fields = ["created_at", "updated_at"]
