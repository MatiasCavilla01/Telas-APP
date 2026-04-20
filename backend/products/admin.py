from django.contrib import admin
from .models import StoreConfiguration

@admin.register(StoreConfiguration)
class StoreConfigurationAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active')