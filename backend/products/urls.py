from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# 1. Instanciamos el router
router = DefaultRouter()

# 2. Registramos el ViewSet de categorías
# El primer argumento es el prefijo de la URL ('categorias')
router.register(r'categorias', views.CategoriaViewSet, basename='categoria')
router.register(r'productos', views.ProductoViewSet, basename='producto')

urlpatterns = [
    # Tu endpoint original intacto
    path('api/banner/', views.get_main_banner, name='main-banner'),
    
    # 3. Incluimos las URLs autogeneradas por el router bajo el prefijo 'api/'
    path('api/', include(router.urls)),
]