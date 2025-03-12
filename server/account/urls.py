from django.urls import path
from .views import UserView, AddUserView, LoginView

urlpatterns = [
    path('user/', AddUserView.as_view(), name='user_operations'),
    path('user/<int:user_id>/', UserView.as_view(), name='user_delete'),
    path('user/login/', LoginView.as_view(), name='user_login'),
]
