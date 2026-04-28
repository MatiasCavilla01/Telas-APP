import Header from '../../components/Header';
import Card from '../../components/Card';
import StatCard from '../../components/StatCard';
import { Icon, icons } from '../../components/Icons';

const VistaStats = () => (
  <div>
    <Header title="Estadísticas" subtitle="Resumen del rendimiento de tu tienda" />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
      <StatCard label="Visitas este mes"   value="—" color="#6366f1" />
      <StatCard label="Pedidos pendientes" value="—" color="#f59e0b" />
      <StatCard label="Ingresos del mes"   value="—" color="#10b981" />
    </div>
    <Card>
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
        <Icon d={icons.stats} size={40} color="#e2e8f0" />
        <p style={{ marginTop: 12, fontWeight: 600 }}>Estadísticas disponibles próximamente</p>
        <p style={{ fontSize: 13, margin: '4px 0 0' }}>Cuando tengas ventas, aquí verás los gráficos</p>
      </div>
    </Card>
  </div>
);

export default VistaStats;