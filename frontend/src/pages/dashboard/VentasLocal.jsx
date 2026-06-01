import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VentasLocal.css'; 

const VentasLocal = () => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    
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
                setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
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
            setMensaje({ tipo: 'error', texto: 'Por favor, completa los metros y el monto.' });
            return;
        }

        try {
           const res = await axios.post('https://ignaciozurbriggen.pythonanywhere.com/api/pedido/venta-local/', {
                producto_id: productoSeleccionado.id,
                metros: metros,
                precio_cobrado: precioCobrado
            });
            
            setMensaje({ tipo: 'success', texto: 'Venta registrada y stock actualizado.' });
            
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
            <h2 className="ventas-header">Ventas en Local</h2>

            {mensaje.texto && (
                <div className={`alert ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {mensaje.tipo === 'success' ? '✅' : '⚠️'} {mensaje.texto}
                </div>
            )}

            <div className="ventas-grid">
                
                {/* --- PANEL IZQUIERDO: BUSCADOR --- */}
                <div className="ventas-card">
                    <h3 className="ventas-card-title">1. Inventario ({productos.length})</h3>
                    
                    <input 
                        type="text" 
                        className="input-moderno"
                        placeholder="Buscar por nombre de tela..." 
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        
                    />

                    <div className="lista-productos">
                        {cargando ? (
                            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>Cargando inventario...</p>
                        ) : productosFiltrados.length > 0 ? (
                            productosFiltrados.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`producto-item ${productoSeleccionado?.id === p.id ? 'active' : ''}`}
                                    onClick={() => setProductoSeleccionado(p)}
                                >
                                    <div className="producto-item-left">
                                        <img 
                                            src={p.imagen || 'https://via.placeholder.com/60?text=Tela'} 
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
                            <div className="empty-state" style={{ padding: '30px 10px', marginTop: '10px' }}>
                                <p>No se encontraron resultados para "{busqueda}"</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PANEL DERECHO: CAJA --- */}
                <div className="ventas-card">
                    <h3 className="ventas-card-title">2. Caja y Cobro</h3>
                    
                    {productoSeleccionado ? (
                        <form onSubmit={handleSubmit}>
                            <div className="selected-product-card">
                                <img 
                                    src={productoSeleccionado.imagen || 'https://via.placeholder.com/80?text=Tela'} 
                                    alt={productoSeleccionado.nombre} 
                                    className="selected-product-img"
                                />
                                <div className="selected-product-details">
                                    <span className="label">Tela Seleccionada</span>
                                    <span className="title">{productoSeleccionado.nombre || productoSeleccionado.name || productoSeleccionado.title}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="form-label">Metros a cortar</label>
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
                                <label className="form-label">Total Cobrado en mostrador ($)</label>
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
                                Confirmar Venta
                            </button>
                        </form>
                    ) : (
                        <div className="empty-state">
                            <span style={{ fontSize: '3rem' }}>✂️</span>
                            <p>Seleccioná una tela del inventario para iniciar el proceso de cobro.</p>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
};

export default VentasLocal;