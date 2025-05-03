from django.db import transaction
from rest_framework import status, permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Trip, Stage, StageElement, StageElementReaction
from .serializers import TripSerializer, TripListSerializer, StageSerializer, StageListSerializer, \
    StageElementSerializer


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
        trips = Trip.objects.filter(owner=user)
        serializer = self.get_serializer(trips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TripSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TripDetailView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    serializer_class = TripSerializer

    def get_object(self, pk):
        try:
            trip = Trip.objects.get(pk=pk, owner=self.request.user)
            self.check_object_permissions(self.request, trip)
            return trip
        except Trip.DoesNotExist:
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
        serializer = self.get_serializer(trip, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        trip = self.get_object(pk)
        if not trip:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        trip.delete()
        return Response({"detail": "Deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class ReorderStagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            trip = Trip.objects.get(pk=pk, owner=request.user)
        except Trip.DoesNotExist:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        stage_ids = request.data.get('stage_ids', [])
        if not stage_ids:
            return Response({"detail": "No stage IDs provided."}, status=status.HTTP_400_BAD_REQUEST)

        trip_stage_ids = set(trip.stages.values_list('id', flat=True))
        if not set(stage_ids).issubset(trip_stage_ids):
            return Response({"detail": "Some stages do not belong to this trip."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            for index, stage_id in enumerate(stage_ids):
                Stage.objects.filter(id=stage_id, trip=trip).update(order=index)

        return Response({"detail": "Stages reordered successfully."}, status=status.HTTP_200_OK)


class StageListView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StageListSerializer

    def get(self, request):
        user = request.user
        trip_id = request.query_params.get('trip_id')
        if trip_id:
            stages = Stage.objects.filter(trip__owner=user, trip_id=trip_id)
        else:
            stages = Stage.objects.filter(trip__owner=user)
        serializer = self.get_serializer(stages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        trip_id = request.data.get('trip')
        try:
            trip = Trip.objects.get(id=trip_id, owner=request.user)
        except Trip.DoesNotExist:
            return Response({"detail": "Trip not found or you do not have permission."},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = StageSerializer(data=request.data)
        if serializer.is_valid():
            last_order = Stage.objects.filter(trip=trip).order_by('-order').first()
            order = (last_order.order + 1) if last_order else 0
            serializer.save(trip=trip, order=order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StageDetailView(GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = StageSerializer

    def get_object(self, pk):
        try:
            stage = Stage.objects.get(pk=pk, trip__owner=self.request.user)
            return stage
        except Stage.DoesNotExist:
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
        serializer = self.get_serializer(stage, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        stage = self.get_object(pk)
        if not stage:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        stage.delete()
        return Response({"detail": "Deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class BatchCreateStagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            trip = Trip.objects.get(pk=pk, owner=request.user)
        except Trip.DoesNotExist:
            return Response({"detail": "Trip not found."}, status=status.HTTP_404_NOT_FOUND)

        stages_data = request.data.get('stages', [])
        if not stages_data:
            return Response({"detail": "No stages provided."}, status=status.HTTP_400_BAD_REQUEST)

        created_stages = []
        with transaction.atomic():
            for index, stage_data in enumerate(stages_data):
                stage_data['trip'] = trip.id
                stage_data['order'] = index
                serializer = StageSerializer(data=stage_data)
                if serializer.is_valid():
                    stage = serializer.save()
                    created_stages.append(StageSerializer(stage).data)
                else:
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(created_stages, status=status.HTTP_201_CREATED)


class StageElementView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, stage_id=None):
        try:
            elements = StageElement.objects.filter(stage_id=stage_id)
        except Stage.DoesNotExist:
            return Response({"detail": "Stage not found."}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        serialized_elements = []
        for element in elements:
            user_reaction = StageElementReaction.objects.filter(
                user=user, stage_element=element
            ).first()

            likes_users = StageElementReaction.objects.filter(
                stage_element=element, reaction="like"
            ).values_list("user__username", flat=True)

            dislikes_users = StageElementReaction.objects.filter(
                stage_element=element, reaction="dislike"
            ).values_list("user__username", flat=True)

            serialized_elements.append(
                {
                    "id": element.id,
                    "name": element.name,
                    "description": element.description,
                    "url": element.url,
                    # "image": element.image.url if element.image else None,
                    "likes": element.likes,
                    "dislikes": element.dislikes,
                    "userReaction": user_reaction.reaction if user_reaction else None,
                    "likesUsers": list(likes_users),
                    "dislikesUsers": list(dislikes_users),
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

        if any(field in request.data for field in ['name', 'description', 'url']):
            serializer = StageElementSerializer(element, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reaction = request.data.get("reaction")
        if reaction not in ["like", "dislike"]:
            return Response(
                {"error": "Invalid reaction"}, status=status.HTTP_400_BAD_REQUEST
            )

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

        element.likes = StageElementReaction.objects.filter(
            stage_element=element, reaction="like"
        ).count()
        element.dislikes = StageElementReaction.objects.filter(
            stage_element=element, reaction="dislike"
        ).count()
        element.save()

        return Response(
            {"likes": element.likes, "dislikes": element.dislikes},
            status=status.HTTP_200_OK,
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
