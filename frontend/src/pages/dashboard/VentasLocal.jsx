import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VentasLocal.css'; 

const VentasLocal = () => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    
    // Formulario de venta
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [metros, setMetros] = useState('');
    const [precioCobrado, setPrecioCobrado] = useState('');
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        axios.get('https://ignaciozurbriggen.pythonanywhere.com/api/productos/')
            .then((res) => {
                console.log("📡 Datos crudos desde Django:", res.data); // Para depurar en F12

                let dataExtraida = [];
                
                // Extractor absoluto: Busca la lista de telas en todas las estructuras posibles de Django Rest Framework
                if (Array.isArray(res.data)) {
                    dataExtraida = res.data; // Si viene como lista directa
                } else if (res.data && Array.isArray(res.data.results)) {
                    dataExtraida = res.data.results; // Si viene paginado por DRF
                } else if (res.data && Array.isArray(res.data.data)) {
                    dataExtraida = res.data.data; // Si viene envuelto en un objeto 'data'
                } else if (typeof res.data === 'object') {
                    // Si todo falla, busca la primera propiedad que sea una lista
                    for (let key in res.data) {
                        if (Array.isArray(res.data[key])) {
                            dataExtraida = res.data[key];
                            break;
                        }
                    }
                }

                setProductos(dataExtraida);
                setCargando(false);
            })
            .catch(err => {
                console.error("❌ Error cargando telas:", err);
                setMensaje({ tipo: 'error', texto: 'Error al conectar con la base de datos. Revisa que el backend esté corriendo.' });
                setCargando(false);
            });
    }, []);

    // Buscador instantáneo (con protección contra campos nulos)
    const productosFiltrados = productos.filter(p => {
        // Resguardo por si el serializador envía el nombre en otra variable
        const nombreTela = p.nombre || p.name || p.title || ''; 
        return nombreTela.toLowerCase().includes(busqueda.toLowerCase());
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!productoSeleccionado || !metros || !precioCobrado) {
            setMensaje({ tipo: 'error', texto: 'Completa los metros y el monto.' });
            return;
        }

        try {
           const res = await axios.post('https://ignaciozurbriggen.pythonanywhere.com/api/pedido/venta-local/', {
                producto_id: productoSeleccionado.id,
                metros: metros,
                precio_cobrado: precioCobrado
            });
            
            setMensaje({ tipo: 'success', texto: '✅ Venta registrada y stock descontado.' });
            
            // Descuenta el stock en la pantalla al instante
            setProductos(productos.map(p => 
                p.id === productoSeleccionado.id 
                    ? { ...p, stock_metros: res.data.nuevo_stock } 
                    : p
            ));
            
            // Limpia la caja
            setMetros('');
            setPrecioCobrado('');
            setProductoSeleccionado(null);
            setBusqueda('');
            
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
        } catch (err) {
            setMensaje({ 
                tipo: 'error', 
                texto: err.response?.data?.error || 'Error al procesar la venta.' 
            });
        }
    };

    return (
        <div className="ventas-container">
            <h2 className="ventas-header">🛍️ Mostrador: Ventas en Local</h2>

            {mensaje.texto && (
                <div className={`alert ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {mensaje.texto}
                </div>
            )}

            <div className="ventas-grid">
                
                {/* --- PASO 1: BUSCADOR RÁPIDO --- */}
                <div className="ventas-card">
                    {/* 👇 Agregamos un contador para que veas si está leyendo la base de datos */}
                    <h3 className="ventas-card-title">
                        1. Buscar Tela <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'normal' }}>({productos.length} en sistema)</span>
                    </h3>
                    
                    <input 
                        type="text" 
                        className="input-moderno"
                        placeholder="Ej: Gamuza, Seda..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        autoFocus
                    />

                    <div className="lista-productos">
                        {cargando ? (
                            <p style={{ opacity: 0.5, textAlign: 'center' }}>Conectando con el inventario...</p>
                        ) : productosFiltrados.length > 0 ? (
                            productosFiltrados.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`producto-item ${productoSeleccionado?.id === p.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setProductoSeleccionado(p);
                                    }}
                                >
                                    <div className="producto-info">
                                        {/* Fallback visual del nombre por seguridad */}
                                        <span className="nombre">{p.nombre || p.name || p.title || 'Tela sin nombre'}</span>
                                        <span className="precio">${p.precio_por_metro || 0} / metro</span>
                                    </div>
                                    <span className={`producto-stock ${(p.stock_metros || 0) <= 5 ? 'bajo' : ''}`}>
                                        {p.stock_metros || 0}m
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px' }}>
                                {productos.length === 0 
                                    ? "⚠️ La lista de telas llegó vacía desde el backend." 
                                    : `No se encontraron telas con "${busqueda}"`}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PASO 2: CAJA Y COBRO --- */}
                <div className="ventas-card">
                    <h3 className="ventas-card-title">2. Registrar Cobro</h3>
                    
                    {productoSeleccionado ? (
                        <form onSubmit={handleSubmit}>
                            <div className="alert alert-success" style={{ marginBottom: '20px', padding: '12px', display: 'block' }}>
                                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Tela a vender:</div>
                                <strong style={{ fontSize: '1.1rem' }}>
                                    {productoSeleccionado.nombre || productoSeleccionado.name || productoSeleccionado.title}
                                </strong>
                            </div>
                            
                            <div>
                                <label className="form-label">Metros a cortar:</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="input-moderno"
                                    value={metros}
                                    onChange={(e) => {
                                        const cant = e.target.value;
                                        setMetros(cant);
                                        const precioBase = productoSeleccionado.precio_por_metro || 0;
                                        if (cant && precioBase) {
                                            setPrecioCobrado((cant * precioBase).toFixed(2));
                                        } else {
                                            setPrecioCobrado('');
                                        }
                                    }}
                                    placeholder="Ej: 2.50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="form-label">Total Cobrado en Caja ($):</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="input-moderno"
                                    value={precioCobrado}
                                    onChange={(e) => setPrecioCobrado(e.target.value)}
                                    placeholder="Ej: 15000"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-submit">
                                💲 Confirmar Venta
                            </button>
                        </form>
                    ) : (
                        <div className="empty-state">
                            <span style={{ fontSize: '2rem', marginBottom: '10px' }}>👈</span>
                            <p>Buscá y tocá una tela en la lista de la izquierda para habilitar la caja.</p>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default VentasLocal;