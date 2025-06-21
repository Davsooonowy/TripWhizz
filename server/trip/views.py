from django.db import transaction
from django.db.models import Avg, Q
from rest_framework import status, permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Trip, Stage, StageElement, StageElementReaction, TripInvitation
from .serializers import (
    TripSerializer,
    TripListSerializer,
    StageSerializer,
    StageListSerializer,
    StageElementSerializer,
    TripInvitationSerializer,
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
