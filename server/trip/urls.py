from django.urls import path
from . import views

urlpatterns = [
    path('api/trip/', views.TripListView.as_view(), name='trip-list'),
    path('api/trip/<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
    path('api/trip/<int:pk>/reorder-stages/', views.ReorderStagesView.as_view(), name='reorder-stages'),
    path('api/stage/', views.StageListView.as_view(), name='stage-list'),
    path('api/stage/<int:pk>/', views.StageDetailView.as_view(), name='stage-detail'),
    path('api/trip/<int:pk>/batch-create-stages/', views.BatchCreateStagesView.as_view(), name='batch-create-stages'),
]
