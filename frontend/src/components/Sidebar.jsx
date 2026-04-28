import { NavLink } from 'react-router-dom';
import { Icon, icons } from './Icons';

const navItems = [
  { path: '',           label: 'Inicio',            icon: 'home',     section: 'INICIO' },
  { path: 'productos',  label: 'Productos & Stock', icon: 'products', section: 'GESTIÓN' },
  { path: 'categorias', label: 'Categorías',        icon: 'category', section: '' },
  { path: 'stats',      label: 'Estadísticas',      icon: 'stats',    section: '' },
  { path: 'diseno',     label: 'Diseño & Colores',  icon: 'design',   section: '' },
  { path: 'pedidos',    label: 'Ventas & Pedidos',  icon: 'orders',   section: '' },
];

const Sidebar = () => {
  let lastSection = '';
  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0,
      fontFamily: "'DM Sans', sans-serif", zIndex: 100,
      boxShadow: '4px 0 24px rgba(0,0,0,0.18)'
    }}>
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(99,102,241,0.5)'
          }}>
            <Icon d={icons.package} size={18} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>Telas-APP</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>Panel de Control</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const showSection = item.section && item.section !== lastSection;
          if (item.section) lastSection = item.section;
          
          return (
            <div key={item.path}>
              {showSection && (
                <div style={{ color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
                  textTransform: 'uppercase', padding: '16px 12px 6px' }}>
                  {item.section}
                </div>
              )}
              <NavLink
                to={`/dashboard/${item.path}`}
                end={item.path === ''}
                style={({ isActive }) => ({
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 8, textDecoration: 'none',
                  marginBottom: 2, transition: 'all 0.15s',
                  background: isActive ? 'linear-gradient(90deg, #6366f120, #6366f108)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#94a3b8',
                  fontSize: 14, fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                })}
              >
                {({ isActive }) => (
                  <>
                    <Icon d={icons[item.icon]} size={17} color={isActive ? '#a5b4fc' : '#64748b'} />
                    {item.label}
                  </>
                )}
              </NavLink>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
        <button
          onClick={() => window.open('/', '_blank')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#64748b', fontFamily: 'inherit',
            fontSize: 14, textAlign: 'left', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Icon d={icons.store} size={17} color="#64748b" />
          Ver tienda online
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;