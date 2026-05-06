import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Ruler } from 'lucide-react';
import Navbar from '../Navbar/Navbar';
import './Detalle_producto.css';

const DetalleProducto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [producto, setProducto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagenActiva, setImagenActiva] = useState(null); // Nuevo estado para la galería

    useEffect(() => {
        const fetchProducto = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/productos/${id}/`);
                if (!response.ok) {
                    throw new Error('No se pudo cargar el producto');
                }
                const data = await response.json();
                setProducto(data);
                // Establecemos la imagen principal como la activa por defecto
                setImagenActiva(data.imagen); 
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
                <div className="loader-container"><div className="loader"></div></div>
            </>
        );
    }

    if (error || !producto) {
        return (
            <>
                <Navbar />
                <div className="error-message">{error ? `Error: ${error}` : 'Producto no encontrado.'}</div>
            </>
        );
    }

    // Armamos un array con todas las imágenes (la principal + las de la galería)
    const todasLasImagenes = [
        producto.imagen, 
        ...(producto.imagenes_galeria?.map(img => img.imagen) || [])
    ].filter(Boolean); // filter(Boolean) elimina valores nulos si no hay imagen

    return (
        <>
            <Navbar />
            <div className="detalle-page">
                <div className="detalle-container">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <ArrowLeft size={18} strokeWidth={1.5} /> Volver
                    </button>

                    <div className="detalle-grid">
                        {/* SECCIÓN DE IMÁGENES ACTUALIZADA */}
                        <div className="detalle-galeria-wrapper">
                            {/* Imagen Principal Grande */}
                            <div className="detalle-imagen-container">
                                <img 
                                    src={imagenActiva || 'https://via.placeholder.com/600?text=Sin+Imagen'} 
                                    alt={producto.nombre} 
                                    className="detalle-imagen"
                                />
                            </div>
                            
                            {/* Miniaturas (Thumbnails) */}
                            {todasLasImagenes.length > 1 && (
                                <div className="detalle-miniaturas">
                                    {todasLasImagenes.map((img, index) => (
                                        <img 
                                            key={index}
                                            src={img}
                                            alt={`${producto.nombre} vista ${index + 1}`}
                                            className={`miniatura-img ${imagenActiva === img ? 'activa' : ''}`}
                                            onClick={() => setImagenActiva(img)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Información (Se mantiene igual) */}
                        <div className="detalle-info">
                            <span className="detalle-categoria">{producto.categoria.nombre || producto.categoria}</span>
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
                                <ShoppingBag size={20} />
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