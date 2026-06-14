import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Clock, XCircle, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import './Estadisticas.css'; // 👈 Importamos los nuevos estilos

const EstadisticasDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/`);
                if (!response.ok) throw new Error('Respuesta de red no OK');
                const data = await response.json();
                setStats(data);
            } catch (error) {
                console.error("Error cargando estadísticas", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '15px' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <h3 style={{ color: '#64748b' }}>Analizando métricas...</h3>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (error || !stats) return (
        <div style={{ padding: '24px', textAlign: 'center', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '12px', margin: '24px' }}>
            <XCircle size={40} style={{ margin: '0 auto 10px auto' }} />
            <h2 style={{ margin: 0 }}>Error de conexión</h2>
            <p>No se pudieron cargar las estadísticas de la tienda.</p>
        </div>
    );

    const renderizarDetalle = () => {
        if (!categoriaSeleccionada || !stats.detalles[categoriaSeleccionada]) return null;
        const lista = stats.detalles[categoriaSeleccionada];
        
        const titulos = {
            ingresos: "Detalle de Ingresos",
            exitosos: "Pedidos Exitosos",
            pendientes: "Pedidos Pendientes",
            cancelados: "Pedidos Cancelados"
        };

        return (
            <div className="content-section">
                <div className="section-title">
                    {titulos[categoriaSeleccionada]}
                    <button className="close-btn" onClick={() => setCategoriaSeleccionada(null)}>Cerrar ✕</button>
                </div>
                
                {lista.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No hay registros en esta categoría.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="modern-table">
                          <thead>
                              <tr>
                                  <th>Pedido</th>
                                  <th>Estado</th>
                                  <th>Cliente</th>
                                  <th style={{ minWidth: '200px' }}>Detalle de Telas</th>
                                  <th>Total</th>
                              </tr>
                          </thead>
                          <tbody>
                              {lista.map((item, index) => {
                                  let bgEstado = '#f1f5f9', colorEstado = '#475569';
                                  let textoEstado = (item.estado || '').toUpperCase();
                                  
                                  if (textoEstado.includes('APROBADO') || textoEstado.includes('ENVIADO')) {
                                      bgEstado = '#d1fae5'; colorEstado = '#059669';
                                  } else if (textoEstado.includes('PENDIENTE') || textoEstado.includes('ESPERANDO')) {
                                      bgEstado = '#fef3c7'; colorEstado = '#d97706';
                                  } else if (textoEstado.includes('CANCELADO')) {
                                      bgEstado = '#fee2e2'; colorEstado = '#dc2626';
                                  }

                                  return (
                                      <tr key={index}>
                                          <td>
                                              <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '15px' }}>#{item.id}</div>
                                              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{item.fecha}</div>
                                          </td>
                                          <td>
                                              <span className="status-badge" style={{ backgroundColor: bgEstado, color: colorEstado }}>
                                                  {textoEstado}
                                              </span>
                                          </td>
                                          <td>
                                              <div style={{ color: '#334155', fontWeight: '600', fontSize: '14px' }}>{item.email}</div>
                                              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{item.telefono}</div>
                                          </td>
                                          <td style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
                                              {item.detalle_telas}
                                          </td>
                                          <td>
                                              <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '16px' }}>
                                                  ${parseFloat(item.total || 0).toLocaleString('es-AR')}
                                              </div>
                                              <div style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginTop: '6px' }}>
                                                  {(item.metodo_pago || 'TRANSFERENCIA').toUpperCase()}
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="stats-page-container">
            <div className="stats-header">
                <TrendingUp size={28} color="#0f172a" />
                <h1>Panel de Rendimiento</h1>
            </div>

            <div className="metrics-grid">
                {/* 1. Ingresos */}
                <div className={`metric-card ${categoriaSeleccionada === 'ingresos' ? 'active' : ''}`} onClick={() => setCategoriaSeleccionada('ingresos')}>
                    <div className="metric-header">
                        <h3>Ingresos Totales</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}><DollarSign size={20} /></div>
                    </div>
                    <h2 className="metric-value">${(stats?.ingresos || 0).toLocaleString('es-AR')}</h2>
                </div>

                {/* 2. Ventas */}
                <div className={`metric-card ${categoriaSeleccionada === 'exitosos' ? 'active' : ''}`} onClick={() => setCategoriaSeleccionada('exitosos')}>
                    <div className="metric-header">
                        <h3>Ventas Cerradas</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#e0e7ff', color: '#4f46e5' }}><ShoppingBag size={20} /></div>
                    </div>
                    <h2 className="metric-value">{stats?.pedidos?.exitosos || 0}</h2>
                </div>

                {/* 3. Pendientes */}
                <div className={`metric-card ${categoriaSeleccionada === 'pendientes' ? 'active' : ''}`} onClick={() => setCategoriaSeleccionada('pendientes')}>
                    <div className="metric-header">
                        <h3>Pendientes</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}><Clock size={20} /></div>
                    </div>
                    <h2 className="metric-value">{stats?.pedidos?.pendientes || 0}</h2>
                </div>

                {/* 4. VISITAS GA4 (Nuevo) */}
                <div className="metric-card" style={{ cursor: 'default' }}>
                    <div className="metric-header">
                        <h3>Visitantes (30 días)</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}><Users size={20} /></div>
                    </div>
                    {/* Si no hay credenciales, mostrará 0 temporalmente */}
                    <h2 className="metric-value">{stats?.analytics?.usuarios_30_dias || 0}</h2>
                </div>
            </div>

            {/* SECCIÓN DEL GRÁFICO */}
            {!categoriaSeleccionada && stats && (
                <div className="content-section">
                    <h2 className="section-title">Distribución de Pedidos</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Exitosos', cantidad: stats.pedidos.exitosos, color: '#4f46e5' },
                                    { name: 'Pendientes', cantidad: stats.pedidos.pendientes, color: '#f59e0b' },
                                    { name: 'Cancelados', cantidad: stats.pedidos.cancelados, color: '#ef4444' },
                                ]}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                barSize={60}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                                    {
                                        [{ color: '#4f46e5' }, { color: '#f59e0b' }, { color: '#ef4444' }].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))
                                    }
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* TABLA DINÁMICA */}
            {renderizarDetalle()}

        </div>
    );
};

export default EstadisticasDashboard;