from django.db import transaction
from django.db.models import Avg, Q, Count, Case, When, IntegerField, F
from django.shortcuts import get_object_or_404
from rest_framework import status, permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Trip, Stage, StageElement, StageElementReaction, TripInvitation, PackingList, PackingItem, DocumentCategory, Document, DocumentComment, Expense, Settlement, ItineraryEvent, TripMapPin, TripMapSettings
from .serializers import (
	TripSerializer,
	TripListSerializer,
	StageSerializer,
	StageListSerializer,
	StageElementSerializer,
	TripInvitationSerializer,
	PackingListSerializer,
	PackingItemSerializer,
	DocumentCategorySerializer,
	DocumentSerializer,
	DocumentCreateSerializer,
	DocumentUpdateSerializer,
	DocumentCommentSerializer,
    ExpenseSerializer,
    SettlementSerializer,
    ItineraryEventSerializer,
    TripMapPinSerializer,
    TripMapSettingsSerializer,
)
from user_account.models import Notification
from user_account.utils import send_trip_invitation_email

User = get_user_model()


class IsOwnerOrReadOnly(permissions.BasePermission):
	"""
	Custom permission to only allow owners of an object to edit it.
	"""

	def has_object_permission(self, request, view, obj):
		if request.method in permissions.SAFE_METHODS:
			return True
		return obj.owner == request.user


class TripListView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = TripListSerializer

	def get(self, request):
		user = request.user
		trips = Trip.objects.filter(
			Q(owner=user) | Q(participants=user)
		).distinct()
		serializer = self.get_serializer(trips, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request):
		serializer = TripSerializer(data=request.data, context={"request": request})
		if serializer.is_valid():
			serializer.save(owner=request.user)
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripDetailView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
	serializer_class = TripSerializer

	def get_object(self, pk):
		try:
			trip = Trip.objects.filter(
				Q(pk=pk) & (Q(owner=self.request.user) | Q(participants=self.request.user))
			).distinct().get()
			self.check_object_permissions(self.request, trip)
			return trip
		except Trip.DoesNotExist:
			return None
		except Trip.MultipleObjectsReturned:
			trip = Trip.objects.filter(pk=pk).first()
			if trip and (trip.owner == self.request.user or trip.participants.filter(id=self.request.user.id).exists()):
				self.check_object_permissions(self.request, trip)
				return trip
			return None

	def get(self, request, pk):
		trip = self.get_object(pk)
		if not trip:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		serializer = self.get_serializer(trip)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def put(self, request, pk):
		trip = self.get_object(pk)
		if not trip:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		if trip.owner != request.user:
			return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

		serializer = self.get_serializer(trip, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, pk):
		trip = self.get_object(pk)
		if not trip:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		if trip.owner != request.user:
			return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

		trip.delete()
		return Response(
			{"detail": "Deleted successfully."}, status=status.HTTP_204_NO_CONTENT
		)


