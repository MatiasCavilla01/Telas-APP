import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Home.css'; // Asegúrate de crear este archivo para los estilos
import { ShoppingCart } from 'lucide-react';
import Navbar from '../Navbar/Navbar.jsx';
import { useNavigate} from 'react-router-dom';

const Home = () => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    /*LOGICA DEL CARRITO DE COMPRAS*/
    const [cart, setCart] = useState(() => {
        // Intentar cargar el carrito guardado al iniciar
        const savedCart = localStorage.getItem('cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);     

    const agregarAlCarrito = (producto) => {
        setCart(prev => {
            const existe = prev.find(item => item.id === producto.id);
            if (existe) {
                return prev.map(item => 
                    item.id === producto.id ? {...item, cantidad: item.cantidad + 1} : item
                );
            }
            return [...prev, {...producto, cantidad: 1}];
        });
        alert(`${producto.nombre} agregado al carrito`); // Opcional: feedback
    };

    useEffect(() => {
        // Función para traer toda la info del backend
        const fetchData = async () => {
            try {
                // Hacemos ambas peticiones al mismo tiempo
                const [resProductos, resCategorias] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/productos/'),
                    axios.get('http://127.0.0.1:8000/api/categorias/')
                ]);

                setProductos(resProductos.data);
                setCategorias(resCategorias.data);
                setLoading(false);
                console.log("Productos cargados:", resProductos.data);
                console.log("Categorías cargadas:", resCategorias.data);    
            } catch (error) {
                console.error("Error cargando la web:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="loader">Cargando catálogo de telas...</div>;

    return (
        <div className="home-page">
            <Navbar cartCount={cart.reduce((acc, item) => acc + item.cantidad, 0)} />
            <div className="home-container">
                
                <header className="home-header" style={{ marginTop: '80px' }}>
                    <h1>Explora nuestra Colección</h1>
                    <p>Calidad premium en cada producto</p>
                </header>

                <nav className="categories-bar">
                    <button className="category-btn active">Todas</button>
                    {categorias.map(cat => (
                        <button key={cat.id} className="category-btn">{cat.nombre}</button>
                    ))}
                </nav>

                <main className="products-grid">
                    {productos.map(prod => (
                        <div key={prod.id} className="product-card" onClick={() => navigate(`/producto/${prod.id}`)} style={{ cursor: 'pointer' }} >
                            <div className="product-image-container">
                                <img 
                                    src={prod.imagen || 'https://via.placeholder.com/300'} 
                                    alt={prod.nombre} 
                                    className="product-image"
                                />
                            </div>
                            <div className="product-info">
                                <span className="product-tag">Nuevo</span>
                                <h3 className="product-title">{prod.nombre}</h3>
                                <p className="product-description">{prod.descripcion}</p>
                                <div className="product-footer">
                                    <span className="product-price">${Number(prod.precio).toLocaleString('es-AR')}</span>
                                    <div className="product-actions">
                                        <button 
                                        className="btn-detail" 
                                            onClick={(e) => { 
                                                      e.stopPropagation(); 
                                                    agregarAlCarrito(prod);}}> Comprar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default Home;