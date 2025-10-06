from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Trip, Stage, StageElement, TripInvitation, PackingList, PackingItem, DocumentCategory, Document, DocumentComment, Expense, ExpenseShare, Settlement, ItineraryEvent, TripMapPin, TripMapSettings

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
    custom_tags = serializers.CharField(required=False, allow_blank=True)
    
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
        # Handle custom_tags JSON string
        custom_tags = validated_data.pop('custom_tags', '')
        if custom_tags:
            try:
                import json
                validated_data['custom_tags'] = json.loads(custom_tags)
            except (json.JSONDecodeError, TypeError):
                validated_data['custom_tags'] = []
        else:
            validated_data['custom_tags'] = []
        
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


class ExpenseShareSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True, required=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    shares_count = serializers.IntegerField(required=False, allow_null=True)
    owed_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)

    class Meta:
        model = ExpenseShare
        fields = [
            "id",
            "user",
            "user_id",
            "percentage",
            "shares_count",
            "owed_amount",
        ]
        read_only_fields = ["id"]


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserBasicSerializer(read_only=True)
    paid_by_id = serializers.IntegerField(write_only=True, required=True)
    shares = ExpenseShareSerializer(many=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "trip",
            "description",
            "amount",
            "currency",
            "paid_by",
            "paid_by_id",
            "split_method",
            "shares",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "trip", "paid_by"]

    def validate(self, attrs):
        shares_data = self.initial_data.get("shares", [])
        split_method = attrs.get("split_method", self.instance.split_method if self.instance else "equal")
        amount = attrs.get("amount", self.instance.amount if self.instance else None)
        if amount is None:
            raise serializers.ValidationError({"amount": "Amount is required"})

        if not shares_data:
            raise serializers.ValidationError({"shares": "At least one share is required"})

        if split_method == "equal":
            pass
        elif split_method == "percentage":
            total_percentage = sum([
                float(s.get("percentage") or 0) for s in shares_data
            ])
            if round(total_percentage, 2) != 100.00:
                raise serializers.ValidationError({"shares": "Percentages must sum to 100%"})
        elif split_method == "exact":
            total_owed = sum([
                float(s.get("owed_amount") or 0) for s in shares_data
            ])
            if round(total_owed, 2) != float(amount):
                raise serializers.ValidationError({"shares": "Exact amounts must sum to total amount"})
        elif split_method == "shares":
            def to_int(x):
                try:
                    return int(x)
                except (TypeError, ValueError):
                    try:
                        return int(float(x))
                    except (TypeError, ValueError):
                        return 0
            total_shares = sum([to_int(s.get("shares_count")) for s in shares_data])
            if total_shares <= 0:
                raise serializers.ValidationError({"shares": "Total shares must be greater than 0"})
        else:
            raise serializers.ValidationError({"split_method": "Invalid split method"})

        trip = self.context.get("trip")
        paid_by_id = self.initial_data.get("paid_by_id")
        if not paid_by_id:
            raise serializers.ValidationError({"paid_by_id": "paid_by_id is required"})
        trip_user_ids = set(list(trip.participants.values_list('id', flat=True)) + [trip.owner_id])
        if int(paid_by_id) not in trip_user_ids:
            raise serializers.ValidationError({"paid_by_id": "Payer must be a trip member"})
        for share in shares_data:
            user_id = int(share.get("user_id"))
            if user_id not in trip_user_ids:
                raise serializers.ValidationError({"shares": f"User {user_id} is not a trip member"})

        return attrs

    def _compute_owed_amount(self, split_method, amount, share):
        if split_method == "equal":
            return round(float(amount) / len(self.initial_data.get("shares", [])), 2)
        if split_method == "percentage":
            try:
                return round(float(amount) * float(share.get("percentage") or 0) / 100.0, 2)
            except (TypeError, ValueError):
                return 0.0
        if split_method == "exact":
            try:
                return round(float(share.get("owed_amount") or 0), 2)
            except (TypeError, ValueError):
                return 0.0
        if split_method == "shares":
            def to_int(x):
                try:
                    return int(x)
                except (TypeError, ValueError):
                    try:
                        return int(float(x))
                    except (TypeError, ValueError):
                        return 0
            shares_list = self.initial_data.get("shares", [])
            total_shares = sum(to_int(s.get("shares_count")) for s in shares_list)
            user_shares = to_int(share.get("shares_count"))
            if total_shares <= 0 or user_shares <= 0:
                return 0.0
            return round(float(amount) * (user_shares / total_shares), 2)
        return 0.0

    def create(self, validated_data):
        trip = self.context.get("trip")
        shares_data = validated_data.pop("shares", [])
        paid_by_id = validated_data.pop("paid_by_id")
        split_method = validated_data.get("split_method")
        amount = validated_data.get("amount")

        expense = Expense.objects.create(trip=trip, paid_by_id=paid_by_id, **validated_data)

        share_objects = []
        for share in shares_data:
            user_id = share.get("user_id")
            owed_amount = self._compute_owed_amount(split_method, amount, share)
            share_objects.append(
                ExpenseShare(
                    expense=expense,
                    user_id=user_id,
                    percentage=share.get("percentage"),
                    shares_count=share.get("shares_count"),
                    owed_amount=owed_amount,
                )
            )
        ExpenseShare.objects.bulk_create(share_objects)

        return expense

    def update(self, instance, validated_data):
        shares_data = validated_data.pop("shares", None)
        paid_by_id = validated_data.pop("paid_by_id", None)
        split_method = validated_data.get("split_method", instance.split_method)
        amount = validated_data.get("amount", instance.amount)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if paid_by_id:
            instance.paid_by_id = paid_by_id
        instance.save()

        if shares_data is not None:
            instance.shares.all().delete()
            share_objects = []
            for share in shares_data:
                user_id = share.get("user_id")
                owed_amount = self._compute_owed_amount(split_method, amount, share)
                share_objects.append(
                    ExpenseShare(
                        expense=instance,
                        user_id=user_id,
                        percentage=share.get("percentage"),
                        shares_count=share.get("shares_count"),
                        owed_amount=owed_amount,
                    )
                )
            ExpenseShare.objects.bulk_create(share_objects)

        return instance


