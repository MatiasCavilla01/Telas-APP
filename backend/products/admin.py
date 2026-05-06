from django.contrib import admin
from .models import StoreConfiguration, Categoria, Producto, ProductoImagen

@admin.register(StoreConfiguration)
class StoreConfigurationAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active')

class ProductoImagenInline(admin.TabularInline):
    model = ProductoImagen
    extra = 3 # Muestra 3 espacios vacíos por defecto para subir fotos

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'precio', 'talle', 'categoria']
    inlines = [ProductoImagenInline] # Agrega la galería dentro del producto

admin.site.register(Categoria)
