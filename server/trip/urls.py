from django.urls import path
from . import views

urlpatterns = [
    path('trips/', views.TripListView.as_view(), name='trip-list'),
    path('trips/<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('trips/<int:pk>/reorder-stages/', views.ReorderStagesView.as_view(), name='reorder-stages'),
    path('stages/', views.StageListView.as_view(), name='stage-list'),
    path('stages/<int:pk>/', views.StageDetailView.as_view(), name='stage-detail'),
    path('trips/<int:pk>/batch-create-stages/', views.BatchCreateStagesView.as_view(), name='batch-create-stages'),
]
