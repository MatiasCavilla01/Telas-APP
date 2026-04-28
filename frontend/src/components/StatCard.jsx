import Card from './Card';

const StatCard = ({ label, value, color }) => (
  <Card style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
    <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
  </Card>
);

export default StatCard;