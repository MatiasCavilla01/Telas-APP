const Header = ({ title, subtitle }) => (
  <div style={{ marginBottom: 32 }}>
    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>{title}</h1>
    {subtitle && <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>{subtitle}</p>}
  </div>
);

export default Header;