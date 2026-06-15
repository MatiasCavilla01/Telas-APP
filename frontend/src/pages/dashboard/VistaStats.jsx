import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, Calendar, Store, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import './Estadisticas.css';

const EstadisticasDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [mesConsulta, setMesConsulta] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/estadisticas/`);
                if (!response.ok) throw new Error('Error en red');
                const data = await response.json();
                setStats(data);
                // Establecemos el mes actual por defecto en el selector
                setMesConsulta(data.mes_actual.id_mes);
            } catch (error) {
                console.error("Error:", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="loading-spinner">Cargando métricas...</div>;
    if (error || !stats) return <div className="error-banner">Error al cargar las estadísticas.</div>;

    // Buscar los datos del mes seleccionado en el dropdown
    const datosMesSeleccionado = stats.historial_12_meses.find(m => m.id_mes === mesConsulta) || stats.mes_actual;
    
    // Colores corporativos para el gráfico de torta
    const PIE_COLORS = ['#f59e0b', '#4f46e5']; // Naranja (Local) y Azul (Web)

    return (
        <div className="stats-page-container">
            <div className="stats-header">
                <h1>Panel de Rendimiento</h1>
            </div>

            {/* Fila 1: Tarjetas Principales */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Ingresos Totales (Histórico)</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#d1fae5', color: '#059669' }}><DollarSign size={20} /></div>
                    </div>
                    <h2 className="metric-value">${(stats.ingresos_totales).toLocaleString('es-AR')}</h2>
                </div>

                <div className="metric-card interactive">
                    <div className="metric-header">
                        <h3>Consultar Mes</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}><Calendar size={20} /></div>
                    </div>
                    <select 
                        className="month-selector" 
                        value={mesConsulta} 
                        onChange={(e) => setMesConsulta(e.target.value)}
                    >
                        {stats.historial_12_meses.map((mes) => (
                            <option key={mes.id_mes} value={mes.id_mes}>{mes.mes_label}</option>
                        ))}
                    </select>
                </div>

                <div className="metric-card highlight-card">
                    <div className="metric-header">
                        <h3>Ventas de {datosMesSeleccionado.mes_label}</h3>
                        <div className="metric-icon" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}><ShoppingBag size={20} /></div>
                    </div>
                    <h2 className="metric-value text-white">{datosMesSeleccionado.ventas} <span className="sub-value">cerradas</span></h2>
                    <p className="text-white-muted">Ingresos: ${(datosMesSeleccionado.ingresos).toLocaleString('es-AR')}</p>
                </div>

                <div className="metric-card">
                    <div className="metric-header">
                        <h3>Visitantes Web (Mes)</h3>
                        <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}><Users size={20} /></div>
                    </div>
                    <h2 className="metric-value">{stats.analytics.visitas_30_dias}</h2>
                </div>
            </div>

            {/* Fila 2: Gráficos (Barra y Torta) */}
            <div className="charts-grid">
                {/* Gráfico de Barras: 12 Meses */}
                <div className="content-section">
                    <h2 className="section-title">Evolución Anual (Ingresos)</h2>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={stats.historial_12_meses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="mes_label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Ingresos']} cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="ingresos" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico de Torta: Local vs Web */}
                <div className="content-section">
                    <h2 className="section-title">Origen de Ventas (Histórico)</h2>
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={stats.origen_ventas}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.origen_ventas.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} Ventas`, 'Cantidad']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Leyenda extra visual */}
                    <div className="pie-legend-details">
                        <div className="legend-item"><Store size={16} color="#f59e0b" /> Local: {stats.origen_ventas[0].value}</div>
                        <div className="legend-item"><Globe size={16} color="#4f46e5" /> Web: {stats.origen_ventas[1].value}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EstadisticasDashboard;