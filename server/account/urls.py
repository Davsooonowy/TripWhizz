from django.urls import path

from .views import AddUserView, LoginView, PasswordResetView, UserView

urlpatterns = [
    path("user/", AddUserView.as_view(), name="user_operations"),
    path("user/<int:user_id>/", UserView.as_view(), name="user_delete"),
    path("user/login/", LoginView.as_view(), name="user_login"),
    path("user/me/", UserView.as_view(), name="current_user"),
    path(
        "user/password-reset/",
        PasswordResetView.as_view(),
        name="password_reset_request",
    ),
    path(
        "user/password-reset-confirm/<uidb64>/<token>/",
        PasswordResetView.as_view(),
        name="password_reset_confirm",
    ),
]
