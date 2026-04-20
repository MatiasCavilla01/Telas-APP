import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '20px 50px', 
      backgroundColor: 'white',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Telas-APP</div>
      <div style={{ display: 'flex', gap: '30px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Inicio</Link>
        <Link to="/nosotros" style={{ textDecoration: 'none', color: '#333' }}>Nosotros</Link>
      </div>
    </nav>
  );
};

export default Navbar;