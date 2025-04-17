from django.urls import path
from . import views

urlpatterns = [
    path('trip/', views.TripListView.as_view(), name='trip-list'),
    path('trip/<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('trip/<int:pk>/reorder-stages/', views.ReorderStagesView.as_view(), name='reorder-stages'),
    path('stage/', views.StageListView.as_view(), name='stage-list'),
    path('stage/<int:pk>/', views.StageDetailView.as_view(), name='stage-detail'),
    path('trip/<int:pk>/batch-create-stages/', views.BatchCreateStagesView.as_view(), name='batch-create-stages'),
]
