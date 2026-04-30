import React from 'react';
import { Link } from 'react-router-dom'; // Importante para navegar sin recargar
import { ShoppingCart, Store, User } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ cartCount = 0 }) => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Usamos Link en lugar de a */}
                <Link to="/" className="navbar-logo" style={{ textDecoration: 'none' }}>
                    <Store size={28} className="logo-icon" />
                    <span>TELAS<span>APP</span></span>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className="nav-link">Inicio</Link>
                    <Link to="/productos" className="nav-link">Productos</Link>
                </div>

                <div className="navbar-actions">
                    <button className="icon-btn">
                        <User size={22} />
                    </button>
                    
                    {/* Botón del carrito ahora es un Link a la ruta /carrito */}
                    <Link to="/carrito" className="icon-btn cart-btn">
                        <ShoppingCart size={22} />
                        {cartCount > 0 && (
                            <span className="cart-badge">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;