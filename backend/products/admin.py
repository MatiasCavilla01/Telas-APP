from django.contrib import admin
from .models import StoreConfiguration, Categoria, Producto

@admin.register(StoreConfiguration)
class StoreConfigurationAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active')

admin.site.register(Categoria)
admin.site.register(Producto)