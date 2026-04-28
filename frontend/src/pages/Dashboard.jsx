import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  return (
    <>
      {/* Importamos la fuente para que se aplique a todo el panel */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', sans-serif" }}>
        
        {/* Tu Sidebar fijo que ahora usa <NavLink> */}
        <Sidebar />
        
        <main style={{ flex: 1, marginLeft: 240, padding: '40px 48px', minHeight: '100vh' }}>
          {/* EL OUTLET ES LA CLAVE: 
             Acá es donde React Router va a renderizar VistaInicio, 
             VistaProductos, etc., dependiendo de la URL.
          */}
          <Outlet />
        </main>
        
      </div>
    </>
  );
};

export default Dashboard;