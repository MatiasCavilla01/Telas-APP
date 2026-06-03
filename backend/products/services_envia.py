import requests
import os
import logging
from .models import TarifaLocal, StoreConfiguration

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
#  HELPER: Aplanar campos
# ─────────────────────────────────────────────────────────────────────────────
def _str_field(value):
    if value is None:
        return ''
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, dict):
        partes = []
        for key in ('name', 'street', 'address', 'reference', 'number'):
            v = value.get(key)
            if v and isinstance(v, str):
                partes.append(v.strip())
        return ' '.join(partes) if partes else ''
    if isinstance(value, list):
        return ', '.join(_str_field(item) for item in value if item)
    return str(value).strip()

# ─────────────────────────────────────────────────────────────────────────────
#  HELPER: GEOCODES API
# ─────────────────────────────────────────────────────────────────────────────
def obtener_datos_geograficos(codigo_postal):
    url = f"https://geocodes.envia.com/zipcode/AR/{codigo_postal}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            res_data = response.json()
            
            # CASO A: Si Envia devuelve una lista directa: [{"city": "...", "state": "..."}]
            if isinstance(res_data, list):
                if len(res_data) > 0:
                    return res_data[0]
                return None
                
            # CASO B: Si Envia devuelve un diccionario: {"success": True, "data": [...]}
            if isinstance(res_data, dict):
                # Validamos de forma segura sin que explote si no existe la key
                if res_data.get("success") and "data" in res_data:
                    data = res_data["data"]
                    if isinstance(data, list) and len(data) > 0:
                        return data[0]
                    elif isinstance(data, dict):
                        return data
    except Exception as e:
        logger.error(f"Error consultando Geocodes API: {e}")
    return None

