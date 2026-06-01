import requests
import os
from .models import TarifaLocal, StoreConfiguration

def calcular_costo_envio(codigo_postal_destino):
    """
    Calcula el costo de envío evaluando primero la tabla de comisionistas (TarifaLocal).
    Si no hay cobertura, consulta la API de Envia.com usando el empaque estándar.
    """
    
    # 1. Buscar en la base de datos de comisionistas locales
    tarifa_local = TarifaLocal.objects.filter(codigo_postal=codigo_postal_destino, activo=True).first()
    
    if tarifa_local:
        return {
            "error": False,
            "tipo": "Local",
            "proveedor": f"Comisionista ({tarifa_local.localidad})",
            "costo": float(tarifa_local.costo_envio)
        }

    # 2. Si no es local, buscamos las credenciales y medidas en StoreConfiguration
    config = StoreConfiguration.objects.filter(is_active=True).first()
    
    if not config or not config.api_key_envia:
        return {
            "error": True,
            "mensaje": "La configuración de envíos o el Token de Envia.com no están definidos en el panel."
        }

    # 3. Preparar la petición a la API de Envia.com
    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api.envia.com')
    endpoint = f"{base_url}/ship/rate"
    
    headers = {
        "Authorization": f"Bearer {config.api_key_envia}",
        "Content-Type": "application/json"
    }

    # 4. Armar el JSON (Payload)
    payload = {
        "origin": {
            "name": config.title,
            "company": config.title,
            "email": "nachozubri15@gmail.com",
            "phone": config.telefono or "3562517046",
            "street": "Urquiza",
            "number": "70",
            "district": "",
            "city": "San Guillermo",
            "state": "SF",
            "country": "AR",
            "postalCode": "2347",
            "reference": ""
        },
        "destination": {
            "name": "Cliente Web",
            "company": "",
            "email": "nachozubri15@gmail.com",
            "phone": "3562517046",
            "street": "Obispo Oro",
            "number": "344",
            "district": "",
            "city": "Cordoba",
            "state": "CB",
            "country": "AR",
            "postalCode": str(codigo_postal_destino),
            "reference": ""
        },
        "packages": [
            {
                "content": "Telas y Textiles",
                "amount": 1,
                "type": "box",
                "weight": float(config.peso_estandar),
                "insurance": 0,
                "declaredValue": 0,
                "weightUnit": "KG",
                "lengthUnit": "CM",
                "dimensions": {
                    "length": config.largo_estandar,
                    "width": config.ancho_estandar,
                    "height": config.alto_estandar
                }
            }
        ],
        "shipment": {
            "carrier": "correoargentino",
            "type": 1
        }
    }

    # 5. Ejecutar la llamada a la API
    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        
        if response.status_code != 200:
            return {
                "error": True,
                "mensaje": f"Fallo al cotizar (HTTP {response.status_code}). Revisar consola de Django."
            }

        response_data = response.json()

        if 'data' in response_data and response_data['data']:
            opciones_brutas = response_data['data']
            lista_opciones = []

            for op in opciones_brutas:
                branches = op.get('branches') or []
                sucursal_cercana = branches[0] if branches else None

                lista_opciones.append({
                    "id": op.get('carrierId'),
                    "proveedor": op.get('carrierDescription', 'Correo Nacional'),
                    "servicio": op.get('serviceDescription', 'Estándar'),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', 'Desconocido'),
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower(),
                    "sucursal_direccion": sucursal_cercana.get('reference', '') if sucursal_cercana else '',
                })

            return {
                "error": False,
                "tipo": "Larga Distancia",
                "opciones": lista_opciones
            }

        else:
            return {"error": True, "mensaje": "Envia.com no devolvió opciones de correo.", "detalle": response_data}

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno del servidor Django: {str(e)}"}