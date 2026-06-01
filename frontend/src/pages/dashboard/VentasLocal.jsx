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
                let dataExtraida = [];
                
                if (Array.isArray(res.data)) {
                    dataExtraida = res.data; 
                } else if (res.data && Array.isArray(res.data.results)) {
                    dataExtraida = res.data.results; 
                } else if (res.data && Array.isArray(res.data.data)) {
                    dataExtraida = res.data.data; 
                } else if (typeof res.data === 'object') {
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
                setMensaje({ tipo: 'error', texto: 'Error de conexión.' });
                setCargando(false);
            });
    }, []);

    const productosFiltrados = productos.filter(p => {
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
            
            setMensaje({ tipo: 'success', texto: '✅ Venta registrada y stock actualizado.' });
            
            setProductos(productos.map(p => 
                p.id === productoSeleccionado.id 
                    ? { ...p, stock_metros: res.data.nuevo_stock } 
                    : p
            ));
            
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
                
                {/* --- PANEL IZQUIERDO: BUSCADOR --- */}
                <div className="ventas-card">
                    <h3 className="ventas-card-title">1. Buscar Tela <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'normal', textTransform: 'lowercase' }}>({productos.length} en sistema)</span></h3>
                    
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
                            <p style={{ opacity: 0.5, textAlign: 'center' }}>Cargando inventario...</p>
                        ) : productosFiltrados.length > 0 ? (
                            productosFiltrados.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`producto-item ${productoSeleccionado?.id === p.id ? 'active' : ''}`}
                                    onClick={() => setProductoSeleccionado(p)}
                                >
                                    <div className="producto-item-left">
                                        {/* Renderizado de la imagen de la tela */}
                                        <img 
                                            src={p.imagen || 'https://via.placeholder.com/48?text=Tela'} 
                                            alt={p.nombre || 'Tela'} 
                                            className="producto-thumb"
                                        />
                                        <div className="producto-info">
                                            <span className="nombre">{p.nombre || p.name || p.title || 'Tela sin nombre'}</span>
                                            <span className="precio">${p.precio_por_metro || 0} / metro</span>
                                        </div>
                                    </div>
                                    <span className={`producto-stock ${(p.stock_metros || 0) <= 5 ? 'bajo' : ''}`}>
                                        {p.stock_metros || 0}m
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '20px' }}>
                                {productos.length === 0 
                                    ? "⚠️ Inventario vacío." 
                                    : `No se encontraron resultados para "${busqueda}"`}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PANEL DERECHO: CAJA --- */}
                <div className="ventas-card">
                    <h3 className="ventas-card-title">2. Registrar Cobro</h3>
                    
                    {productoSeleccionado ? (
                        <form onSubmit={handleSubmit}>
                            {/* Tarjeta destacada del producto seleccionado */}
                            <div className="selected-product-card">
                                <img 
                                    src={productoSeleccionado.imagen || 'https://via.placeholder.com/70?text=Tela'} 
                                    alt={productoSeleccionado.nombre} 
                                    className="selected-product-img"
                                />
                                <div className="selected-product-details">
                                    <span className="label">Tela a vender</span>
                                    <span className="title">{productoSeleccionado.nombre || productoSeleccionado.name || productoSeleccionado.title}</span>
                                </div>
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
                                <i className="fas fa-check-circle"></i> Confirmar Venta
                            </button>
                        </form>
                    ) : (
                        <div className="empty-state">
                            <span style={{ fontSize: '2.5rem', marginBottom: '15px' }}>✂️</span>
                            <p>Seleccioná una tela del inventario para iniciar el proceso de cobro.</p>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default VentasLocal;