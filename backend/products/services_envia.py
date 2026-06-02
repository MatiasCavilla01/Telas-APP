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
#  COTIZAR ENVÍO A DOMICILIO
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

                s_nombre    = ''
                s_direccion = ''
                s_localidad = ''
                s_cp        = ''
                s_horario   = ''

                if sucursal_cercana:
                    s_nombre = (
                        _str_field(sucursal_cercana.get('name')) or
                        _str_field(sucursal_cercana.get('alias')) or
                        _str_field(sucursal_cercana.get('reference')) or ''
                    )
                    calle = (
                        _str_field(sucursal_cercana.get('street')) or
                        _str_field(sucursal_cercana.get('address')) or ''
                    )
                    numero = _str_field(sucursal_cercana.get('number') or sucursal_cercana.get('streetNumber'))
                    s_direccion = f"{calle} {numero}".strip() if numero else calle
                    s_localidad = (
                        _str_field(sucursal_cercana.get('city')) or
                        _str_field(sucursal_cercana.get('locality')) or ''
                    )
                    s_cp      = _str_field(sucursal_cercana.get('postalCode') or sucursal_cercana.get('zipCode'))
                    s_horario = _str_field(sucursal_cercana.get('schedule') or sucursal_cercana.get('businessHours'))

                lista_opciones.append({
                    "id":           op.get('carrierId'),
                    "proveedor":    op.get('carrierDescription', 'Correo Nacional'),
                    "servicio":     op.get('serviceDescription', 'Estándar'),
                    "costo":        float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', 'Desconocido'),
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower(),
                    "sucursal_nombre":    s_nombre,
                    "sucursal_direccion": s_direccion,
                    "sucursal_localidad": s_localidad,
                    "sucursal_cp":        s_cp,
                    "sucursal_horario":   s_horario,
                    "sucursal_direccion_completa": ' — '.join(
                        p for p in [s_nombre, s_direccion, s_localidad, f"CP {s_cp}" if s_cp else ''] if p
                    ),
                })

            return {
                "error": False,
                "tipo": "Larga Distancia",
                "opciones": lista_opciones
            }

        else:
            return {
                "error": True,
                "mensaje": "Envia.com no devolvió opciones de correo.",
                "detalle": response_data
            }

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno del servidor Django: {str(e)}"}


# ─────────────────────────────────────────────────────────────────────────────
#  BUSCAR SUCURSALES CERCANAS  (shipment.type = 2)
def buscar_sucursales_cercanas(codigo_postal_destino):
    config = StoreConfiguration.objects.filter(is_active=True).first()
    if not config or not config.api_key_envia:
        return {"error": True, "mensaje": "Configuración no encontrada."}

    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api-test.envia.com')
    endpoint = f"{base_url}/ship/rate"

    headers = {"Authorization": f"Bearer {config.api_key_envia}", "Content-Type": "application/json"}

    payload = {
        "origin": {
            "name": config.title, "company": config.title, "email": "nachozubri15@gmail.com",
            "phone": config.telefono or "3562517046", "street": "Urquiza", "number": "70",
            "city": "San Guillermo", "state": "SF", "country": "AR", "postalCode": "2347"
        },
        "destination": {
            "country": "AR",
            "postalCode": str(codigo_postal_destino), # ⚠️ MANTENEMOS EL CP DESTINO
            "city": "", # Dejamos vacío para que el carrier busque por CP
            "state": "" 
        },
        "packages": [{
            "content": "Telas", "amount": 1, "type": "box",
            "weight": float(config.peso_estandar), "weightUnit": "KG", "lengthUnit": "CM",
            "dimensions": {"length": config.largo_estandar, "width": config.ancho_estandar, "height": config.alto_estandar}
        }],
        "shipment": {"carrier": "correoargentino", "type": 2} # Type 2 = Sucursal
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
            # ⚠️ AQUÍ ESTÁ EL CAMBIO: Iteramos sobre los branches que la API devuelve para ESTE CP
            for branch in op.get('branches', []):
                sucursales_resultado.append({
                    "id_unico": f"{branch.get('id', 'branch')}-{op.get('carrier')}",
                    "nombre": _str_field(branch.get('name') or branch.get('alias')),
                    "direccion": f"{_str_field(branch.get('street'))} {_str_field(branch.get('number'))}",
                    "localidad": _str_field(branch.get('city')),
                    "codigo_postal": _str_field(branch.get('postalCode')),
                    "horario": _str_field(branch.get('schedule')),
                    "proveedor": op.get('carrierDescription', 'Correo Argentino'),
                    "carrier_code": op.get('carrier', 'correoargentino'),
                    "service_code": op.get('service', 'estandar'),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', '3-5 días')
                })
        
        return {"error": False, "sucursales": sucursales_resultado}
    except Exception as e:
        return {"error": True, "mensaje": str(e)}
# ─────────────────────────────────────────────────────────────────────────────
#  RASTREAR ENVÍOS
# ─────────────────────────────────────────────────────────────────────────────
def rastrear_envios(tracking_numbers):
    """
    Consulta el estado de uno o más envíos en la API de Envia.com.
    tracking_numbers: lista de strings (ej: ["TRK123456", "TRK789012"])
    """
    config = StoreConfiguration.objects.filter(is_active=True).first()

    if not config or not config.api_key_envia:
        return {
            "error": True,
            "mensaje": "La configuración de envíos o el Token de Envia no están definidos."
        }

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
            return {
                "error": True,
                "mensaje": f"Fallo al rastrear (HTTP {response.status_code})."
            }

        return {"error": False, "data": response.json()}

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno del servidor: {str(e)}"}