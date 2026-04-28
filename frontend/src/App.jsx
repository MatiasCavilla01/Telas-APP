import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos el Layout (el esqueleto)
import Dashboard from './pages/Dashboard';

// Importamos las páginas fragmentadas
import VistaInicio from './pages/dashboard/VistaInicio';
import VistaProductos from './pages/dashboard/VistaProductos';
import VistaCategorias from './pages/dashboard/VistaCategorias';
import VistaDiseno from './pages/dashboard/VistaDiseno';
import VistaStats from './pages/dashboard/VistaStats';
import VistaPedidos from './pages/dashboard/VistaPedidos';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirigimos la raíz al dashboard por ahora */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Ruta Padre: Dashboard (Acá está el Sidebar y el Outlet) */}
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<VistaInicio />} />
          <Route path="productos" element={<VistaProductos />} />
          <Route path="categorias" element={<VistaCategorias />} />
          <Route path="diseno" element={<VistaDiseno />} />
          <Route path="stats" element={<VistaStats />} />
          <Route path="pedidos" element={<VistaPedidos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;