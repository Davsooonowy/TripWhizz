from django.urls import path

from . import views

urlpatterns = [
    path("user/", views.AddUserView.as_view(), name="user_operations"),
    path("user/<int:user_id>/", views.UserView.as_view(), name="user_delete"),
    path("user/login/", views.LoginView.as_view(), name="user_login"),
    path("user/me/", views.UserView.as_view(), name="current_user"),
    path(
        "user/password-reset/",
        views.PasswordResetView.as_view(),
        name="password_reset_request",
    ),
    path(
        "user/password-reset-confirm/<uidb64>/<token>/",
        views.PasswordResetView.as_view(),
        name="password_reset_confirm",
    ),
    path("google-login/", views.GoogleAuthView.as_view(), name="google_login"),
    path("user/verify/", views.OTPVerifyView.as_view(), name="verify_otp"),
    path("user/resend-otp/", views.ResendOtpView.as_view(), name="resend_otp"),

    path("friends/", views.FriendListView.as_view(), name="friend_list"),
    path("friends/requests/", views.FriendRequestListView.as_view(), name="friend_request_list"),
    path("friends/request/", views.SendFriendRequestView.as_view(), name="send_friend_request"),
    path("friends/request/<int:pk>/", views.FriendRequestActionView.as_view(), name="friend_request_action"),
    path("friends/search/", views.FriendSearchView.as_view(), name="friend_search"),
    path("friends/<int:pk>/", views.FriendDeleteView.as_view(), name="friend_delete"),

    path("notifications/", views.NotificationListView.as_view(), name="notification_list"),
    path("notifications/count/", views.NotificationCountView.as_view(), name="notification_count"),
    path("notifications/read/", views.NotificationMarkReadView.as_view(), name="mark_all_notifications_read"),
    path("notifications/read/<int:pk>/", views.NotificationMarkReadView.as_view(), name="mark_notification_read"),
]
