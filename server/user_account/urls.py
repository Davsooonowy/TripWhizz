from django.urls import path

from . import views

urlpatterns = [
    path("api/user/", views.AddUserView.as_view(), name="user_operations"),
    path("api/user/<int:user_id>/", views.UserView.as_view(), name="user_delete"),
    path("api/user/login/", views.LoginView.as_view(), name="user_login"),
    path("api/user/me/", views.UserView.as_view(), name="current_user"),
    path(
        "api/user/password-reset/",
        views.PasswordResetView.as_view(),
        name="password_reset_request",
    ),
    path(
        "user/password-reset-confirm/<uidb64>/<token>/",
        views.PasswordResetView.as_view(),
        name="password_reset_confirm",
    ),
    path("google-login/", views.GoogleAuthView.as_view(), name="google_login"),
    path("api/user/verify/", views.OTPVerifyView.as_view(), name="verify_otp"),
    path("api/user/resend-otp/", views.ResendOtpView.as_view(), name="resend_otp"),
]