# ─────────────────────────────────────────────────────────────────────────────
#  1. COTIZAR ENVÍO A DOMICILIO
# ─────────────────────────────────────────────────────────────────────────────
def calcular_costo_envio(codigo_postal_destino):
    tarifa_local = TarifaLocal.objects.filter(
        codigo_postal=codigo_postal_destino, activo=True
    ).first()

    if tarifa_local:
        return {
            "error": False,
            "tipo": "Local",
            "proveedor": f"Comisionista ({tarifa_local.localidad})",
            "costo": float(tarifa_local.costo_envio)
        }

    config = StoreConfiguration.objects.filter(is_active=True).first()

    if not config or not config.api_key_envia:
        return {"error": True, "mensaje": "Token de Envia no definido."}

    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api.envia.com')
    endpoint = f"{base_url}/ship/rate"
    headers = {"Authorization": f"Bearer {config.api_key_envia}", "Content-Type": "application/json"}

    geo_data = obtener_datos_geograficos(codigo_postal_destino)
    if not geo_data:
        return {"error": True, "mensaje": f"No se pudieron obtener datos geográficos para el CP {codigo_postal_destino}."}

    dest_city = geo_data.get("city")
    dest_state = geo_data.get("state")


    # 👀 ESPÍA DE DOMICILIO 👀
    print(f"📦 [DOMICILIO] Buscando CP: {codigo_postal_destino} | Ciudad: '{dest_city}' | Prov: '{dest_state}'")

    payload = {
        "origin": {
            "name": config.title, "company": config.title, "email": "nachozubri15@gmail.com",
            "phone": config.telefono or "3562517046", "street": "Urquiza", "number": "70",
            "district": "", "city": "San Guillermo", "state": "SF", "country": "AR",
            "postalCode": "2347", "reference": ""
        },
        "destination": {
            "name": "Cliente Web", "company": "", "email": "nachozubri15@gmail.com",
            "phone": "3510000000", "street": "Calle Falsa", "number": "123",
            "district": "", "city": dest_city, "state": dest_state, "country": "AR",
            "postalCode": str(codigo_postal_destino), "reference": ""
        },
        "packages": [{
            "content": "Telas y Textiles", "amount": 1, "type": "box",
            "weight": float(config.peso_estandar), "insurance": 0, "declaredValue": 0,
            "weightUnit": "KG", "lengthUnit": "CM",
            "dimensions": {
                "length": config.largo_estandar, "width": config.ancho_estandar, "height": config.alto_estandar
            }
        }],
        "shipment": {"carrier": "correoargentino", "type": 1}
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        if response.status_code != 200:
            return {"error": True, "mensaje": f"Fallo al cotizar (HTTP {response.status_code})."}
        
        response_data = response.json()
        if 'data' in response_data and response_data['data']:
            lista_opciones = []
            for op in response_data['data']:
                lista_opciones.append({
                    "id": op.get('carrierId'),
                    "proveedor": op.get('carrierDescription', 'Correo Nacional'),
                    "servicio": op.get('serviceDescription', 'Estándar'),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', 'Desconocido'),
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower()
                })
            return {"error": False, "tipo": "Larga Distancia", "opciones": lista_opciones}
        
        return {"error": True, "mensaje": f"No se pudo cotizar a domicilio para {dest_city} ({dest_state})."}
    except Exception as e:
        return {"error": True, "mensaje": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
#  2. BUSCAR SUCURSALES
# ─────────────────────────────────────────────────────────────────────────────
def buscar_sucursales_cercanas(codigo_postal_destino):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    if not config or not config.api_key_envia:
        return {"error": True, "mensaje": "Token no definido."}

    # ¡Importante! Asegúrate de que esta URL sea la correcta para el entorno.
    # Para pruebas, debería ser: https://api-test.envia.com
    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api.envia.com')
    endpoint = f"{base_url}/ship/rate"
    
    # 1. Agregado el header 'accept' según la documentación
    headers = {
        "Authorization": f"Bearer {config.api_key_envia}", 
        "Content-Type": "application/json",
        "accept": "application/json"
    }

    geo_data = obtener_datos_geograficos(codigo_postal_destino)
    if not geo_data:
        return {"error": True, "mensaje": f"No se pudieron obtener datos geográficos para el CP {codigo_postal_destino}."}

    # 2. Las variables dest_city y dest_state se extraen DESPUÉS de validar geo_data
    dest_city = geo_data.get("city")
    dest_state = geo_data.get("state")

    # 👀 ESPÍA DE SUCURSAL 👀
    print(f"🏪 [SUCURSAL] Buscando CP: {codigo_postal_destino} | Ciudad: '{dest_city}' | Prov: '{dest_state}'")

    payload = {
        "origin": {
            "name": config.title, "company": config.title, "email": "nachozubri15@gmail.com",
            "phone": config.telefono or "3562517046", "street": "Urquiza", "number": "70",
            "district": "", "city": "San Guillermo", "state": "SF", "country": "AR",
            "postalCode": "2347", "reference": ""
        },
        "destination": {
            "name": "Cliente Web", "company": "", "email": "nachozubri15@gmail.com",
            "phone": "3510000000", 
            "street": "Centro",     # 🔥 TRUCO APLICADO PARA CIUDADES GRANDES
            "number": "1",          # 🔥 TRUCO APLICADO PARA CIUDADES GRANDES
            "district": "", 
            "city": dest_city, 
            "state": dest_state, 
            "country": "AR",
            "postalCode": str(codigo_postal_destino), 
            "reference": ""
        },
        "packages": [{
            "content": "Telas y Textiles", "amount": 1, "type": "box",
            "weight": float(config.peso_estandar), "insurance": 0, "declaredValue": 0,
            "weightUnit": "KG", "lengthUnit": "CM",
            "dimensions": {
                "length": config.largo_estandar, "width": config.ancho_estandar, "height": config.alto_estandar
            }
        }],
        # 3. y 4. Cambiado 'correoargentino' por 'correoArgentino' y 'type' 2 por 1
        "shipment": {"carrier": "correoArgentino", "type": 1}
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        if response.status_code != 200:
            print(f"❌ [ERROR ENVIA] Status: {response.status_code} - Body: {response.text}")
            return {"error": True, "mensaje": "Error en la API de Envia."}
        
        response_data = response.json()
        if not response_data.get('data'):
            print(f"❌ [ENVIA VACÍO] Respuesta cruda: {response_data}")
            return {"error": True, "mensaje": f"No hay sucursales para el CP {codigo_postal_destino} en la ciudad de {dest_city} ({dest_state})."}

        sucursales_resultado = []
        for op in response_data['data']:
            for branch in op.get('branches', []):
                sucursales_resultado.append({
                    "id_unico": f"{branch.get('id', 'branch')}-{op.get('carrier')}",
                    "nombre": _str_field(branch.get('name') or branch.get('alias')),
                    "direccion": f"{_str_field(branch.get('street'))} {_str_field(branch.get('number'))}".strip(),
                    "localidad": _str_field(branch.get('city')),
                    "codigo_postal": _str_field(branch.get('postalCode')),
                    "horario": _str_field(branch.get('schedule')),
                    "proveedor": op.get('carrierDescription', 'Correo Argentino'),
                    "carrier_code": op.get('carrier', 'correoArgentino').lower(),
                    "service_code": op.get('service', 'estandar').lower(),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', '3-5 días')
                })
        return {"error": False, "sucursales": sucursales_resultado}
    except Exception as e:
        print(f"❌ [EXCEPCIÓN SUCURSALES] {str(e)}")
        return {"error": True, "mensaje": f"Error del servidor: {str(e)}"}
# ─────────────────────────────────────────────────────────────────────────────
#  3. RASTREAR ENVÍOS
# ─────────────────────────────────────────────────────────────────────────────
def rastrear_envios(tracking_numbers):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    if not config or not config.api_key_envia:
        return {"error": True, "mensaje": "Token de Envia no definido."}

    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api.envia.com')
    endpoint = f"{base_url}/ship/generaltrack/"
    headers = {"Authorization": f"Bearer {config.api_key_envia}", "Content-Type": "application/json"}

    payload = {"trackingNumbers": tracking_numbers}

    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        if response.status_code != 200:
            return {"error": True, "mensaje": f"Fallo al rastrear (HTTP {response.status_code})."}
        return {"error": False, "data": response.json()}
    except Exception as e:
        return {"error": True, "mensaje": str(e)}