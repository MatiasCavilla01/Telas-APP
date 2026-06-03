# 📋 AUDITORÍA DETALLADA: Integración con Envia.com

**Fecha:** 2026-06-02  
**Scope:** `views.py` + `services_envia.py`  
**Conclusión:** Existen 8 problemas críticos y 12 problemas potenciales que pueden causar fallos silenciosos, errores 400 de Envia, y inconsistencias en los datos.

---

## 🔴 PROBLEMAS CRÍTICOS

### 1. **Fallo Silencioso en `obtener_datos_geograficos()` sin Registro Visible**

**Ubicación:** `services_envia.py`, líneas 28-45

**Problema Detectado:**
```python
if res_data.get("success") and "data" in res_data:
    # ... procesamiento ...
else:
    # 🚨 FALLO SILENCIOSO: Solo logea, pero no notifica al usuario final
    pass
return None  # Devuelve None sin distinguir entre "success=False" vs error de red
```

**Explicación del Fallo:**
- La API de Geocodes podría devolver `{"success": False, "error": "Invalid zipcode"}` legítimamente
- La función loga el error genérico `Exception`, pero **no valida si `success` es `False` explícitamente**
- Cuando Geocodes rechaza el CP (ej: CP inexistente), devuelve `None` indistintamente
- **Consecuencia:** `calcular_costo_envio()` y `buscar_sucursales_cercanas()` no pueden distinguir si el fallo fue por CP inválido o por error de red, por lo que aplican el fallback genérico ("Córdoba", "CB") sin avisar al cliente

**Impacto:** El cliente envía un CP inválido (ej: "9999999"), el sistema silenciosamente lo reemplaza por Córdoba, y la cotización es incorrecta.

---

### 2. **Fallback Genérico Enmascarando Datos Inválidos**

**Ubicación:** 
- `services_envia.py`, líneas 64-65 (en `calcular_costo_envio()`)
- `services_envia.py`, líneas 132-133 (en `buscar_sucursales_cercanas()`)

**Problema Detectado:**
```python
geo_data = obtener_datos_geograficos(codigo_postal_destino)
dest_city = geo_data.get("city", "Cordoba") if geo_data else "Cordoba"
dest_state = geo_data.get("state", "CB") if geo_data else "CB"
```

**Explicación del Fallo:**

**Caso 1: Si `obtener_datos_geograficos()` devuelve `None`**
- El sistema fallback a `dest_city = "Cordoba"` y `dest_state = "CB"`
- Se envía la solicitud a Envia con esta ciudad fallida
- Envia puede devolver errores 400 si ese CP no existe en Córdoba
- **El cliente recibe un error genérico sin saber que su CP fue rechazado**

**Caso 2: Si Geocodes devuelve datos parciales**
- Supongamos que Geocodes devuelve: `{"city": "Buenos Aires"}` (sin el campo `state`)
- `dest_state = None` → fallback a "CB"
- Se envía a Envia con provincia "CB" (Córdoba) pero ciudad "Buenos Aires" (en CABA)
- **Inconsistencia geográfica que Envia rechazará o procesará incorrectamente**

**Impacto:** 
- Cotizaciones incorrectas o errores silenciosos
- No hay diferenciación entre "CP válido en otra provincia" vs "CP inválido"

---

### 3. **Payload Hardcodeado con Datos Ficticios en `calcular_costo_envio()`**

**Ubicación:** `services_envia.py`, líneas 76-88 (payload de destination)

**Problema Detectado:**
```python
"destination": {
    "name": "Cliente Web",
    "company": "",
    "email": "nachozubri15@gmail.com",  # ❌ Email del dueño, no del cliente
    "phone": "3510000000",              # ❌ Teléfono genérico
    "street": "Calle Falsa",            # ❌ DIRECCIÓN FICTICIA
    "number": "123",                    # ❌ NÚMERO FICTICIO
    "district": "", 
    "city": dest_city,                  # ✅ Dinámico
    "state": dest_state,                # ✅ Dinámico
    ...
}
```

**Explicación del Fallo:**
- Envia puede validar la dirección contra bases de datos de direcciones válidas
- "Calle Falsa 123" muy probablemente **NO EXISTE en ninguna ciudad de Argentina**
- Envia podría rechazar esto con un error 400: `"Invalid street address"`
- **El sistema no informa si el error es por dirección ficticia o por CP**