class SettlementSerializer(serializers.ModelSerializer):
    payer = UserBasicSerializer(read_only=True)
    payee = UserBasicSerializer(read_only=True)
    payer_id = serializers.IntegerField(write_only=True, required=True)
    payee_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Settlement
        fields = [
            "id",
            "trip",
            "payer",
            "payee",
            "payer_id",
            "payee_id",
            "amount",
            "currency",
            "note",
            "created_at",
        ]
        read_only_fields = ["id", "trip", "payer", "payee", "created_at"]

    def create(self, validated_data):
        trip = self.context.get("trip")
        payer_id = validated_data.pop("payer_id")
        payee_id = validated_data.pop("payee_id")
        return Settlement.objects.create(trip=trip, payer_id=payer_id, payee_id=payee_id, **validated_data)

    def validate(self, attrs):
        trip = self.context.get("trip")
        payer_id = int(self.initial_data.get("payer_id"))
        payee_id = int(self.initial_data.get("payee_id"))
        amount = float(self.initial_data.get("amount", 0))
        if payer_id == payee_id:
            raise serializers.ValidationError({"payer_id": "Payer and payee must be different"})
        if amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be positive"})
        trip_user_ids = set(list(trip.participants.values_list('id', flat=True)) + [trip.owner_id])
        if payer_id not in trip_user_ids or payee_id not in trip_user_ids:
            raise serializers.ValidationError({"detail": "Both payer and payee must be trip members"})
        return attrs


class ItineraryEventSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = ItineraryEvent
        fields = [
            "id",
            "trip",
            "date",
            "title",
            "description",
            "start_minutes",
            "end_minutes",
            "color",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "trip", "created_by", "created_at", "updated_at"]


class TripMapPinSerializer(serializers.ModelSerializer):
    created_by = UserBasicSerializer(read_only=True)

    class Meta:
        model = TripMapPin
        fields = [
            "id",
            "trip",
            "created_by",
            "title",
            "description",
            "category",
            "latitude",
            "longitude",
            "reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "trip", "created_by", "created_at", "updated_at"]


class TripMapSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripMapSettings
        fields = [
            "default_latitude",
            "default_longitude",
            "default_zoom",
        ]
