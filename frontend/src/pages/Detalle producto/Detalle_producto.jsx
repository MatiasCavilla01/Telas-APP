import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Ruler } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './Detalle_producto.css';

const DetalleProducto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducto = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/productos/${id}/`);
                if (!response.ok) {
                    throw new Error('No se pudo cargar el producto');
                }
                const data = await response.json();
                setProducto(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProducto();
    }, [id]);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="loader-container">
                    <div className="loader"></div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="error-message">Error: {error}</div>
            </>
        );
    }

    if (!producto) {
        return (
            <>
                <Navbar />
                <div className="error-message">Producto no encontrado.</div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="detalle-page">
                <div className="detalle-container">
                    {/* Botón para volver atrás */}
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                        Volver
                    </button>

                    <div className="detalle-grid">
                        {/* Columna Izquierda: Imagen */}
                        <div className="detalle-imagen-container">
                            <img 
                                src={producto.imagen || 'https://via.placeholder.com/600?text=Sin+Imagen'} 
                                alt={producto.nombre} 
                                className="detalle-imagen"
                            />
                        </div>

                        {/* Columna Derecha: Información */}
                        <div className="detalle-info">
                            <span className="detalle-categoria">Categoría #{producto.categoria}</span>
                            <h1 className="detalle-titulo">{producto.nombre}</h1>
                            <p className="detalle-precio">${parseFloat(producto.precio).toLocaleString('es-AR')}</p>
                            
                            <div className="detalle-talle">
                                <Ruler size={18} />
                                <span>Talle: <strong>{producto.talle}</strong></span>
                            </div>
                            
                            <div className="detalle-descripcion">
                                <h3>Descripción</h3>
                                <p>{producto.descripcion}</p>
                            </div>

                            <button className="btn-agregar-carrito">
                                <ShoppingCart size={20} />
                                Agregar al carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DetalleProducto;