**Impacto:**
- Errores 400 de Envia que el usuario no entiende
- La cotización podría fallar silenciosamente y devolver `{"error": True, "mensaje": "..."}`

---

### 4. **Payload Inconsistente: Falta `service` en `shipment`**

**Ubicación:**
- `services_envia.py`, línea 95 (en `calcular_costo_envio()`)
- `services_envia.py`, línea 165 (en `buscar_sucursales_cercanas()`)

**Problema Detectado:**

En `calcular_costo_envio()`:
```python
"shipment": {"carrier": "correoargentino", "type": 1}
# ❌ Falta: "service": "estandar" o similar
```

En `buscar_sucursales_cercanas()`:
```python
"shipment": {"carrier": "correoargentino", "type": 2}
# ❌ Falta: "service": "estandar" o similar
```

Pero en `generar_etiqueta_envio_view()` (views.py, línea 911):
```python
"shipment": {
    "carrier": pedido.envia_carrier or "correoargentino", 
    "service": pedido.envia_service or "estandar",  # ✅ Aquí SÍ está
    ...
}
```

**Explicación del Fallo:**
- Hay **inconsistencia entre cómo se construyen los payloads** para cotización vs. generación de etiqueta
- Envia **requiere el campo `service`** para determinar qué tipo de envío cotizar (estándar, express, etc.)
- Sin `service` explícito, Envia puede asumir un valor por defecto o rechazar con error 400
- La documentación de Envia no está clara en el código, pero el hecho de que `generar_etiqueta_envio_view()` lo incluya sugiere que **es obligatorio**

**Impacto:**
- Cotizaciones pueden ser incompletas o rechazadas
- Inconsistencia en los datos enviados a Envia afecta la calidad de las respuestas

---

### 5. **Tipo de Dato No Validado: `codigo_postal` desde React**

**Ubicación:**
- `views.py`, línea 917 (en `cotizar_envio_api()`)
- `views.py`, línea 952 (en `obtener_sucursales_api()`)

**Problema Detectado:**
```python
@api_view(['POST'])
def cotizar_envio_api(request):
    codigo_postal = request.data.get('codigo_postal')  # ❌ No se valida tipo
    
    if not codigo_postal:
        return Response({"error": True, "mensaje": "Debes enviar un código postal."}, status=400)
        
    resultado = calcular_costo_envio(codigo_postal)  # Se pasa directamente
```

Luego en `services_envia.py`, línea 32:
```python
url = f"https://geocodes.envia.com/zipcode/AR/{codigo_postal}"  # ❌ No hay sanitización
```

**Explicación del Fallo:**

**Caso 1: React envía integer en lugar de string**
```python
# React envía: {"codigo_postal": 2400}  (integer)
# Python recibe: codigo_postal = 2400
# URL generada: https://geocodes.envia.com/zipcode/AR/2400  ✅ OK por esta vez
# Pero si React envía: {"codigo_postal": 2400.5}
# URL generada: https://geocodes.envia.com/zipcode/AR/2400.5  ❌ Inválido
```

**Caso 2: Caracteres especiales o espacios**
```python
# React envía: {"codigo_postal": "2400 "}  (con espacio)
# URL generada: https://geocodes.envia.com/zipcode/AR/2400 %20 (URL-encoded)
# Geocodes podría rechazarlo
```

**Caso 3: Valores inesperados**
```python
# React envía: {"codigo_postal": "null"}  (string "null")
# O: {"codigo_postal": ""}  (string vacío)
# O: {"codigo_postal": "-1"}  (negativo)
# Python no valida nada de esto
```

**Impacto:**
- Requests malformados a Geocodes API
- Errores 400 de Geocodes que no se manejan correctamente
- Sin validación, cualquier valor se intenta procesar

---

### 6. **Estructura de Respuesta JSON Asumida sin Validación**

**Ubicación:**
- `services_envia.py`, líneas 108-119 (en `calcular_costo_envio()`)
- `services_envia.py`, líneas 169-189 (en `buscar_sucursales_cercanas()`)

**Problema Detectado:**

