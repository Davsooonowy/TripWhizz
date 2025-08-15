from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Trip, Stage, StageElement, TripInvitation, PackingList, PackingItem, DocumentCategory, Document, DocumentComment

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


# Packing serializers
class PackingItemSerializer(serializers.ModelSerializer):
	assigned_to = UserBasicSerializer(read_only=True)
	packed_by = UserBasicSerializer(read_only=True)
	created_by = UserBasicSerializer(read_only=True)

	class Meta:
		model = PackingItem
		fields = [
			"id",
			"name",
			"description",
			"category",
			"priority",
			"quantity",
			"is_packed",
			"assigned_to",
			"created_by",
			"packed_by",
			"packed_at",
			"created_at",
			"updated_at",
		]
		read_only_fields = ["id", "created_by", "packed_by", "packed_at", "created_at", "updated_at"]


class PackingListSerializer(serializers.ModelSerializer):
	created_by = UserBasicSerializer(read_only=True)
	total_items = serializers.IntegerField(read_only=True)
	packed_items = serializers.IntegerField(read_only=True)
	completion_percentage = serializers.FloatField(read_only=True)

	class Meta:
		model = PackingList
		fields = [
			"id",
			"trip",
			"name",
			"description",
			"list_type",
			"created_by",
			"total_items",
			"packed_items",
			"completion_percentage",
			"created_at",
			"updated_at",
		]
		read_only_fields = ["id", "trip", "created_by", "total_items", "packed_items", "completion_percentage", "created_at", "updated_at"]

	def create(self, validated_data):
		request = self.context.get('request')
		trip = self.context.get('trip')
		return PackingList.objects.create(created_by=request.user, trip=trip, **validated_data)


class DocumentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentCategory
        fields = [
            "id",
            "name",
            "description",
            "icon",
            "color",
            "is_default",
            "created_at",
        ]


class DocumentCommentSerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(read_only=True)

    class Meta:
        model = DocumentComment
        fields = [
            "id",
            "document",
            "author",
            "content",
            "created_at",
            "updated_at",
        ]


class DocumentSerializer(serializers.ModelSerializer):
    category = DocumentCategorySerializer(read_only=True)
    uploaded_by = UserBasicSerializer(read_only=True)
    comments = DocumentCommentSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_extension = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "trip",
            "title",
            "description",
            "file",
            "file_url",
            "file_type",
            "file_size",
            "file_extension",
            "visibility",
            "category",
            "custom_tags",
            "uploaded_by",
            "comments",
            "comment_count",
            "auto_delete_after_trip",
            "delete_days_after_trip",
            "created_at",
            "updated_at",
        ]

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None

    def get_file_extension(self, obj):
        if obj.file:
            return obj.file.name.split('.')[-1].upper()
        return None


class DocumentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "title",
            "description",
            "file",
            "visibility",
            "category",
            "custom_tags",
            "auto_delete_after_trip",
            "delete_days_after_trip",
        ]

    def validate_file(self, value):
        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 50MB")
        
        # Validate file type
        allowed_types = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md']
        file_extension = value.name.split('.')[-1].lower()
        if file_extension not in allowed_types:
            raise serializers.ValidationError(f"File type .{file_extension} is not supported")
        
        return value

    def create(self, validated_data):
        # Set file type based on extension
        file = validated_data['file']
        file_extension = file.name.split('.')[-1].lower()
        
        if file_extension in ['jpg', 'jpeg', 'png', 'gif']:
            validated_data['file_type'] = 'image'
        elif file_extension == 'pdf':
            validated_data['file_type'] = 'pdf'
        elif file_extension in ['txt', 'md']:
            validated_data['file_type'] = 'text' if file_extension == 'txt' else 'markdown'
        else:
            validated_data['file_type'] = 'other'
        
        validated_data['file_size'] = file.size
        validated_data['uploaded_by'] = self.context['request'].user
        
        return super().create(validated_data)


class DocumentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            "title",
            "description",
            "visibility",
            "category",
            "custom_tags",
            "auto_delete_after_trip",
            "delete_days_after_trip",
        ]
