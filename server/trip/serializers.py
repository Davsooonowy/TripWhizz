from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Trip, Stage, StageElement, TripInvitation

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


class TripInvitationSerializer(serializers.ModelSerializer):
    inviter = UserBasicSerializer(read_only=True)
    invitee = UserBasicSerializer(read_only=True)
    trip_name = serializers.CharField(source='trip.name', read_only=True)

    class Meta:
        model = TripInvitation
        fields = ['id', 'trip', 'trip_name', 'inviter', 'invitee', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'inviter', 'created_at', 'updated_at']


class TripParticipantSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    invitation_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar_url', 'invitation_status']

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_invitation_status(self, obj):
        trip = self.context.get('trip')
        if not trip:
            return 'accepted'

        if trip.participants.filter(id=obj.id).exists():
            return 'accepted'

        invitation = TripInvitation.objects.filter(trip=trip, invitee=obj).first()
        if invitation:
            return invitation.status

        return 'accepted'


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
    participants = serializers.SerializerMethodField()
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
            "stages",
            "created_at",
            "updated_at",
            "icon",
            "icon_color",
            "tags",
            "invite_permission",
        ]
        read_only_fields = ["created_at", "updated_at", "owner"]

    def get_participants(self, obj):
        accepted_participants = obj.participants.all()

        pending_invitations = TripInvitation.objects.filter(trip=obj, status='pending').select_related('invitee')
        pending_users = [inv.invitee for inv in pending_invitations]

        all_users = list(accepted_participants) + pending_users

        seen = set()
        unique_users = []
        for user in all_users:
            if user.id not in seen:
                seen.add(user.id)
                unique_users.append(user)

        return TripParticipantSerializer(unique_users, many=True,
                                         context={'request': self.context.get('request'), 'trip': obj}).data

    def create(self, validated_data):
        validated_data["owner"] = self.context["request"].user
        trip = super().create(validated_data)

        trip.participants.add(self.context["request"].user)

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
        return obj.participants.count() + obj.invitations.filter(status='pending').count()


class StageElementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StageElement
        fields = ["id", "name", "description", "url", "stage", "averageReaction"]
        read_only_fields = ["created_at", "updated_at"]