En `calcular_costo_envio()`:
```python
response_data = response.json()
if 'data' in response_data and response_data['data']:
    lista_opciones = []
    for op in response_data['data']:
        lista_opciones.append({
            "id": op.get('carrierId'),                           # ❌ Asume existe
            "proveedor": op.get('carrierDescription', '...'),    # ❌ Sin validación
            "servicio": op.get('serviceDescription', '...'),
            "costo": float(op.get('totalPrice', 0)),
            "tiempo_entrega": op.get('deliveryEstimate', '...'),
            "carrier_code": op.get('carrier', 'correoargentino').lower(),
            "service_code": op.get('service', 'estandar').lower()
        })
```

**Explicación del Fallo:**

- **Sin validación de estructura:** Si Envia devuelve un JSON con keys diferentes (ej: `carrier_id` en lugar de `carrierId`), los valores llegarán como `None`
- **Sin validación de tipos:** ¿Qué pasa si `totalPrice` es un string en lugar de número? `float(str)` podría fallar
- **Sin validación de campos requeridos:** El diccionario se construye aunque falten campos críticos
- **Sin try-catch para tipos incorrectos:** Si `totalPrice` es un string como `"unavailable"`, `float()` lanzará una excepción no capturada

En `buscar_sucursales_cercanas()`:
```python
for op in response_data['data']:
    for branch in op.get('branches', []):  # ❌ Asume que 'branches' existe y es iterable
        sucursales_resultado.append({
            "nombre": _str_field(branch.get('name') or branch.get('alias')),
            # ... más campos ...
        })
```

**Impacto:**
- Si la respuesta de Envia cambia de estructura, el sistema puede fallar con excepciones no capturadas
- Campos `None` se devuelven al cliente sin validación

---

### 7. **Logging Insuficiente Dificulta Debugging**

**Ubicación:**
- `services_envia.py`, línea 42 (en `obtener_datos_geograficos()`)
- `services_envia.py`, línea 44 (catch genérico)

**Problema Detectado:**
```python
try:
    response = requests.get(url, timeout=5)
    if response.status_code == 200:
        res_data = response.json()
        if res_data.get("success") and "data" in res_data:
            # ...
except Exception as e:
    logger.error(f"Error consultando Geocodes API: {e}")  # ❌ Log genérico
return None
```

**Explicación del Fallo:**

- El catch general no distingue entre:
  - Timeout de red
  - JSON inválido
  - Status code ≠ 200
  - `success: False` en la respuesta

- No se loga la URL que fue consultada, la respuesta de Envia, ni el status code

- Si el problema es que Envia devuelve `{"success": False}`, **no hay log diferenciado** para esto (sale del if pero no entra en el except)

- Los print statements en `calcular_costo_envio()` y `buscar_sucursales_cercanas()` (líneas 67, 130) son de debug y no reemplazan a logging estructurado

**Impacto:**
- Cuando algo falla, es muy difícil determinar la causa real
- Los desarrolladores no tienen visibilidad del flujo real de datos

---

### 8. **Inconsistencia: `generar_etiqueta_envio_view()` Extrae Datos que No Vienen en la Respuesta de Cotización**

**Ubicación:**
- `views.py`, líneas 904-911 (en `generar_etiqueta_envio_view()`)

**Problema Detectado:**
```python
payload = {
    # ...
    "shipment": {
        "carrier": pedido.envia_carrier or "correoargentino", 
        "service": pedido.envia_service or "estandar", 
        # ...
    }
}
```

**Pregunta sin respuesta:** ¿De dónde vienen `pedido.envia_carrier` y `pedido.envia_service`?

Buscando en `views.py`, línea 638-639 (en `CrearPedidoView`):
```python
envia_carrier=request.data.get('envia_carrier'),
envia_service=request.data.get('envia_service')
```

**Explicación del Fallo:**

- En `cotizar_envio_api()`, se **devuelve** `carrier_code` y `service_code`:
  ```python
  "carrier_code": op.get('carrier', 'correoargentino').lower(),
  "service_code": op.get('service', 'estandar').lower()
  ```

- Pero **no hay documentación clara** de si React debe tomar estos valores y guardarlos en el campo de `envia_carrier` y `envia_service`

