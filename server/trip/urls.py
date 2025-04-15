from django.urls import path
from . import views

urlpatterns = [
    path("", views.TripListView.as_view(), name="trip_list"),
    path("<int:pk>/", views.TripDetailView.as_view(), name="trip_detail"),

    path("<int:pk>/stages/", views.BatchCreateStagesView.as_view(), name="batch_create_stages"),
    path("<int:pk>/stages/reorder/", views.ReorderStagesView.as_view(), name="reorder_stages"),

    path("stages/", views.StageListView.as_view(), name="stage_list"),
    path("stages/<int:pk>/", views.StageDetailView.as_view(), name="stage_detail"),
]
