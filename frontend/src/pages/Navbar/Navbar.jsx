import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import { ShoppingCart, Store, User, Menu, X } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ cartCount = 0 }) => {
    // Estado para controlar si el menú "sánguche" está abierto o cerrado
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Función para cerrar el menú cuando tocan un link en el celu
    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                
                {/* Botón Hamburguesa (Solo visible en móvil) */}
                <button className="mobile-menu-btn" onClick={toggleMenu}>
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                <Link to="/" className="navbar-logo" onClick={closeMenu}>
                    <Store size={28} className="logo-icon" />
                    <span>TELAS<span>APP</span></span>
                </Link>

                {/* Contenedor de links: se le agrega la clase 'active' si el menú está abierto */}
                <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className="nav-link" onClick={closeMenu}>Inicio</Link>
                    <Link to="/productos" className="nav-link" onClick={closeMenu}>Productos</Link>
                </div>

                <div className="navbar-actions">
                    <button className="icon-btn">
                        <User size={22} />
                    </button>
                    
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