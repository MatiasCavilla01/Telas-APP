from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import StoreConfiguration
from .serializers import StoreConfigurationSerializer

# Ahora aceptamos GET (leer) y POST (guardar)
@api_view(['GET', 'POST'])
# Estos parsers son obligatorios para que Django entienda que viene un archivo, no solo texto
@parser_classes([MultiPartParser, FormParser])
def get_main_banner(request):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    
    if request.method == 'GET':
        if config:
            serializer = StoreConfigurationSerializer(config, context={'request': request})
            return Response(serializer.data)
        return Response({"error": "No hay configuración activa"}, status=status.HTTP_404_NOT_FOUND)
        
    elif request.method == 'POST':
        # Si ya existe una configuración, la actualizamos. Si no, creamos una nueva.
        if config:
            serializer = StoreConfigurationSerializer(config, data=request.data, partial=True, context={'request': request})
        else:
            serializer = StoreConfigurationSerializer(data=request.data, context={'request': request})
            
        if serializer.is_valid():
            # Guardamos y aseguramos que quede como la configuración activa
            serializer.save(is_active=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        # Si el cliente mandó un archivo corrupto, le avisamos
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)