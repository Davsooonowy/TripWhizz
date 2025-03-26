from django.urls import path
from .views import (
    UserView,
    AddUserView,
    LoginView,
    CurrentUserView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("user/", AddUserView.as_view(), name="user_operations"),
    path("user/<int:user_id>/", UserView.as_view(), name="user_delete"),
    path("user/login/", LoginView.as_view(), name="user_login"),
    path("user/me/", CurrentUserView.as_view(), name="current_user"),
    path(
        "user/password-reset/",
        PasswordResetRequestView.as_view(),
        name="password_reset_request",
    ),
    path(
        "user/password-reset-confirm/<uidb64>/<token>/",
        PasswordResetConfirmView.as_view(),
        name="password_reset_confirm",
    ),
]
