import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';

const VistaPedidos = () => (
  <div>
    <Header title="Ventas & Pedidos" subtitle="Administrá tus órdenes de compra" />
    <Card>
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
        <Icon d={icons.orders} size={40} color="#e2e8f0" />
        <p style={{ marginTop: 12, fontWeight: 600 }}>No hay pedidos todavía</p>
        <p style={{ fontSize: 13, margin: '4px 0 0' }}>Cuando lleguen tus primeras ventas las verás aquí</p>
      </div>
    </Card>
  </div>
);

export default VistaPedidos;