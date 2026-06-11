import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// Importá tus componentes de UI acá (ajustá la ruta si es necesario)
import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import CheckItem from '../../components/CheckItem';

const API = import.meta.env.VITE_API_URL + '/api';

const VistaInicio = () => {
  const [stats, setStats] = useState({ productos: 0, pedidos: 0, ventas: 0 });
  const navigate = useNavigate();
  const location = useLocation();

  // --- ESTADO PARA SABER SI MERCADO PAGO YA ESTÁ VINCULADO ---
  const [estaVinculadoMp, setEstaVinculadoMp] = useState(false);

  // --- LÓGICA PARA LEER SI VENIMOS DE VINCULAR CON ÉXITO ---
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('success') === 'mp_vinculado') {
      setEstaVinculadoMp(true);
    }
  }, [location.search]);

  useEffect(() => {
    axios.get(`${API}/productos/`).then(res => {
      const productos = Array.isArray(res.data) ? res.data.length : (res.data.count || 0);
      setStats(prev => ({ ...prev, productos }));
    }).catch(() => {});
  }, []);

  // --- FUNCIÓN PARA CONECTAR MERCADO PAGO CON VALIDACIONES ---
  const handleVincularMP = () => {
    // 1. Verificamos si ya está vinculado
    if (estaVinculadoMp) {
      window.alert("Actualmente ya estás vinculado con Mercado Pago.");
      return; 
    }

    // 2. Si no está vinculado, le preguntamos si está seguro
    const confirmar = window.confirm("¿Seguro que quieres vincular con Mercado Pago?");
    
    // 3. Si hace clic en "Aceptar", lo mandamos a MP
    if (confirmar) {
      const APP_ID = import.meta.env.VITE_MP_APP_ID; 
      const REDIRECT_URI = "https://ignaciozurbriggen.pythonanywhere.com/api/mercadopago/callback/";
      const TIENDA_ID = "1"; 

      const urlMP = `https://auth.mercadopago.com/authorization?client_id=${APP_ID}&response_type=code&platform_id=mp&state=${TIENDA_ID}&redirect_uri=${REDIRECT_URI}`;
      
      window.location.href = urlMP; 
    }
  };

  return (
    <div>
      <Header title="Inicio" subtitle="¡Chequeá los pasos para dejar tu tienda a tu manera!" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Productos cargados" value={stats.productos} color="#6366f1" />
        <StatCard label="Pedidos del mes"    value={stats.pedidos}   color="#f59e0b" />
        <StatCard label="Ventas totales"     value={`$${stats.ventas}`} color="#10b981" />
      </div>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Tareas para empezar</span>
        </div>
        
        <CheckItem 
            label="Registrar venta en local" 
            desc="Facturar y descontar stock del mostrador" 
            icon="home" 
            onClick={() => navigate('/dashboard/venta-local')} 
        />
        
        <CheckItem label="Agregar productos" desc="Cargá tu catálogo de productos con precio y talle" icon="products" onClick={() => navigate('/dashboard/productos')} />
        <CheckItem label="Crear categorías" desc="Organizá tus productos por categoría" icon="category" onClick={() => navigate('/dashboard/categorias')} />
        <CheckItem label="Personalizar diseño" desc="Cambiá el banner principal de tu tienda" icon="design" onClick={() => navigate('/dashboard/diseno')} />
        <CheckItem label="Gestionar ventas y pedidos" desc="Revisá y administrá tus órdenes" icon="orders" onClick={() => navigate('/dashboard/pedidos')} />
        
        {/* 👇 BOTÓN DE MERCADO PAGO EN LA LISTA DE TAREAS 👇 */}
        <div 
          onClick={handleVincularMP}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 24px',
            backgroundColor: estaVinculadoMp ? '#ecfdf5' : '#f0f9ff',
            borderTop: '1px solid #f1f5f9',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = estaVinculadoMp ? '#d1fae5' : '#e0f2fe';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = estaVinculadoMp ? '#ecfdf5' : '#f0f9ff';
          }}
        >
          <div style={{
            width: '40px', height: '40px', 
            backgroundColor: estaVinculadoMp ? '#10b981' : '#009EE3', 
            borderRadius: '8px', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', marginRight: '16px', flexShrink: 0
          }}>
            <span style={{ fontSize: '20px' }}>{estaVinculadoMp ? '✅' : '🤝'}</span>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: estaVinculadoMp ? '#065f46' : '#0f172a' }}>
              {estaVinculadoMp ? 'Mercado Pago Vinculado' : 'Empezá a cobrar con Mercado Pago'}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: estaVinculadoMp ? '#047857' : '#475569' }}>
              {estaVinculadoMp 
                ? 'Tu cuenta ya está conectada para recibir dinero.' 
                : 'Vinculá tu cuenta oficial para recibir el dinero de tus ventas al instante.'}
            </p>
          </div>
          <div style={{ color: estaVinculadoMp ? '#10b981' : '#009EE3', fontWeight: 'bold', fontSize: '18px' }}>
            ›
          </div>
        </div>

      </Card>
    </div>
  );
};

export default VistaInicio;