import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Landmark, ArrowLeft, Check, User, MapPin, Building2 } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './CheckoutSelection.css';

const CheckoutSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const datosEnvio = location.state || {
        costoEnvio: 0,
        codigoPostal: '',
        tipoEnvio: 'Desconocido'
    };

    const [metodo, setMetodo] = useState('mercadopago');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [metodoEntrega, setMetodoEntrega] = useState('envio');

    // --- ESTADOS PARA ENVÍO A DOMICILIO ---
    const [opcionesEnvio, setOpcionesEnvio] = useState([]);
    const [opcionEnvioSeleccionada, setOpcionEnvioSeleccionada] = useState(null);
    const [isLoadingCotizacion, setIsLoadingCotizacion] = useState(false);
    const [errorCotizacion, setErrorCotizacion] = useState('');

    // --- ESTADOS PARA ENVÍO A SUCURSAL (NUEVO) ---
    const [sucursales, setSucursales] = useState([]);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
    const [isLoadingSucursales, setIsLoadingSucursales] = useState(false);
    const [errorSucursales, setErrorSucursales] = useState('');
    // 'domicilio' | 'sucursal'
    // TEMPORALMENTE FORZADO A 'domicilio' (comentar esta línea para reactivar sucursales)
    const [tipoEnvioSeleccionado, setTipoEnvioSeleccionado] = useState('domicilio');

    const [comprador, setComprador] = useState({
        nombre: '', apellido: '', email: '', dni: '', telefono: '',
        calle: '', numero: '', codigoPostal: datosEnvio.codigoPostal || '',
        ciudad: '', provincia: ''
    });

    const [cart] = useState(() => {
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const subtotalTelas = cart.reduce(
        (acc, item) => acc + (Number(item.precio_por_metro) * item.cantidad), 0
    );

    // Costo de envío según modalidad seleccionada
    const costoEnvioFinal = (() => {
        if (metodoEntrega === 'retiro') return 0;
        if (tipoEnvioSeleccionado === 'sucursal') {
            return sucursalSeleccionada?.costo ?? 0;
        }
        return opcionEnvioSeleccionada?.costo ?? 0;
    })();

    const totalAPagar = subtotalTelas + costoEnvioFinal;

    const formValido =
        comprador.nombre && comprador.apellido && comprador.email &&
        comprador.dni && comprador.telefono &&
        (metodoEntrega === 'retiro' || (
            comprador.calle && comprador.numero && comprador.codigoPostal &&
            (
                (tipoEnvioSeleccionado === 'domicilio' && opcionEnvioSeleccionada) ||
                (tipoEnvioSeleccionado === 'sucursal' && sucursalSeleccionada)
            )
        ));

    // =========================================================
    //  COTIZAR ENVÍO A DOMICILIO
    // =========================================================
    const handleCotizarDomicilio = async () => {
        if (!comprador.codigoPostal || comprador.codigoPostal.trim() === '') {
            setErrorCotizacion('Ingresá tu Código Postal');
            return;
        }

        setIsLoadingCotizacion(true);
        setErrorCotizacion('');
        setOpcionesEnvio([]);
        setOpcionEnvioSeleccionada(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/cotizar-envio/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_postal: comprador.codigoPostal })
            });

            const data = await response.json();
            // 👇 3. ESTE ES EL ESPÍA DEL FRONTEND (Aparecerá en la consola de Chrome F12) 👇
            console.log(`🔍 [TEST SUCURSALES] Respuesta de la API para el CP ${comprador.codigoPostal}:`, data);

            if (data.error) {
                setErrorCotizacion(data.mensaje || 'Error al cotizar');
            } else if (data.opciones && data.opciones.length > 0) {

                // Solo mostramos envíos a DOMICILIO en esta pestaña
                const opcionesFiltradas = data.opciones.filter(opcion => {
                    const servicioStr = (opcion.servicio || '').toLowerCase();
                    return servicioStr.includes('domicilio') && !servicioStr.includes('sucursal');
                });

                if (opcionesFiltradas.length === 0) {
                    setErrorCotizacion('No hay opciones de envío a domicilio para este CP. Probá enviando a sucursal.');
                    setIsLoadingCotizacion(false);
                    return;
                }

                const opcionesConIds = opcionesFiltradas.map((op, i) => ({
                    ...op,
                    id_unico: `${op.proveedor}-${op.servicio}-${i}`
                }));

                setOpcionesEnvio(opcionesConIds);
                setOpcionEnvioSeleccionada(opcionesConIds[0]);

            } else if (data.tipo === 'Local') {
                // Comisionista local
                const opcionLocal = {
                    id_unico: 'local_0',
                    proveedor: data.proveedor,
                    servicio: 'Comisionista',
                    costo: data.costo,
                    tiempo_entrega: '24-48hs'
                };
                setOpcionesEnvio([opcionLocal]);
                setOpcionEnvioSeleccionada(opcionLocal);
            } else {
                setErrorCotizacion('No se encontraron opciones de envío para este CP.');
            }
        } catch (error) {
            setErrorCotizacion('Error de conexión con el servidor.');
        } finally {
            setIsLoadingCotizacion(false);
        }
    };

    // =========================================================
    //  BUSCAR SUCURSALES CERCANAS
    // =========================================================
    const handleBuscarSucursales = async () => {
        if (!comprador.codigoPostal || comprador.codigoPostal.trim() === '') {
            setErrorSucursales('Ingresá tu Código Postal para buscar sucursales cercanas.');
            return;
        }

        setIsLoadingSucursales(true);
        setErrorSucursales('');
        setSucursales([]);
        setSucursalSeleccionada(null);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/envio/sucursales/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
        codigo_postal: comprador.codigoPostal,
        provincia: comprador.provincia,
        ciudad: comprador.ciudad
    })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                setErrorSucursales(data.mensaje || data.error || 'No se encontraron sucursales para este CP.');
                return;
            }

            if (data.sucursales && data.sucursales.length > 0) {
                setSucursales(data.sucursales);
                setSucursalSeleccionada(data.sucursales[0]);
            } else {
                setErrorSucursales('No hay sucursales cercanas disponibles para este código postal.');
            }
        } catch (error) {
            setErrorSucursales('Error de conexión al buscar sucursales.');
        } finally {
            setIsLoadingSucursales(false);
        }
    };

    const handleInputChange = (e) => {
        setComprador({ ...comprador, [e.target.name]: e.target.value });
        if (errorMsg) setErrorMsg('');

        if (e.target.name === 'codigoPostal') {
            setOpcionesEnvio([]);
            setOpcionEnvioSeleccionada(null);
            setErrorCotizacion('');
            setSucursales([]);
            setSucursalSeleccionada(null);
            setErrorSucursales('');
        }
    };

    // =========================================================
    //  PROCESAR PAGO
    // =========================================================
    const handleProcesarPago = async () => {
        if (!formValido) {
            setErrorMsg("Faltan completar algunos datos. Revisá el formulario.");
            return;
        }

        setLoading(true);
        try {
            const metodoPagoBackend = metodo === 'mercadopago' ? 'Mercado Pago' : 'Transferencia';

            let direccionFinal;
            let tipoEnvioFinal;
            let envia_carrier;
            let envia_service;

            if (metodoEntrega === 'retiro') {
                direccionFinal = "🏪 Retira en el local";
                tipoEnvioFinal = "Retiro en Local";
                envia_carrier = null;
                envia_service = null;
            } else if (tipoEnvioSeleccionado === 'sucursal') {
                const partesDir = [
                    sucursalSeleccionada.nombre,
                    sucursalSeleccionada.direccion,
                    sucursalSeleccionada.localidad,
                    sucursalSeleccionada.codigo_postal ? `CP ${sucursalSeleccionada.codigo_postal}` : '',
                    sucursalSeleccionada.horario ? `Horario: ${sucursalSeleccionada.horario}` : ''
                ].filter(Boolean);
                direccionFinal = `SUCURSAL: ${partesDir.join(' — ')}`;
                tipoEnvioFinal = `${sucursalSeleccionada.proveedor || 'Correo Argentino'} - Envío a Sucursal`;
                envia_carrier = sucursalSeleccionada.carrier_code || 'correoargentino';
                envia_service = sucursalSeleccionada.service_code || 'estandar';
            } else {
                direccionFinal = `${comprador.calle} ${comprador.numero}, CP: ${comprador.codigoPostal}`;
                tipoEnvioFinal = `${opcionEnvioSeleccionada.proveedor} - ${opcionEnvioSeleccionada.servicio}`;
                envia_carrier = opcionEnvioSeleccionada.carrier_code || opcionEnvioSeleccionada.id || 'correoargentino';
                envia_service = opcionEnvioSeleccionada.service_code || 'estandar';
            }

            const compradorConEnvio = {
                ...comprador,
                direccion_envio: direccionFinal
            };

            const payload = {
                items: cart,
                payer: compradorConEnvio,
                metodo_pago: metodoPagoBackend,
                costo_envio: costoEnvioFinal,
                tipo_envio: tipoEnvioFinal,
                envia_carrier,
                envia_service,
                total: totalAPagar
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/crear/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem('cart');
                if (data.status === 'redirect_mp') {
                    window.location.href = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${data.preference_id}`;
                } else if (data.status === 'awaiting_transfer') {
                    navigate('/transferencia-success', {
                        state: { pedidoId: data.pedido_id, total: totalAPagar, cliente: comprador.nombre }
                    });
                }
            } else {
                setErrorMsg(data.error || "Hubo un problema al procesar tu pedido.");
            }
        } catch (error) {
            setErrorMsg("Error de conexión con el servidor. Revisá tu internet.");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    //  HELPERS DE RENDER
    // =========================================================
    const getLogoUrl = (opcion) => {
        const esCorreo = (opcion.carrier_code || '').includes('correoargentino') ||
            (opcion.proveedor || '').toLowerCase().includes('correo argentino');
        
        // Usamos un ícono de paquete genérico y elegante para evitar errores 400 de URLs externas
        return esCorreo
            ? 'https://cdn-icons-png.flaticon.com/512/2769/2769339.png' // Ícono de caja/correo
            : 'https://cdn-icons-png.flaticon.com/512/1976/1976602.png';
    };
    // =========================================================
    //  RENDER
    // =========================================================
    return (
        <div className="checkout-selection-page">
            <Navbar cartCount={cart.length} />

            <div className="checkout-selection-container">
                <button className="back-button-simple" onClick={() => navigate('/carrito')}>
                    <ArrowLeft size={16} /> Volver a la bolsa
                </button>

                <header className="checkout-header">
                    <h1>Finalizar Compra</h1>
                    <p>Completá tus datos y elegí cómo pagar</p>
                </header>

                <div className="checkout-selection-layout">
                    <div className="checkout-left-column">

                        {/* ---- DATOS PERSONALES ---- */}
                        <div className="checkout-form-section">
                            <h3 className="section-title"><User size={20} /> Mis Datos Personales</h3>
                            <div className="form-grid">
                                <input type="text" name="nombre" placeholder="Nombre" value={comprador.nombre} onChange={handleInputChange} required />
                                <input type="text" name="apellido" placeholder="Apellido" value={comprador.apellido} onChange={handleInputChange} required />
                                <input type="email" name="email" placeholder="Correo electrónico" value={comprador.email} onChange={handleInputChange} className="full-width" required />
                                <input type="number" name="dni" placeholder="DNI" value={comprador.dni} onChange={handleInputChange} required />
                                <input type="tel" name="telefono" placeholder="Celular" value={comprador.telefono} onChange={handleInputChange} required />
                            </div>

                            {/* ---- MÉTODO DE ENTREGA ---- */}
                            <h3 className="section-title" style={{ marginTop: '35px' }}>
                                <MapPin size={20} /> Método de Entrega
                            </h3>

                            <div className="opciones-entrega-container">
                                <label className={`metodo-entrega-card ${metodoEntrega === 'envio' ? 'active' : ''}`}>
                                    <input type="radio" value="envio" checked={metodoEntrega === 'envio'} onChange={(e) => setMetodoEntrega(e.target.value)} />
                                    <span style={{ fontWeight: 500, color: '#1A1A1A' }}>🚚 Envío</span>
                                </label>
                                <label className={`metodo-entrega-card ${metodoEntrega === 'retiro' ? 'active' : ''}`}>
                                    <input type="radio" value="retiro" checked={metodoEntrega === 'retiro'} onChange={(e) => setMetodoEntrega(e.target.value)} />
                                    <span style={{ fontWeight: 500, color: '#1A1A1A' }}>🏪 Retira en el local</span>
                                </label>
                            </div>

                            {/* ---- SECCIÓN ENVÍO EXPANDIDA ---- */}
                            {metodoEntrega === 'envio' && (
                                <div className="datos-envio-container" style={{ animation: 'fadeIn 0.3s ease-out' }}>

                                    {/* --- Dirección y CP --- */}
                                    <div className="form-grid">
                                        <input
                                            type="text" name="calle" placeholder="Calle / Barrio"
                                            value={comprador.calle} onChange={handleInputChange}
                                            className="full-width" required
                                        />
                                        <input
                                            type="text" name="numero" placeholder="Número / Piso / Depto"
                                            value={comprador.numero} onChange={handleInputChange} required
                                        />
                                        <input
                                            type="text" name="ciudad" placeholder="Ciudad / Localidad"
                                            value={comprador.ciudad} onChange={handleInputChange} required
                                        />
                                        {/* --- DROPDOWN DE PROVINCIAS --- */}
                                        <select
                                            name="provincia"
                                            value={comprador.provincia}
                                            onChange={handleInputChange}
                                            required
                                            className="provincia-select"
                                        >
                                            <option value="" disabled>Seleccioná tu provincia</option>
                                            <option value="BA">Buenos Aires</option>
                                            <option value="CABA">Capital Federal (CABA)</option>
                                            <option value="CA">Catamarca</option>
                                            <option value="CH">Chaco</option>
                                            <option value="CU">Chubut</option>
                                            <option value="CB">Córdoba</option>
                                            <option value="CR">Corrientes</option>
                                            <option value="ER">Entre Ríos</option>
                                            <option value="FO">Formosa</option>
                                            <option value="JY">Jujuy</option>
                                            <option value="LP">La Pampa</option>
                                            <option value="LR">La Rioja</option>
                                            <option value="MZ">Mendoza</option>
                                            <option value="MI">Misiones</option>
                                            <option value="NQ">Neuquén</option>
                                            <option value="RN">Río Negro</option>
                                            <option value="SA">Salta</option>
                                            <option value="SJ">San Juan</option>
                                            <option value="SL">San Luis</option>
                                            <option value="SC">Santa Cruz</option>
                                            <option value="SF">Santa Fe</option>
                                            <option value="SE">Santiago del Estero</option>
                                            <option value="TF">Tierra del Fuego</option>
                                            <option value="TU">Tucumán</option>
                                        </select>

                                        {/* CP + Botón Calcular */}
                                        <div className="full-width" style={{ display: 'flex', gap: '10px', width: '100%', minWidth: 0 }}>
                                            <input
                                                type="text" name="codigoPostal" placeholder="Código Postal"
                                                value={comprador.codigoPostal} onChange={handleInputChange}
                                                required style={{ flex: 1, minWidth: 0 }}
                                            />
                                            {/* 🔴 SIMPLIFICADO: Ahora solo ejecuta handleCotizarDomicilio (sucursales deshabilitadas) */}
                                            <button
                                                type="button"
                                                onClick={handleCotizarDomicilio}
                                                disabled={isLoadingCotizacion || !comprador.codigoPostal}
                                                style={{
                                                    backgroundColor: '#1A1A1A', color: 'white', border: 'none',
                                                    padding: '0 15px', borderRadius: '6px', cursor: 'pointer',
                                                    fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem',
                                                    textTransform: 'uppercase', fontWeight: 500, whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {isLoadingCotizacion ? '...' : 'Calcular'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* --- Tabs: Domicilio vs Sucursal --- */}
                                    {/* 🔴 COMENTADO TEMPORALMENTE: Se ocultó la selección de sucursales para simplificar el flujo */}
                                    {/* 
                                    <div style={{
                                        display: 'flex', gap: '8px', marginTop: '18px', marginBottom: '4px'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTipoEnvioSeleccionado('domicilio');
                                                setErrorSucursales('');
                                                setErrorCotizacion('');
                                            }}
                                            style={{
                                                flex: 1, padding: '10px 0', borderRadius: '8px', border: '2px solid',
                                                borderColor: tipoEnvioSeleccionado === 'domicilio' ? '#1A1A1A' : '#ddd',
                                                backgroundColor: tipoEnvioSeleccionado === 'domicilio' ? '#1A1A1A' : 'white',
                                                color: tipoEnvioSeleccionado === 'domicilio' ? 'white' : '#555',
                                                fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem',
                                                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}
                                        >
                                            🏠 A domicilio
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTipoEnvioSeleccionado('sucursal');
                                                setErrorCotizacion('');
                                                setErrorSucursales('');
                                            }}
                                            style={{
                                                flex: 1, padding: '10px 0', borderRadius: '8px', border: '2px solid',
                                                borderColor: tipoEnvioSeleccionado === 'sucursal' ? '#1A1A1A' : '#ddd',
                                                backgroundColor: tipoEnvioSeleccionado === 'sucursal' ? '#1A1A1A' : 'white',
                                                color: tipoEnvioSeleccionado === 'sucursal' ? 'white' : '#555',
                                                fontFamily: "'Montserrat', sans-serif", fontSize: '0.8rem',
                                                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                            }}
                                        >
                                            <Building2 size={14} /> A sucursal
                                        </button>
                                    </div>
                                    */}

                                    {/* ========== ENVÍO A DOMICILIO ========== */}
                                    {tipoEnvioSeleccionado === 'domicilio' && (
                                        <>
                                            {errorCotizacion && (
                                                <p style={{ color: '#D9534F', fontSize: '0.85rem', marginTop: '10px' }}>
                                                    {errorCotizacion}
                                                </p>
                                            )}

                                            {opcionesEnvio.length > 0 && (
                                                <div className="envio-cards-container">
                                                    <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 8px', fontWeight: 500 }}>
                                                        Elegí una opción de envío:
                                                    </p>

                                                    {opcionesEnvio.map((opcion) => {
                                                        const estaSeleccionada = opcionEnvioSeleccionada?.id_unico === opcion.id_unico;
                                                        const nombreServicioLimpio = opcion.servicio.replace(opcion.proveedor, '').trim();

                                                        return (
                                                            <div
                                                                key={opcion.id_unico}
                                                                className={`envio-card ${estaSeleccionada ? 'selected' : ''}`}
                                                                onClick={() => setOpcionEnvioSeleccionada(opcion)}
                                                            >
                                                                <div className="envio-card-left">
                                                                    <div className="envio-logo" style={{ backgroundImage: `url(${getLogoUrl(opcion)})` }} />
                                                                    <div className="envio-info">
                                                                        <strong className="envio-proveedor">{opcion.proveedor}</strong>
                                                                        <span className="envio-detalle">{nombreServicioLimpio} • {opcion.tiempo_entrega}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="envio-card-right">
                                                                    <div className="envio-precio">${opcion.costo.toLocaleString('es-AR')}</div>
                                                                    <div className="envio-check">
                                                                        {estaSeleccionada && <Check size={14} color="white" strokeWidth={3} />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* ========== ENVÍO A SUCURSAL ========== */}
                                    {/* 🔴 COMENTADO TEMPORALMENTE: Se ocultó la sección completa de búsqueda de sucursales */}
                                    {/* 
                                    {tipoEnvioSeleccionado === 'sucursal' && (
                                        <>
                                            <p style={{ fontSize: '0.8rem', color: '#777', marginTop: '8px', lineHeight: 1.5 }}>
                                                Ingresá tu CP y presioná <strong>Calcular</strong> para ver las sucursales más cercanas de Correo Argentino.
                                            </p>

                                            {errorSucursales && (
                                                <p style={{ color: '#D9534F', fontSize: '0.85rem', marginTop: '10px' }}>
                                                    {errorSucursales}
                                                </p>
                                            )}

                                            {isLoadingSucursales && (
                                                <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '10px' }}>
                                                    Buscando sucursales cercanas...
                                                </p>
                                            )}

                                            {sucursales.length > 0 && (
                                                <div className="envio-cards-container">
                                                    <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 8px', fontWeight: 500 }}>
                                                        Sucursales cercanas:
                                                    </p>

                                                    {/* MAPA DE SUCURSALES COMENTADO */}
                                                    {false && sucursales.map((suc, index) => {
    const estaSeleccionada = sucursalSeleccionada?.id_unico === suc.id_unico;

    // Helpers para limpiar textos nulos
    const toStr = (v) => {
        if (!v) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') return Object.values(v).filter(Boolean).join(' ');
        return String(v);
    };

    const dirCompleta = [
        toStr(suc.direccion),
        toStr(suc.localidad),
        suc.codigo_postal ? `CP ${toStr(suc.codigo_postal)}` : ''
    ].filter(Boolean).join(', ');

    // Si la API no manda nombre, le ponemos un título genérico prolijo
    const nombreSucursal = suc.nombre || `Sucursal ${suc.proveedor || 'Correo Argentino'}`;

    return (
        <div
            key={`${suc.id_unico}-${index}`}
            className={`envio-card ${estaSeleccionada ? 'selected' : ''}`}
            onClick={() => setSucursalSeleccionada(suc)}
        >
            <div className="envio-card-left">
                {/* 1. Usamos la función getLogoUrl segura que arreglamos */}
                <div
                    className="envio-logo"
                    style={{ backgroundImage: `url(${getLogoUrl(suc)})` }}
                />
                
                <div className="envio-info">
                    <strong className="envio-proveedor">{nombreSucursal}</strong>

                    {/* Si tenemos la dirección, la mostramos */}
                    {dirCompleta && (
                        <span className="envio-detalle">
                            📍 {dirCompleta}
                        </span>
                    )}

                    {/* Si NO tenemos dirección (caso Envia genérico), mostramos un texto de ayuda */}
                    {!suc.direccion && (
                        <span className="envio-detalle" style={{ color: '#d97706', fontWeight: 500 }}>
                            📍 Se coordinará la sucursal exacta tras la compra
                        </span>
                    )}

                    {suc.horario && (
                        <span className="envio-detalle" style={{ color: '#666' }}>
                            🕐 Horarios: {suc.horario}
                        </span>
                    )}

                    {suc.tiempo_entrega && (
                        <span className="envio-detalle" style={{ color: '#888' }}>
                            ⏱ Llega en {suc.tiempo_entrega.replace('días', 'días hábiles')}
                        </span>
                    )}

                    {/* Dejamos el link al mapa oficial por si el cliente quiere chusmear */}
                    {!suc.direccion && (
                        <a
                            href={`https://www.correoargentino.com.ar/formularios/sucursales?cp=${suc.codigo_postal || comprador.codigoPostal}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ 
                                fontSize: '0.75rem', 
                                color: '#1a6eb5', 
                                display: 'inline-block', 
                                marginTop: '4px',
                                textDecoration: 'underline'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            Ver mapa de sucursales Correo Argentino
                        </a>
                    )}
                </div>
            </div>
            <div className="envio-card-right">
                <div className="envio-precio">
                    {suc.costo > 0
                        ? `$${suc.costo.toLocaleString('es-AR')}`
                        : 'Gratis'}
                </div>
                <div className="envio-check">
                    {estaSeleccionada && <Check size={14} color="white" strokeWidth={3} />}
                </div>
            </div>
        </div>
    );
})}

                                                    <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '10px', lineHeight: 1.5 }}>
                                                        ¿No encontrás tu sucursal?{' '}
                                                        <a
                                                            href={`https://www.correoargentino.com.ar/formularios/sucursales?cp=${comprador.codigoPostal}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#1a6eb5' }}
                                                        >
                                                            Buscá en el localizador oficial de Correo Argentino
                                                        </a>
                                                    </p>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="error-message-subtle">
                                    {errorMsg}
                                </div>
                            )}
                        </div>

                        {/* ---- MÉTODO DE PAGO ---- */}
                        <div className="payment-options">
                            <div className={`payment-card ${metodo === 'mercadopago' ? 'active' : ''}`} onClick={() => setMetodo('mercadopago')}>
                                <div className="payment-card-icon"><CreditCard size={24} strokeWidth={1.5} /></div>
                                <div className="payment-card-info">
                                    <h3>Mercado Pago</h3>
                                    <p>Tarjetas de crédito, débito y dinero en cuenta.</p>
                                </div>
                                <div className="selection-indicator">{metodo === 'mercadopago' && <Check size={16} color="white" />}</div>
                            </div>

                            <div className={`payment-card ${metodo === 'transferencia' ? 'active' : ''}`} onClick={() => setMetodo('transferencia')}>
                                <div className="payment-card-icon"><Landmark size={24} strokeWidth={1.5} /></div>
                                <div className="payment-card-info">
                                    <h3>Transferencia Bancaria</h3>
                                    <p>Transferí desde tu banco o billetera virtual.</p>
                                </div>
                                <div className="selection-indicator">{metodo === 'transferencia' && <Check size={16} color="white" />}</div>
                            </div>
                        </div>
                    </div>

                    {/* ---- RESUMEN LATERAL ---- */}
                    <aside className="checkout-summary">
                        <h2>Tu Pedido</h2>
                        <div className="summary-list">
                            {cart.map((item, index) => (
                                <div key={index} className="summary-item-mini">
                                    <span>{item.nombre} ({item.cantidad}m)</span>
                                    <span>${(item.precio_por_metro * item.cantidad).toLocaleString('es-AR')}</span>
                                </div>
                            ))}

                            <div className="summary-item-mini" style={{ borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '5px' }}>
                                <span>
                                    Envío{' '}
                                    {metodoEntrega === 'envio' && comprador.codigoPostal
                                        ? `(CP: ${comprador.codigoPostal})`
                                        : ''}
                                    {metodoEntrega === 'envio' && tipoEnvioSeleccionado === 'sucursal' && sucursalSeleccionada
                                        ? ` · ${sucursalSeleccionada.nombre}`
                                        : ''}
                                </span>
                                <span>
                                    {costoEnvioFinal > 0
                                        ? `$${costoEnvioFinal.toLocaleString('es-AR')}`
                                        : (metodoEntrega === 'retiro' ? 'Gratis' : 'A calcular')}
                                </span>
                            </div>
                        </div>

                        <div className="summary-total-line">
                            <span>Total a pagar</span>
                            <span className="total-amount">${totalAPagar.toLocaleString('es-AR')}</span>
                        </div>

                        <button className="btn-pay-now" onClick={handleProcesarPago} disabled={loading}>
                            {loading ? "Procesando..." : "Confirmar y Pagar"}
                        </button>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CheckoutSelection;