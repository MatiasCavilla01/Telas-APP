from rest_framework import serializers
from .models import StoreConfiguration, Categoria, Producto, ProductoImagen

class StoreConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfiguration
        fields = ['title', 'main_image']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__' # Esto expone id, nombre, descripcion e imagen

class ProductoImagenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductoImagen
        fields = ['id', 'imagen']

class ProductoSerializer(serializers.ModelSerializer):
    # Traemos las imágenes usando el related_name que definimos en el modelo
    imagenes_galeria = ProductoImagenSerializer(many=True, read_only=True)

    class Meta:
        model = Producto
        fields = ['id', 'nombre', 'precio', 'descripcion', 'talle', 'categoria', 'imagen', 'imagenes_galeria']