- Esto asume un **contrato implícito entre Frontend y Backend** que no está documentado

**Impacto:**
- Si React no mapea correctamente los valores retornados por la cotización, al generar la etiqueta se usará el fallback `"correoargentino"` y `"estandar"` en lugar del carrier/service real seleccionado por el cliente
- El cliente selecciona "Express" pero se envía como "Estándar"

---

## 🟡 PROBLEMAS POTENCIALES (ALTO RIESGO)

### 9. **Validación Incompleta de Status Code HTTP**

**Ubicación:**
- `services_envia.py`, línea 104 (en `calcular_costo_envio()`)
- `services_envia.py`, línea 145 (en `buscar_sucursales_cercanas()`)

**Problema Detectado:**
```python
if response.status_code != 200:
    return {"error": True, "mensaje": f"Fallo al cotizar (HTTP {response.status_code})."}
```

**Explicación del Fallo:**
- Solo acepta `200`, pero no acepta otros códigos exitosos como `201 Created`, `202 Accepted`, etc.
- En APIs REST, múltiples 2xx pueden ser válidos
- Si Envia cambia su API para devolver 201, el sistema fallaría

---

### 10. **Sin Reintentos o Rate Limiting**

**Ubicación:** `services_envia.py`, líneas 32-44, 100-120, 140-190

**Problema Detectado:**
- No hay lógica de reintentos en caso de:
  - Timeout (`timeout=5` está configurado, pero si expira, no hay reintento)
  - Error 429 (rate limit de Envia)
  - Error 503 (servicio temporal no disponible)

**Explicación del Fallo:**
- Si Envia está temporalmente no disponible o el usuario es rate-limited, el sistema falla inmediatamente
- Una búsqueda de sucursales que falla podría reintentarse automáticamente después de N segundos
- Sin reintentos, hay una experiencia de usuario pobre

---

### 11. **Conversión de Datos de `request.FILES` sin Validación**

**Ubicación:** `views.py`, línea 922 (en `cotizar_envio_api()`)

**Problema Detectado:**
```python
codigo_postal = request.data.get('codigo_postal')
```

**Explicación del Fallo:**
- No hay validación de que `codigo_postal` sea un string válido
- No hay límite de longitud
- No hay validación de caracteres (¿puede ser negativo? ¿puede tener letras?)
- En Argentina, los códigos postales son de 4 dígitos (antes) o 8 con formato A1A 1A1 (ahora)
- Sin validación, el sistema acepta cualquier cosa

---

### 12. **Validación de Configuración Incompleta**

**Ubicación:**
- `services_envia.py`, líneas 59-60 (en `calcular_costo_envio()`)
- `services_envia.py`, línea 124 (en `buscar_sucursales_cercanas()`)
- `services_envia.py`, línea 201 (en `rastrear_envios()`)

**Problema Detectado:**
```python
config = StoreConfiguration.objects.filter(is_active=True).first()

if not config or not config.api_key_envia:
    return {"error": True, "mensaje": "Token de Envia no definido."}
```

**Explicación del Fallo:**
- No valida que `config.peso_estandar`, `config.largo_estandar`, etc. estén definidos
- Si `config.peso_estandar` es `None`, la línea:
  ```python
  "weight": float(config.peso_estandar),
  ```
  Lanzará un TypeError: `float() argument must be a string or a number, not 'NoneType'`
- Sin validación de estos campos, el sistema podría crashear

---

### 13. **Sin Validación de Campos Obligatorios en `obtener_datos_geograficos()`**

**Ubicación:** `services_envia.py`, líneas 36-40

**Problema Detectado:**
```python
data = res_data["data"]
if isinstance(data, list) and len(data) > 0:
    return data[0]
elif isinstance(data, dict):
    return data
```

**Explicación del Fallo:**
- Si `data` es una lista vacía `[]`, la función devuelve `None` (implícitamente)
- Si `data[0]` no tiene los campos `city` o `state`, luego se usará el fallback genérico sin avisar
- No hay validación de que el primer elemento de la lista sea lo esperado

---

### 14. **Error Handling Asimétrico entre Funciones**

