from django.urls import path
from . import views

urlpatterns = [
    path('api/banner/', views.get_main_banner, name='main-banner'),
]