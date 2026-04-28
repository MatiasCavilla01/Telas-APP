import { Icon, icons } from './Icons';

const CheckItem = ({ label, desc, done, onClick, icon }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 16,
    padding: '18px 20px', background: done ? '#f8fafc' : 'white',
    border: 'none', borderBottom: '1px solid #f1f5f9', cursor: done ? 'default' : 'pointer',
    textAlign: 'left', transition: 'background 0.15s', borderRadius: 0,
    fontFamily: "'DM Sans', sans-serif",
  }}
  onMouseEnter={e => { if (!done) e.currentTarget.style.background = '#f8faff'; }}
  onMouseLeave={e => { if (!done) e.currentTarget.style.background = done ? '#f8fafc' : 'white'; }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: done ? '#dcfce7' : '#f0f0ff',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      {done
        ? <Icon d={icons.check} size={16} color="#16a34a" />
        : <Icon d={icons[icon]} size={16} color="#6366f1" />}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 15, color: done ? '#94a3b8' : '#1e293b',
        textDecoration: done ? 'line-through' : 'none' }}>{label}</div>
      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{desc}</div>
    </div>
    {!done && <Icon d={icons.chevron} size={18} color="#cbd5e1" />}
  </button>
);

export default CheckItem;