**Ubicación:** Comparar:
- `calcular_costo_envio()`: Devuelve `{"error": True, "mensaje": "..."}` en varios puntos
- `buscar_sucursales_cercanas()`: Devuelve `{"error": True, "mensaje": "..."}` pero también tiene prints de debug
- `obtener_datos_geograficos()`: Devuelve `None` en lugar de un diccionario de error

**Explicación del Fallo:**
- Las tres funciones usan patrones inconsistentes para reportar errores
- `obtener_datos_geograficos()` devuelve `None`, pero las otras devuelven diccionarios
- Esto hace que el código que llama a estas funciones tenga que tener lógica condicional asimétrica
- Dificulta el mantenimiento y las pruebas

---

### 15. **Falta de Typing Hints en Funciones**

**Ubicación:** Todo `services_envia.py`

**Problema Detectado:**
```python
def obtener_datos_geograficos(codigo_postal):  # ❌ Sin type hints
    # ...
    return data[0]  # o None o dict o list

def calcular_costo_envio(codigo_postal_destino):  # ❌ Sin type hints
    # ...
    return {"error": True, ...} or {"error": False, "tipo": "Local", ...} or {...}
```

**Explicación del Fallo:**
- Sin type hints, no hay claridad sobre qué devuelve cada función
- `calcular_costo_envio()` devuelve múltiples estructuras posibles
- Dificulta el uso de IDEs para autocompletar y detectar errores
- Sin type checking, los bugs se descubren en runtime

---

### 16. **Documentación API no Refleja Estructura Real**

**Ubicación:** Comentarios en `services_envia.py` (líneas 3-147 aprox)

**Problema Detectado:**
```python
# ─────────────────────────────────────────────────────────────────────────────
#  2. BUSCAR SUCURSALES
# ─────────────────────────────────────────────────────────────────────────────
```

**Explicación del Fallo:**
- Hay comentarios que explican qué hace cada función, pero no hay documentación sobre:
  - Qué estructura retorna `obtener_datos_geograficos()` exactamente
  - Qué campos son obligatorios en la respuesta de `calcular_costo_envio()`
  - Qué significa `type: 1` vs `type: 2` en el shipment
  - Cómo mapear `carrier_code` y `service_code` desde React

---

### 17. **Código Dead: Payloads Duplicados**

**Ubicación:** 
- `views.py`, línea 576-603 (en `MercadoPagoPreferenceView`)
- vs `views.py`, línea 730-759 (en `CrearPedidoView`)

**Problema Detectado:**
Hay código de preferencia de Mercado Pago duplicado que no se usa y añade confusión:

```python
class MercadoPagoPreferenceView(APIView):
    def post(self, request):
        # ... construcción manual de preference ...
        return Response({'id': preference_response["response"]['id']}, ...)
```

Pero en `CrearPedidoView`, el mismo código existe embebido. Esto no es directamente un error de Envia, pero indica que el código necesita refactorización.

---

### 18. **Sin Caché para Búsquedas de Geocodes**

**Ubicación:** `services_envia.py`, línea 28

**Problema Detectado:**
```python
def obtener_datos_geograficos(codigo_postal):
    url = f"https://geocodes.envia.com/zipcode/AR/{codigo_postal}"
    try:
        response = requests.get(url, timeout=5)  # ❌ Cada búsqueda es una request HTTP
```

**Explicación del Fallo:**
- Si el usuario intenta cotizar el mismo código postal múltiples veces, se hace una request a Geocodes cada vez
- Los códigos postales de Argentina NO cambian (son datos estáticos)
- Sin caché, se genera traffic innecesario y latencia
- Django proporciona `@cache_page` y `cache.get/set()` que no se usan

---

## 📊 TABLA RESUMEN DE PROBLEMAS

