from rest_framework import serializers
from .models import Trip, Stage, StageElement
from django.contrib.auth import get_user_model

User = get_user_model()


class StageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = [
            'id', 'name', 'category', 'description', 'start_date', 'end_date',
            'order', 'trip', 'is_custom_category', 'custom_category_color',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class StageListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stage
        fields = [
            'id', 'name', 'category', 'description', 'start_date', 'end_date',
            'order', 'is_custom_category', 'custom_category_color'
        ]


class TripSerializer(serializers.ModelSerializer):
    stages = StageListSerializer(many=True, read_only=True)
    participants = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=False
    )
    tags = serializers.JSONField(required=False)

    class Meta:
        model = Trip
        fields = [
            'id', 'name', 'destination', 'description', 'start_date', 'end_date',
            'trip_type', 'owner', 'participants', 'stages', 'created_at', 'updated_at',
            'icon', 'icon_color', 'tags', 'invite_permission'
        ]
        read_only_fields = ['created_at', 'updated_at', 'owner']

    def create(self, validated_data):
        # Set the owner to the current user
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class TripListSerializer(serializers.ModelSerializer):
    stage_count = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'name', 'destination', 'start_date', 'end_date',
            'trip_type', 'stage_count', 'participants_count', 'created_at'
        ]

    def get_stage_count(self, obj):
        return obj.stages.count()

    def get_participants_count(self, obj):
        return obj.participants.count()


class StageElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StageElement
        fields = ['id', 'name', 'description', 'url', 'stage', 'likes', 'dislikes']
        read_only_fields = ['created_at', 'updated_at']
