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
    base_url = os.environ.get('ENVIA_BASE_URL', 'https://api-test.envia.com')
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
                # ---------------------------------------------------------
                # BUG FIX: se extraen TODOS los campos de branches[0] para
                # poder mostrar la dirección real de la sucursal en el front.
                # Antes solo se tomaba 'reference' y se perdían nombre,
                # calle, ciudad y CP de la sucursal.
                # ---------------------------------------------------------
                branches = op.get('branches') or []
                sucursal_cercana = branches[0] if branches else None

                sucursal_nombre    = ''
                sucursal_direccion = ''
                sucursal_localidad = ''
                sucursal_cp        = ''
                sucursal_horario   = ''

                if sucursal_cercana:
                    # Envia.com puede devolver distintos esquemas según carrier.
                    # Intentamos los campos más comunes primero.
                    sucursal_nombre    = (
                        sucursal_cercana.get('name') or
                        sucursal_cercana.get('alias') or
                        sucursal_cercana.get('reference') or
                        ''
                    )
                    sucursal_direccion = (
                        sucursal_cercana.get('street') or
                        sucursal_cercana.get('address') or
                        sucursal_cercana.get('direction') or
                        ''
                    )
                    numero = sucursal_cercana.get('number') or sucursal_cercana.get('streetNumber') or ''
                    if numero:
                        sucursal_direccion = f"{sucursal_direccion} {numero}".strip()

                    sucursal_localidad = (
                        sucursal_cercana.get('city') or
                        sucursal_cercana.get('locality') or
                        sucursal_cercana.get('municipio') or
                        ''
                    )
                    sucursal_cp      = sucursal_cercana.get('postalCode') or sucursal_cercana.get('zipCode') or ''
                    sucursal_horario = sucursal_cercana.get('schedule') or sucursal_cercana.get('businessHours') or ''

                lista_opciones.append({
                    "id": op.get('carrierId'),
                    "proveedor": op.get('carrierDescription', 'Correo Nacional'),
                    "servicio": op.get('serviceDescription', 'Estándar'),
                    "costo": float(op.get('totalPrice', 0)),
                    "tiempo_entrega": op.get('deliveryEstimate', 'Desconocido'),
                    "carrier_code": op.get('carrier', 'correoargentino').lower(),
                    "service_code": op.get('service', 'estandar').lower(),
                    # Campos de sucursal ahora completos y correctamente mapeados
                    "sucursal_nombre":    sucursal_nombre,
                    "sucursal_direccion": sucursal_direccion,
                    "sucursal_localidad": sucursal_localidad,
                    "sucursal_cp":        sucursal_cp,
                    "sucursal_horario":   sucursal_horario,
                    # Mantenemos el campo legacy para no romper código existente
                    "sucursal_direccion_completa": (
                        f"{sucursal_nombre} — {sucursal_direccion}, {sucursal_localidad}"
                        f"{' CP ' + sucursal_cp if sucursal_cp else ''}"
                    ).strip(" —"),
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


def buscar_sucursales_cercanas(codigo_postal_destino):
    """
    Consulta Envia.com con shipment.type=2 (entrega en sucursal) para obtener
    las sucursales de Correo Argentino más cercanas al CP del comprador.
    Devuelve una lista normalizada con todos los campos necesarios para el frontend.
    """
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
            "street": "",
            "number": "",
            "district": "",
            "city": "",
            "state": "",
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
            # type=2 indica entrega en sucursal (pick-up point) en Envia.com
            "carrier": "correoargentino",
            "type": 2
        }
    }

    try:
        response = requests.post(endpoint, json=payload, headers=headers)

        if response.status_code != 200:
            return {
                "error": True,
                "mensaje": f"Fallo al buscar sucursales (HTTP {response.status_code})."
            }

        response_data = response.json()

        if not response_data.get('data'):
            return {"error": True, "mensaje": "Envia.com no devolvió sucursales para este CP."}

        sucursales_resultado = []

        for op in response_data['data']:
            branches = op.get('branches') or []
            carrier_code  = op.get('carrier', 'correoargentino').lower()
            service_code  = op.get('service', 'estandar').lower()
            costo_base    = float(op.get('totalPrice', 0))
            tiempo_entrega = op.get('deliveryEstimate', 'Desconocido')
            proveedor      = op.get('carrierDescription', 'Correo Argentino')

            if branches:
                # Cada sucursal en branches es una opción independiente
                for idx, branch in enumerate(branches):
                    nombre    = (
                        branch.get('name') or
                        branch.get('alias') or
                        branch.get('reference') or
                        f"Sucursal {idx + 1}"
                    )
                    calle     = branch.get('street') or branch.get('address') or branch.get('direction') or ''
                    numero_b  = branch.get('number') or branch.get('streetNumber') or ''
                    direccion = f"{calle} {numero_b}".strip() if numero_b else calle
                    localidad = (
                        branch.get('city') or
                        branch.get('locality') or
                        branch.get('municipio') or
                        ''
                    )
                    cp        = branch.get('postalCode') or branch.get('zipCode') or str(codigo_postal_destino)
                    horario   = branch.get('schedule') or branch.get('businessHours') or ''
                    lat       = branch.get('lat') or branch.get('latitude') or ''
                    lng       = branch.get('lng') or branch.get('longitude') or ''

                    sucursales_resultado.append({
                        "id_unico":        f"suc-{carrier_code}-{idx}",
                        "nombre":          nombre,
                        "direccion":       direccion,
                        "localidad":       localidad,
                        "codigo_postal":   cp,
                        "horario":         horario,
                        "lat":             lat,
                        "lng":             lng,
                        "proveedor":       proveedor,
                        "carrier_code":    carrier_code,
                        "service_code":    service_code,
                        "costo":           costo_base,
                        "tiempo_entrega":  tiempo_entrega,
                    })
            else:
                # Sin branches: mostramos la opción genérica de sucursal
                sucursales_resultado.append({
                    "id_unico":        f"suc-{carrier_code}-0",
                    "nombre":          proveedor,
                    "direccion":       "Ver sucursales en correoargentino.com.ar",
                    "localidad":       "",
                    "codigo_postal":   str(codigo_postal_destino),
                    "horario":         "",
                    "lat":             "",
                    "lng":             "",
                    "proveedor":       proveedor,
                    "carrier_code":    carrier_code,
                    "service_code":    service_code,
                    "costo":           costo_base,
                    "tiempo_entrega":  tiempo_entrega,
                })

        if not sucursales_resultado:
            return {"error": True, "mensaje": "No hay sucursales disponibles para este código postal."}

        return {"error": False, "sucursales": sucursales_resultado}

    except Exception as e:
        return {"error": True, "mensaje": f"Error interno del servidor Django: {str(e)}"}


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