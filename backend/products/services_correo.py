import json
import os

# 1. Definimos la ruta absoluta al archivo JSON
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(BASE_DIR, 'sucursales.json')
def compilar_diccionario_sucursales():
    """
    Lee el JSON y arma un diccionario donde la clave es el CP 
    y el valor es una lista de sucursales con ese CP.
    """
    try:
        with open(JSON_PATH, 'r', encoding='utf-8') as file:
            data = json.load(file)
    except FileNotFoundError:
        return {}

    # SOLUCIÓN AL ERROR: Si el JSON viene envuelto como {"sucursales": [...]},
    # extraemos la lista interna. Si ya es una lista, la usamos directamente.
    if isinstance(data, dict) and "sucursales" in data:
        lista_sucursales = data["sucursales"]
    elif isinstance(data, list):
        lista_sucursales = data
    else:
        return {}

    diccionario_cp = {}

    for item in lista_sucursales:
        # Nos aseguramos de que cada elemento sea un diccionario válido
        if not isinstance(item, dict):
            continue
            
        cp = item.get('cp')
        if not cp:
            continue
            
        if cp not in diccionario_cp:
            diccionario_cp[cp] = []
            
        diccionario_cp[cp].append({
            'codigo_sucursal': item.get('codigoSucursal'),
            'descripcion': item.get('descripcion'),
            'provincia': item.get('nombreProvincia')
        })

    return diccionario_cp
# 2. CARGA EN MEMORIA (El secreto de la velocidad)
# Al instanciarlo acá afuera, Python carga el JSON una sola vez cuando arranca 
# el servidor, no cada vez que un usuario hace una consulta.
MAPA_SUCURSALES = compilar_diccionario_sucursales()


# 3. LA FUNCIÓN DE BÚSQUEDA
def buscar_por_cp(codigo_postal):
    """
    Recibe un CP y busca instantáneamente en el diccionario.
    """
    cp_str = str(codigo_postal).strip()
    
    # .get() busca la clave. Si no la encuentra, devuelve una lista vacía []
    resultados = MAPA_SUCURSALES.get(cp_str, [])
    
    return resultados

# 4. EXTRA: Si realmente necesitas los Códigos Postales ordenados de mayor a menor 
# (por ejemplo, para renderizar un select en el frontend)
def obtener_cps_ordenados():
    cps = list(MAPA_SUCURSALES.keys())
    # Ordena de forma descendente (mayor a menor)
    cps.sort(reverse=True) 
    return cps