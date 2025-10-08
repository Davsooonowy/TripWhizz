from django.urls import path

from . import views

urlpatterns = [
	path('trip/', views.TripListView.as_view(), name='trip-list'),
	path('trip/<int:pk>/', views.TripDetailView.as_view(), name='trip-detail'),
	path("trip/<int:pk>/invite/", views.TripInviteView.as_view(), name="trip-invite"),
	path('trip/<int:pk>/reorder-stages/', views.ReorderStagesView.as_view(), name='reorder-stages'),
	path('trip/<int:pk>/participants/<int:participant_id>/', views.TripRemoveParticipantView.as_view(),
		 name='trip-remove-participant'),
	path("invitation/<int:pk>/respond/", views.TripInvitationResponseView.as_view(), name="trip-invitation-respond"),
	path('stage/', views.StageListView.as_view(), name='stage-list'),
	path('stage/<int:pk>/', views.StageDetailView.as_view(), name='stage-detail'),
	path('trip/<int:pk>/batch-create-stages/', views.BatchCreateStagesView.as_view(), name='batch-create-stages'),
	path('stage/<int:stage_id>/elements/', views.StageElementView.as_view(), name='stage-elements'),
	path('stage/element/', views.StageElementView.as_view(), name='stage-element-detail'),
	path('stage/element/<int:pk>/react/', views.StageElementView.as_view(), name='stage-element-react'),
	path('stage/element/<int:pk>/', views.StageElementView.as_view(), name='stage-element-update'),
	path('trip/<int:pk>/packing-lists/', views.PackingListView.as_view(), name='packing-list'),
	path('trip/<int:pk>/packing-lists/<int:list_id>/', views.PackingListDetailView.as_view(), name='packing-list-detail'),
	path('trip/<int:pk>/packing-lists/<int:list_id>/items/', views.PackingItemView.as_view(), name='packing-items'),
	path('trip/<int:pk>/packing-lists/<int:list_id>/items/<int:item_id>/', views.PackingItemDetailView.as_view(), name='packing-item-detail'),
	path('trip/<int:pk>/packing-lists/<int:list_id>/items/<int:item_id>/toggle/', views.ToggleItemPackedView.as_view(), name='packing-item-toggle'),
	
	# Document URLs
	path('document-categories/', views.DocumentCategoryView.as_view(), name='document-categories'),
	path('trip/<int:trip_id>/documents/', views.DocumentView.as_view(), name='trip-documents'),
	path('trip/<int:trip_id>/documents/<int:document_id>/', views.DocumentDetailView.as_view(), name='trip-document-detail'),
	path('trip/<int:trip_id>/documents/<int:document_id>/comments/', views.DocumentCommentView.as_view(), name='trip-document-comments'),
	path('trip/<int:trip_id>/documents/<int:document_id>/comments/<int:comment_id>/', views.DocumentCommentDetailView.as_view(), name='trip-document-comment-detail'),

	# Expenses URLs
	path('trip/<int:pk>/expenses/', views.ExpenseListCreateView.as_view(), name='trip-expenses'),
	path('trip/<int:pk>/expenses/<int:expense_id>/', views.ExpenseDetailView.as_view(), name='trip-expense-detail'),
	path('trip/<int:pk>/balances/', views.TripBalanceView.as_view(), name='trip-balances'),
	path('trip/<int:pk>/settlements/', views.SettlementListCreateView.as_view(), name='trip-settlements'),

	# Itinerary events
	path('trip/<int:pk>/itinerary/events/', views.ItineraryEventListCreateView.as_view(), name='trip-itinerary-events'),
	path('trip/<int:pk>/itinerary/events/<int:event_id>/', views.ItineraryEventDetailView.as_view(), name='trip-itinerary-event-detail'),

	# Map pins and settings
	path('trip/<int:pk>/maps/pins/', views.TripMapPinListCreateView.as_view(), name='trip-map-pins'),
	path('trip/<int:pk>/maps/pins/<int:pin_id>/', views.TripMapPinDetailView.as_view(), name='trip-map-pin-detail'),
	path('trip/<int:pk>/maps/settings/', views.TripMapSettingsView.as_view(), name='trip-map-settings'),
]