class TripInviteView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, pk):
		try:
			trip = Trip.objects.filter(
				Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
			).distinct().first()
			if not trip:
				return Response(
					{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
				)
		except Trip.DoesNotExist:
			return Response(
				{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
			)

		if trip.invite_permission == "admin-only" and trip.owner != request.user:
			return Response(
				{"detail": "Only trip admin can send invitations."},
				status=status.HTTP_403_FORBIDDEN
			)

		invitee_id = request.data.get("invitee_id")
		if not invitee_id:
			return Response(
				{"detail": "invitee_id is required."}, status=status.HTTP_400_BAD_REQUEST
			)

		try:
			invitee = User.objects.get(id=invitee_id)
		except User.DoesNotExist:
			return Response(
				{"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
			)

		if trip.participants.filter(id=invitee_id).exists():
			return Response(
				{"detail": "User is already a participant."}, status=status.HTTP_400_BAD_REQUEST
			)

		existing_invitation = TripInvitation.objects.filter(
			trip=trip,
			invitee=invitee,
			status='pending'
		).first()

		if existing_invitation and not existing_invitation.is_expired():
			return Response(
				{"detail": "Invitation already sent."}, status=status.HTTP_400_BAD_REQUEST
			)

		if existing_invitation and existing_invitation.is_expired():
			existing_invitation.status = 'pending'
			existing_invitation.inviter = request.user
			existing_invitation.expires_at = timezone.now() + timezone.timedelta(days=7)
			existing_invitation.save()
			invitation = existing_invitation
		else:
			invitation = TripInvitation.objects.create(
				trip=trip,
				inviter=request.user,
				invitee=invitee
			)

		Notification.objects.create(
			recipient=invitee,
			sender=request.user,
			notification_type='trip_invite',
			title='Trip Invitation',
			message=f'{request.user.username} invited you to join "{trip.name}"',
			related_object_id=invitation.id
		)

		try:
			send_trip_invitation_email(invitation)
		except Exception as e:
			print(f"Failed to send invitation email: {e}")

		serializer = TripInvitationSerializer(invitation, context={'request': request})
		return Response(serializer.data, status=status.HTTP_201_CREATED)


class TripInvitationResponseView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def put(self, request, pk):
		try:
			invitation = TripInvitation.objects.get(pk=pk, invitee=request.user)
		except TripInvitation.DoesNotExist:
			return Response(
				{"detail": "Invitation not found."}, status=status.HTTP_404_NOT_FOUND
			)

		if invitation.is_expired() and invitation.status == 'pending':
			invitation.status = 'expired'
			invitation.save()

		if invitation.status == 'expired':
			return Response(
				{"detail": "This invitation has expired. Please ask for a new invitation."},
				status=status.HTTP_400_BAD_REQUEST
			)

		if invitation.status != 'pending':
			return Response(
				{"detail": "This invitation is no longer available."},
				status=status.HTTP_400_BAD_REQUEST
			)

		action = request.data.get("action")
		if action not in ["accept", "reject"]:
			return Response(
				{"detail": "Action must be 'accept' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST
			)

		if action == "accept":
			invitation.status = "accepted"
			invitation.trip.participants.add(invitation.invitee)

			existing_participants = invitation.trip.participants.exclude(id=invitation.invitee.id)
			for participant in existing_participants:
				Notification.objects.create(
					recipient=participant,
					sender=invitation.invitee,
					notification_type='trip_update',
					title='New Trip Member',
					message=f'{invitation.invitee.username} joined "{invitation.trip.name}"',
					related_object_id=invitation.trip.id
				)
		else:
			invitation.status = "rejected"

		invitation.save()

		serializer = TripInvitationSerializer(invitation, context={'request': request})
		return Response(serializer.data, status=status.HTTP_200_OK)


class TripRemoveParticipantView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def delete(self, request, pk, participant_id):
		try:
			trip = Trip.objects.filter(pk=pk, owner=request.user).first()
			if not trip:
				return Response(
					{"detail": "Trip not found or you don't have permission."},
					status=status.HTTP_404_NOT_FOUND
				)
		except Trip.DoesNotExist:
			return Response(
				{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
			)

		try:
			participant = User.objects.get(id=participant_id)
		except User.DoesNotExist:
			return Response(
				{"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
			)

		if not trip.participants.filter(id=participant_id).exists():
			return Response(
				{"detail": "User is not a participant of this trip."},
				status=status.HTTP_400_BAD_REQUEST
			)

		if trip.owner.id == participant_id:
			return Response(
				{"detail": "Cannot remove the trip owner."},
				status=status.HTTP_400_BAD_REQUEST
			)

		trip.participants.remove(participant)

		Notification.objects.create(
			recipient=participant,
			sender=request.user,
			notification_type='trip_update',
			title='Removed from Trip',
			message=f'You have been removed from "{trip.name}" by {request.user.username}',
			related_object_id=trip.id
		)

		remaining_participants = trip.participants.exclude(id=request.user.id)
		for other_participant in remaining_participants:
			Notification.objects.create(
				recipient=other_participant,
				sender=request.user,
				notification_type='trip_update',
				title='Trip Member Removed',
				message=f'{participant.username} was removed from "{trip.name}"',
				related_object_id=trip.id
			)

		return Response(
			{"detail": f"{participant.username} has been removed from the trip."},
			status=status.HTTP_200_OK
		)

class ReorderStagesView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, pk):
		try:
			trip = Trip.objects.filter(pk=pk, owner=request.user).first()
			if not trip:
				return Response(
					{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
				)
		except Trip.DoesNotExist:
			return Response(
				{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
			)

		stage_ids = request.data.get("stage_ids", [])
		if not stage_ids:
			return Response(
				{"detail": "No stage IDs provided."}, status=status.HTTP_400_BAD_REQUEST
			)

		trip_stage_ids = set(trip.stages.values_list("id", flat=True))
		if not set(stage_ids).issubset(trip_stage_ids):
			return Response(
				{"detail": "Some stages do not belong to this trip."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		with transaction.atomic():
			for index, stage_id in enumerate(stage_ids):
				Stage.objects.filter(id=stage_id, trip=trip).update(order=index)

		return Response(
			{"detail": "Stages reordered successfully."}, status=status.HTTP_200_OK
		)


class StageListView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = StageListSerializer

	def get(self, request):
		user = request.user
		trip_id = request.query_params.get("trip_id")
		if trip_id:
			stages = Stage.objects.filter(
				Q(trip__owner=user) | Q(trip__participants=user),
				trip_id=trip_id
			).distinct()
		else:
			stages = Stage.objects.filter(
				Q(trip__owner=user) | Q(trip__participants=user)
			).distinct()
		serializer = self.get_serializer(stages, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request):
		trip_id = request.data.get("trip")
		try:
			trip = Trip.objects.filter(id=trip_id, owner=request.user).first()
			if not trip:
				return Response(
					{"detail": "Trip not found or you do not have permission."},
					status=status.HTTP_403_FORBIDDEN,
				)
		except Trip.DoesNotExist:
			return Response(
				{"detail": "Trip not found or you do not have permission."},
				status=status.HTTP_403_FORBIDDEN,
			)

		serializer = StageSerializer(data=request.data)
		if serializer.is_valid():
			last_order = Stage.objects.filter(trip=trip).order_by("-order").first()
			order = (last_order.order + 1) if last_order else 0
			serializer.save(trip=trip, order=order)
			return Response(serializer.data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StageDetailView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = StageSerializer

	def get_object(self, pk):
		try:
			stage = Stage.objects.filter(
				Q(pk=pk) & (Q(trip__owner=self.request.user) | Q(trip__participants=self.request.user))
			).distinct().get()
			return stage
		except Stage.DoesNotExist:
			return None
		except Stage.MultipleObjectsReturned:
			stage = Stage.objects.filter(pk=pk).first()
			if stage and (stage.trip.owner == self.request.user or stage.trip.participants.filter(
					id=self.request.user.id).exists()):
				return stage
			return None

	def get(self, request, pk):
		stage = self.get_object(pk)
		if not stage:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		serializer = self.get_serializer(stage)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def put(self, request, pk):
		stage = self.get_object(pk)
		if not stage:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		if stage.trip.owner != request.user:
			return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

		serializer = self.get_serializer(stage, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, pk):
		stage = self.get_object(pk)
		if not stage:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		if stage.trip.owner != request.user:
			return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

		stage.delete()
		return Response(
			{"detail": "Deleted successfully."}, status=status.HTTP_204_NO_CONTENT
		)


class BatchCreateStagesView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def post(self, request, pk):
		try:
			trip = Trip.objects.filter(pk=pk, owner=request.user).first()
			if not trip:
				return Response(
					{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
				)
		except Trip.DoesNotExist:
			return Response(
				{"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND
			)

		stages_data = request.data.get("stages", [])
		if not stages_data:
			return Response(
				{"detail": "No stages provided."}, status=status.HTTP_400_BAD_REQUEST
			)

		created_stages = []
		with transaction.atomic():
			for index, stage_data in enumerate(stages_data):
				stage_data["trip"] = trip.id
				stage_data["order"] = index
				serializer = StageSerializer(data=stage_data)
				if serializer.is_valid():
					stage = serializer.save()
					created_stages.append(StageSerializer(stage).data)
				else:
					return Response(
						serializer.errors, status=status.HTTP_400_BAD_REQUEST
					)

		return Response(created_stages, status=status.HTTP_201_CREATED)


class StageElementView(APIView):
	permission_classes = [permissions.IsAuthenticated]

	def get(self, request, stage_id=None):
		try:
			elements = StageElement.objects.filter(stage_id=stage_id)
		except Stage.DoesNotExist:
			return Response(
				{"detail": "Stage not found."}, status=status.HTTP_404_NOT_FOUND
			)

		user = request.user
		serialized_elements = []
		for element in elements:
			user_reaction = StageElementReaction.objects.filter(
				user=user, stage_element=element
			).first()

			average_reaction = StageElementReaction.objects.filter(
				stage_element=element
			).aggregate(Avg("reaction"))["reaction__avg"]

			reactions = StageElementReaction.objects.filter(
				stage_element=element
			).select_related("user")
			reactions_data = [
				{
					"userId": reaction.user.id,
					"userName": reaction.user.username,
					"reaction": reaction.reaction,
				}
				for reaction in reactions
			]

			serialized_elements.append(
				{
					"id": element.id,
					"name": element.name,
					"description": element.description,
					"url": element.url,
					# "image": element.image.url if element.image else None,
					"averageReaction": average_reaction,
					"userReaction": user_reaction.reaction if user_reaction else None,
					"reactions": reactions_data,
				}
			)

		return Response(serialized_elements, status=status.HTTP_200_OK)

	def post(self, request):
		serializer = StageElementSerializer(data=request.data)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_201_CREATED)

		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def put(self, request, pk=None):
		try:
			element = StageElement.objects.get(pk=pk)
		except StageElement.DoesNotExist:
			return Response(
				{"error": "StageElement not found"}, status=status.HTTP_404_NOT_FOUND
			)

		if any(field in request.data for field in ["name", "description", "url"]):
			serializer = StageElementSerializer(
				element, data=request.data, partial=True
			)
			if serializer.is_valid():
				serializer.save()
				return Response(serializer.data, status=status.HTTP_200_OK)
			return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

		reaction = request.data.get("reaction")
		user = request.user
		existing_reaction = StageElementReaction.objects.filter(
			user=user, stage_element=element
		).first()

		if existing_reaction:
			if existing_reaction.reaction == reaction:
				existing_reaction.delete()
			else:
				existing_reaction.reaction = reaction
				existing_reaction.save()
		else:
			StageElementReaction.objects.create(
				user=user, stage_element=element, reaction=reaction
			)

		average_reaction = StageElementReaction.objects.filter(
			stage_element=element
		).aggregate(Avg("reaction"))["reaction__avg"]
		element.grade = average_reaction
		element.save()

		return Response(
			{"averageReaction": average_reaction}, status=status.HTTP_200_OK
		)

	def delete(self, request, pk=None):
		try:
			element = StageElement.objects.get(pk=pk)
			element.delete()
			return Response(
				{"message": "StageElement deleted successfully"},
				status=status.HTTP_204_NO_CONTENT,
			)
		except StageElement.DoesNotExist:
			return Response(
				{"error": "StageElement not found"}, status=status.HTTP_404_NOT_FOUND
			)


class PackingListView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = PackingListSerializer

	def get_trip(self, request, pk):
		try:
			return Trip.objects.filter(
				Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
			).distinct().get()
		except Trip.DoesNotExist:
			return None

	def get(self, request, pk):
		trip = self.get_trip(request, pk)
		if not trip:
			return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

		list_type = request.query_params.get("list_type")
		qs = PackingList.objects.filter(trip=trip)
		if list_type in ["private", "shared"]:
			qs = qs.filter(list_type=list_type)

		qs = qs.annotate(
			total_items=Count("items"),
			packed_items=Count(Case(When(items__is_packed=True, then=1), output_field=IntegerField())),
			completion_percentage=Case(
				When(total_items__gt=0, then=(F("packed_items") * 100.0) / F("total_items")),
				default=0.0,
				output_field=IntegerField(),
			),
		)
		serializer = self.get_serializer(qs, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request, pk):
		trip = self.get_trip(request, pk)
		if not trip:
			return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

		serializer = self.get_serializer(data=request.data, context={"request": request, "trip": trip})
		if serializer.is_valid():
			packing_list = serializer.save()
			return Response(self.get_serializer(packing_list).data, status=status.HTTP_201_CREATED)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PackingListDetailView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = PackingListSerializer

	def get_queryset(self):
		return PackingList.objects.all()

	def get_trip_and_list(self, request, pk, list_id):
		trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
		if not trip:
			return None, None
		packing_list = self.get_queryset().filter(pk=list_id, trip=trip).first()
		return trip, packing_list

	def get(self, request, pk, list_id):
		trip, packing_list = self.get_trip_and_list(request, pk, list_id)
		if not packing_list:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		serializer = self.get_serializer(packing_list)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def patch(self, request, pk, list_id):
		trip, packing_list = self.get_trip_and_list(request, pk, list_id)
		if not packing_list:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		serializer = self.get_serializer(packing_list, data=request.data, partial=True)
		if serializer.is_valid():
			serializer.save()
			return Response(serializer.data, status=status.HTTP_200_OK)
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	def delete(self, request, pk, list_id):
		trip, packing_list = self.get_trip_and_list(request, pk, list_id)
		if not packing_list:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		packing_list.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class PackingItemView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = PackingItemSerializer

	def get_trip_and_list(self, request, pk, list_id):
		trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
		if not trip:
			return None, None
		packing_list = PackingList.objects.filter(pk=list_id, trip=trip).first()
		return trip, packing_list

	def get(self, request, pk, list_id):
		trip, packing_list = self.get_trip_and_list(request, pk, list_id)
		if not packing_list:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		items = PackingItem.objects.filter(packing_list=packing_list)
		category = request.query_params.get("category")
		is_packed = request.query_params.get("is_packed")
		search = request.query_params.get("search")
		if category:
			items = items.filter(category=category)
		if is_packed is not None:
			items = items.filter(is_packed=is_packed.lower() == "true")
		if search:
			items = items.filter(Q(name__icontains=search) | Q(description__icontains=search))

		serializer = self.get_serializer(items, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request, pk, list_id):
		trip, packing_list = self.get_trip_and_list(request, pk, list_id)
		if not packing_list:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

		data = request.data.copy()
		assigned_to_id = data.pop("assigned_to_id", None)
		item = PackingItem(
			packing_list=packing_list,
			name=data.get("name"),
			description=data.get("description"),
			category=data.get("category"),
			priority=data.get("priority", "medium"),
			quantity=data.get("quantity", 1),
			created_by=request.user,
		)
		if assigned_to_id:
			user = User.objects.filter(pk=assigned_to_id).first()
			item.assigned_to = user
		item.save()
		return Response(self.get_serializer(item).data, status=status.HTTP_201_CREATED)


class PackingItemDetailView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = PackingItemSerializer

	def get_trip_list_item(self, request, pk, list_id, item_id):
		trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
		if not trip:
			return None, None, None
		packing_list = PackingList.objects.filter(pk=list_id, trip=trip).first()
		if not packing_list:
			return trip, None, None
		item = PackingItem.objects.filter(pk=item_id, packing_list=packing_list).first()
		return trip, packing_list, item

	def patch(self, request, pk, list_id, item_id):
		trip, packing_list, item = self.get_trip_list_item(request, pk, list_id, item_id)
		if not item:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		data = request.data.copy()
		assigned_to_id = data.pop("assigned_to_id", None)
		for field in ["name", "description", "category", "priority", "quantity", "is_packed"]:
			if field in data:
				setattr(item, field, data.get(field))
		if assigned_to_id is not None:
			item.assigned_to = User.objects.filter(pk=assigned_to_id).first() if assigned_to_id else None
		if "is_packed" in data:
			if data.get("is_packed"):
				item.packed_by = request.user
				item.packed_at = timezone.now()
			else:
				item.packed_by = None
				item.packed_at = None
		item.save()
		return Response(self.get_serializer(item).data, status=status.HTTP_200_OK)

	def delete(self, request, pk, list_id, item_id):
		trip, packing_list, item = self.get_trip_list_item(request, pk, list_id, item_id)
		if not item:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		item.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)


class ToggleItemPackedView(GenericAPIView):
	permission_classes = [permissions.IsAuthenticated]
	serializer_class = PackingItemSerializer

	def post(self, request, pk, list_id, item_id):
		trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
		if not trip:
			return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
		item = PackingItem.objects.filter(packing_list__trip=trip, packing_list_id=list_id, pk=item_id).first()
		if not item:
			return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
		item.is_packed = not item.is_packed
		if item.is_packed:
			item.packed_by = request.user
			item.packed_at = timezone.now()
		else:
			item.packed_by = None
			item.packed_at = None
		item.save()
		return Response(self.get_serializer(item).data, status=status.HTTP_200_OK)


class DocumentCategoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get all document categories"""
        categories = DocumentCategory.objects.filter(is_default=True)
        serializer = DocumentCategorySerializer(categories, many=True)
        return Response(serializer.data)


class DocumentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, trip_id):
        """Get all documents for a trip"""
        trip = get_object_or_404(Trip, id=trip_id)
        
        # Check if user has access to this trip
        if not (request.user == trip.owner or trip.participants.filter(id=request.user.id).exists()):
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        # Get documents based on visibility and user permissions
        documents = Document.objects.filter(trip=trip)
        
        # Filter by visibility - by default, show shared documents and user's private documents
        if request.query_params.get('visibility') == 'private':
            documents = documents.filter(uploaded_by=request.user)
        elif request.query_params.get('visibility') == 'shared':
            documents = documents.filter(visibility='shared')
        else:
            # Default: show shared documents + user's own private documents
            documents = documents.filter(
                Q(visibility='shared') | Q(uploaded_by=request.user)
            )
        
        # Filter by category
        category_id = request.query_params.get('category')
        if category_id:
            documents = documents.filter(category_id=category_id)
        
        # Filter by search query
        search = request.query_params.get('search')
        if search:
            documents = documents.filter(title__icontains=search)
        
        # Filter by file type
        file_type = request.query_params.get('file_type')
        if file_type:
            documents = documents.filter(file_type=file_type)
        
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, trip_id):
        """Upload a new document"""
        trip = get_object_or_404(Trip, id=trip_id)
        
        # Check if user has access to this trip
        if not (request.user == trip.owner or trip.participants.filter(id=request.user.id).exists()):
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            document = serializer.save(trip=trip)
            
            # Create notification for new document
            if document.visibility == 'shared':
                # Notify trip participants about new shared document
                for participant in trip.participants.all():
                    if participant != request.user:
                        # You can implement notification creation here
                        pass
            
            response_serializer = DocumentSerializer(document, context={'request': request})
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, trip_id, document_id):
        """Get document details"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        
        # Check if user has access to this document
        if document.visibility == 'private' and document.uploaded_by != request.user:
            if not (request.user == trip.owner or trip.participants.filter(id=request.user.id).exists()):
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentSerializer(document, context={'request': request})
        return Response(serializer.data)

    def put(self, request, trip_id, document_id):
        """Update document"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        
        # Check if user can edit this document
        if document.uploaded_by != request.user and request.user != trip.owner:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentUpdateSerializer(document, data=request.data, partial=True)
        if serializer.is_valid():
            document = serializer.save()
            response_serializer = DocumentSerializer(document, context={'request': request})
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, trip_id, document_id):
        """Delete document"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        
        # Check if user can delete this document
        if document.uploaded_by != request.user and request.user != trip.owner:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentCommentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, trip_id, document_id):
        """Get comments for a document"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        
        # Check if user has access to this document
        if document.visibility == 'private' and document.uploaded_by != request.user:
            if not (request.user == trip.owner or trip.participants.filter(id=request.user.id).exists()):
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        comments = document.comments.all()
        serializer = DocumentCommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, trip_id, document_id):
        """Add a comment to a document"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        
        # Check if user has access to this document
        if document.visibility == 'private' and document.uploaded_by != request.user:
            if not (request.user == trip.owner or trip.participants.filter(id=request.user.id).exists()):
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentCommentSerializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save(
                document=document,
                author=request.user
            )
            
            # Create notification for new comment
            if document.visibility == 'shared' and comment.author != document.uploaded_by:
                # Notify document owner about new comment
                pass
            
            response_serializer = DocumentCommentSerializer(comment)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DocumentCommentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, trip_id, document_id, comment_id):
        """Update a comment"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        comment = get_object_or_404(DocumentComment, id=comment_id, document=document)
        
        # Check if user can edit this comment
        if comment.author != request.user:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            comment = serializer.save()
            response_serializer = DocumentCommentSerializer(comment)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, trip_id, document_id, comment_id):
        """Delete a comment"""
        trip = get_object_or_404(Trip, id=trip_id)
        document = get_object_or_404(Document, id=document_id, trip=trip)
        comment = get_object_or_404(DocumentComment, id=comment_id, document=document)
        
        # Check if user can delete this comment
        if comment.author != request.user and request.user != trip.owner:
            return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseListCreateView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_trip(self, request, pk):
        try:
            return Trip.objects.filter(
                Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
            ).distinct().get()
        except Trip.DoesNotExist:
            return None

    def get(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        expenses = Expense.objects.filter(trip=trip).select_related("paid_by").prefetch_related("shares__user")
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data, context={"request": request, "trip": trip})
        if serializer.is_valid():
            expense = serializer.save()
            return Response(self.get_serializer(expense).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseDetailView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_objects(self, request, pk, expense_id):
        trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
        if not trip:
            return None, None
        expense = Expense.objects.filter(pk=expense_id, trip=trip).first()
        return trip, expense

    def get(self, request, pk, expense_id):
        trip, expense = self.get_objects(request, pk, expense_id)
        if not expense:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(expense).data, status=status.HTTP_200_OK)

    def put(self, request, pk, expense_id):
        trip, expense = self.get_objects(request, pk, expense_id)
        if not expense:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(expense, data=request.data, partial=True)
        if serializer.is_valid():
            expense = serializer.save()
            return Response(self.get_serializer(expense).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, expense_id):
        trip, expense = self.get_objects(request, pk, expense_id)
        if not expense:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SettlementListCreateView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SettlementSerializer

    def get_trip(self, request, pk):
        try:
            return Trip.objects.filter(
                Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
            ).distinct().get()
        except Trip.DoesNotExist:
            return None

    def get(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        settlements = Settlement.objects.filter(trip=trip).select_related("payer", "payee")
        serializer = self.get_serializer(settlements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data, context={"trip": trip})
        if serializer.is_valid():
            settlement = serializer.save()
            return Response(self.get_serializer(settlement).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            trip = Trip.objects.filter(
                Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
            ).distinct().get()
        except Trip.DoesNotExist:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        from collections import defaultdict
        balances = defaultdict(float)

        expenses = Expense.objects.filter(trip=trip).select_related("paid_by").prefetch_related("shares")
        for exp in expenses:
            balances[exp.paid_by_id] += float(exp.amount)
            for share in exp.shares.all():
                balances[share.user_id] -= float(share.owed_amount)

        settlements = Settlement.objects.filter(trip=trip)
        for s in settlements:
            balances[s.payer_id] += float(s.amount)
            balances[s.payee_id] -= float(s.amount)

        users = Trip.objects.filter(pk=trip.pk).values_list("participants__id", flat=True)
        users = set([u for u in users if u is not None] + [trip.owner_id])
        result = []
        for user_id in users:
            user = User.objects.get(pk=user_id)
            result.append({
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                "balance": round(balances[user_id], 2)
            })

        return Response(result, status=status.HTTP_200_OK)


class ItineraryEventListCreateView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ItineraryEventSerializer

    def get_trip(self, request, pk):
        try:
            return Trip.objects.filter(
                Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
            ).distinct().get()
        except Trip.DoesNotExist:
            return None

    def get(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        date = request.query_params.get("date")
        qs = ItineraryEvent.objects.filter(trip=trip)
        if date:
            qs = qs.filter(date=date)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save(trip=trip, created_by=request.user)
            return Response(self.get_serializer(event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ItineraryEventDetailView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ItineraryEventSerializer

    def get_objects(self, request, pk, event_id):
        trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
        if not trip:
            return None, None
        event = ItineraryEvent.objects.filter(pk=event_id, trip=trip).first()
        return trip, event

    def put(self, request, pk, event_id):
        trip, event = self.get_objects(request, pk, event_id)
        if not event:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            event = serializer.save()
            return Response(self.get_serializer(event).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, event_id):
        trip, event = self.get_objects(request, pk, event_id)
        if not event:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TripMapPinListCreateView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TripMapPinSerializer

    def get_trip(self, request, pk):
        try:
            return Trip.objects.filter(
                Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
            ).distinct().get()
        except Trip.DoesNotExist:
            return None

    def get(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        pins = TripMapPin.objects.filter(trip=trip).select_related("created_by")
        return Response(self.get_serializer(pins, many=True).data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            pin = serializer.save(trip=trip, created_by=request.user)
            return Response(self.get_serializer(pin).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripMapPinDetailView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TripMapPinSerializer

    def get_objects(self, request, pk, pin_id):
        trip = Trip.objects.filter(Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))).distinct().first()
        if not trip:
            return None, None
        pin = TripMapPin.objects.filter(pk=pin_id, trip=trip).first()
        return trip, pin

    def put(self, request, pk, pin_id):
        trip, pin = self.get_objects(request, pk, pin_id)
        if not pin:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if not (request.user == trip.owner or request.user == pin.created_by):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(pin, data=request.data, partial=True)
        if serializer.is_valid():
            pin = serializer.save()
            return Response(self.get_serializer(pin).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, pin_id):
        trip, pin = self.get_objects(request, pk, pin_id)
        if not pin:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if not (request.user == trip.owner or request.user == pin.created_by):
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        pin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TripMapSettingsView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TripMapSettingsSerializer

    def get_trip(self, request, pk):
        try:
            return Trip.objects.filter(
                Q(pk=pk) & (Q(owner=request.user) | Q(participants=request.user))
            ).distinct().get()
        except Trip.DoesNotExist:
            return None

    def get(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        settings_obj, _ = TripMapSettings.objects.get_or_create(trip=trip)
        return Response(self.get_serializer(settings_obj).data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        trip = self.get_trip(request, pk)
        if not trip:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user != trip.owner and not trip.participants.filter(id=request.user.id).exists():
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        settings_obj, _ = TripMapSettings.objects.get_or_create(trip=trip)
        serializer = self.get_serializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
