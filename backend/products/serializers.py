from rest_framework import serializers
from .models import StoreConfiguration, Categoria, Producto

class StoreConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfiguration
        fields = ['title', 'main_image']

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__' # Esto expone id, nombre, descripcion e imagen

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = '__all__'