| # | Severidad | Función | Problema | Impacto |
|---|-----------|---------|---------|--------|
| 1 | 🔴 CRÍTICO | `obtener_datos_geograficos()` | Fallo silencioso sin distinción de causa | Client ve error genérico sin saber por qué |
| 2 | 🔴 CRÍTICO | `calcular_costo_envio()`, `buscar_sucursales_cercanas()` | Fallback genérico a "Córdoba"/"CB" | Cotización incorrecta en otro CP |
| 3 | 🔴 CRÍTICO | `calcular_costo_envio()` | Payload con dirección ficticia "Calle Falsa 123" | Envia rechaza con 400; no se sabe por qué |
| 4 | 🔴 CRÍTICO | `calcular_costo_envio()`, `buscar_sucursales_cercanas()` | Falta `service` en shipment payload | Inconsistencia vs. generación de etiqueta |
| 5 | 🔴 CRÍTICO | `cotizar_envio_api()`, `obtener_sucursales_api()` | Sin validación de tipo/rango en `codigo_postal` | URLs malformadas a Geocodes |
| 6 | 🔴 CRÍTICO | `calcular_costo_envio()`, `buscar_sucursales_cercanas()` | Estructura JSON asumida sin validación | Campos None o exceptions no capturadas |
| 7 | 🔴 CRÍTICO | `obtener_datos_geograficos()` | Logging insuficiente | Debugging imposible en producción |
| 8 | 🔴 CRÍTICO | `generar_etiqueta_envio_view()` | Contrato implícito con React sobre `envia_carrier`/`envia_service` | Cliente selecciona "Express" pero se envía "Estándar" |
| 9 | 🟡 ALTO | `calcular_costo_envio()`, `buscar_sucursales_cercanas()` | Solo acepta HTTP 200 | Si Envia usa 201, falla |
| 10 | 🟡 ALTO | Todas | Sin reintentos en timeouts/errores transitorios | Mala UX ante fallos temporales |
| 11 | 🟡 ALTO | `cotizar_envio_api()` | Sin validación de `codigo_postal` | Acepta valores inválidos |
| 12 | 🟡 ALTO | `calcular_costo_envio()`, etc. | No valida campos de `StoreConfiguration` | TypeError si `peso_estandar` es None |
| 13 | 🟡 ALTO | `obtener_datos_geograficos()` | Sin validación de estructura de respuesta | Return `None` implícitamente en edge cases |
| 14 | 🟡 ALTO | Todas | Error handling asimétrico | Lógica condicional confusa |
| 15 | 🟡 ALTO | `services_envia.py` | Sin type hints | No hay autocomplete ni type checking |
| 16 | 🟡 ALTO | Comentarios | Documentación incompleta | Developers no entienden contratos |
| 17 | 🟡 MEDIO | `views.py` | Código duplicado MercadoPagoPreferenceView | Confusión y difícil de mantener |
| 18 | 🟡 MEDIO | `obtener_datos_geograficos()` | Sin caché para datos estáticos | Traffic HTTP innecesario |

---

## 🎯 RECOMENDACIONES PRIORITARIAS

### Corto Plazo (Críticos - FIX ASAP):
1. **Agregar validación explícita en `obtener_datos_geograficos()`** para distinguir errores y loguear correctamente
2. **Validar `codigo_postal` en las vistas** antes de pasar a los servicios
3. **Reemplazar direcciones ficticias** en los payloads con variables configurables o valores reales del cliente
4. **Estandarizar error handling** en todos los servicios (devolver diccionarios siempre, nunca `None`)

### Mediano Plazo (Alto Riesgo):
5. **Agregar type hints** a todas las funciones en `services_envia.py`
6. **Documentar el contrato** entre React → Backend sobre `envia_carrier` y `envia_service`
7. **Validar configuración completa** de `StoreConfiguration` al inicio de cada función

### Largo Plazo (Mejoras):
8. **Implementar caché** para respuestas de Geocodes
9. **Agregar reintentos con backoff exponencial** en fallos transitorios
10. **Refactorizar código duplicado** de Mercado Pago
11. **Agregar unit tests** que simulen respuestas de Envia con estructuras inesperadas

---

## 📝 NOTAS FINALES

La integración con Envia tiene una arquitectura conceptualmente correcta, pero sufre de:
- **Enmascaramiento de errores:** Fallbacks genéricos que esconden los problemas reales
- **Falta de validación:** Asume que los datos externos son correctos
- **Inconsistencia de patrones:** Diferentes funciones manejan errores diferente
- **Documentación incompleta:** Contratos implícitos entre capas no están claros

**Estos problemas son típicos de sistemas que crecieron sin pruebas unitarias.** Recomiendo establecer tests que simulen respuestas de Envia defectuosas para detectar estos bugs antes de producción.

