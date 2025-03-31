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
]
