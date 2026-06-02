import requests
import os
import logging
from .models import TarifaLocal, StoreConfiguration

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
#  HELPER: aplanar campos que Envia.com a veces devuelve como dict/lista/string
# ─────────────────────────────────────────────────────────────────────────────
def _str_field(value):
    """
    Convierte cualquier valor de la API a string legible.
    Envia.com puede devolver {'name': ..., 'number': ...} en vez de un string.
    """
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
#  HELPER: VALIDAR CÓDIGO POSTAL CON GEOCODES API
# ─────────────────────────────────────────────────────────────────────────────
def obtener_datos_geograficos(codigo_postal):
    """
    Consulta la Geocodes API de Envia.com (pública, sin token)
    para obtener la ciudad y provincia exactas del CP.
    """
    url = f"https://geocodes.envia.com/zipcode/AR/{codigo_postal}"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            res_data = response.json()
            if res_data.get("success") and "data" in res_data:
                return res_data["data"]
    except Exception as e:
        logger.error(f"Error consultando Geocodes API: {e}")
    
    return None

# ─────────────────────────────────────────────────────────────────────────────
#  1. COTIZAR ENVÍO A DOMICILIO (TYPE 1)
# ─────────────────────────────────────────────────────────────────────────────
def calcular_costo_envio(codigo_postal_destino):
    """
    Evalúa primero la tabla de comisionistas (TarifaLocal).
    Si no hay cobertura, consulta la API de Envia.com (type=1 = domicilio).
    """
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
        return {
            "error": True,
            "mensaje": "La configuración de envíos o el Token de Envia.com no están definidos en el panel."
        }

    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api-test.envia.com')
    endpoint = f"{base_url}/ship/rate"

    headers = {
        "Authorization": f"Bearer {config.api_key_envia}",
        "Content-Type": "application/json"
    }

    # Usamos Geocodes para no mandar "Cordoba" fijo y que Envia.com cotice bien
    geo_data = obtener_datos_geograficos(codigo_postal_destino)
    dest_city = geo_data.get("city", "Cordoba") if geo_data else "Cordoba"
    dest_state = geo_data.get("state", "CB") if geo_data else "CB"

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
            "phone": "3510000000",
            "street": "Calle Falsa", # Dato genérico porque solo estamos cotizando a domicilio
            "number": "123",
            "district": "",
            "city": dest_city,       # 📍 Dato dinámico de Geocodes
            "state": dest_state,     # 📍 Dato dinámico de Geocodes
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

    try:
        response = requests.post(endpoint, json=payload, headers=headers)

        if response.status_code != 200:
            return {"error": True, "mensaje": f"Fallo al cotizar (HTTP {response.status_code})."}

        response_data = response.json()

        if 'data' in response_data and response_data['data']:
            opciones_brutas = response_data['data']
            lista_opciones = []

            for op in opciones_brutas:
                lista_opciones.append({
                    "id":           op.get('carrierId'),
                    "proveedor":    op.get('carrierDescription', 'Correo Nacional'),
                    "servicio":     op.get('serviceDescription', 'Estándar'),
                    "costo":        float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', 'Desconocido'),
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower()
                })

            return {"error": False, "tipo": "Larga Distancia", "opciones": lista_opciones}
        else:
            return {"error": True, "mensaje": "Envia.com no devolvió opciones de correo."}

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno del servidor Django: {str(e)}"}

# ─────────────────────────────────────────────────────────────────────────────
#  2. BUSCAR SUCURSALES (TYPE 2)
# ─────────────────────────────────────────────────────────────────────────────
def buscar_sucursales_cercanas(codigo_postal_destino):
    """
    Busca sucursales físicas usando Type=2 y Geocodes para precisión geográfica.
    """
    config = StoreConfiguration.objects.filter(is_active=True).first()
    if not config or not config.api_key_envia:
        return {"error": True, "mensaje": "Configuración no encontrada."}

    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api-test.envia.com')
    endpoint = f"{base_url}/ship/rate"

    headers = {
        "Authorization": f"Bearer {config.api_key_envia}",
        "Content-Type": "application/json"
    }

    # Usamos Geocodes para triangular la búsqueda de sucursales
    geo_data = obtener_datos_geograficos(codigo_postal_destino)
    dest_city = geo_data.get("city", "Cordoba") if geo_data else "Cordoba"
    dest_state = geo_data.get("state", "CB") if geo_data else "CB"

    payload = {
        "origin": {
            "name": config.title, "company": config.title, "email": "nachozubri15@gmail.com",
            "phone": config.telefono or "3562517046", "street": "Urquiza", "number": "70",
            "district": "", "city": "San Guillermo", "state": "SF", "country": "AR", "postalCode": "2347",
            "reference": ""
        },
        "destination": {
            "name": "Cliente Web", "company": "", "email": "nachozubri15@gmail.com", "phone": "3510000000",
            "street": "", "number": "", "district": "",
            "city": dest_city,       # 📍 Dato dinámico de Geocodes
            "state": dest_state,     # 📍 Dato dinámico de Geocodes
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
        "shipment": {
            "carrier": "correoargentino", 
            "type": 2  # ⚠️ TYPE 2 obliga a la API a devolver 'branches' (sucursales)
        }
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers)
        if response.status_code != 200:
            return {"error": True, "mensaje": "Error en la API de Envia."}
        
        response_data = response.json()
        if not response_data.get('data'):
            return {"error": True, "mensaje": "No hay sucursales para este CP."}

        sucursales_resultado = []
        for op in response_data['data']:
            # ⚠️ Ahora iteramos SÓLO sobre las sucursales devueltas para este CP exacto
            for branch in op.get('branches', []):
                sucursales_resultado.append({
                    "id_unico": f"{branch.get('id', 'branch')}-{op.get('carrier')}",
                    "nombre": _str_field(branch.get('name') or branch.get('alias')),
                    "direccion": f"{_str_field(branch.get('street'))} {_str_field(branch.get('number'))}".strip(),
                    "localidad": _str_field(branch.get('city')),
                    "codigo_postal": _str_field(branch.get('postalCode')),
                    "horario": _str_field(branch.get('schedule')),
                    "proveedor": op.get('carrierDescription', 'Correo Argentino'),
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower(),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', '3-5 días')
                })
        
        return {"error": False, "sucursales": sucursales_resultado}
    except Exception as e:
        return {"error": True, "mensaje": str(e)}

# ─────────────────────────────────────────────────────────────────────────────
#  3. RASTREAR ENVÍOS
# ─────────────────────────────────────────────────────────────────────────────
def rastrear_envios(tracking_numbers):
    """
    Consulta el estado de uno o más envíos en la API de Envia.com.
    tracking_numbers: lista de strings (ej: ["TRK123456", "TRK789012"])
    """
    config = StoreConfiguration.objects.filter(is_active=True).first()

    if not config or not config.api_key_envia:
        return {"error": True, "mensaje": "Token de Envia no definido."}

    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api-test.envia.com')
    endpoint = f"{base_url}/ship/generaltrack/"

    headers = {
        "Authorization": f"Bearer {config.api_key_envia}",
        "Content-Type": "application/json"
    }

    payload = {"trackingNumbers": tracking_numbers}

    try:
        response = requests.post(endpoint, json=payload, headers=headers)

        if response.status_code != 200:
            return {"error": True, "mensaje": f"Fallo al rastrear (HTTP {response.status_code})."}

        return {"error": False, "data": response.json()}

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno: {str(e)}"}