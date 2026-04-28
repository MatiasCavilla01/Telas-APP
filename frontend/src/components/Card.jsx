const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'white', borderRadius: 12, padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9', ...style
  }}>
    {children}
  </div>
);

export default Card;