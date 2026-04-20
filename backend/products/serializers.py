from rest_framework import serializers
from .models import StoreConfiguration

class StoreConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreConfiguration
        fields = ['title', 'main_image']