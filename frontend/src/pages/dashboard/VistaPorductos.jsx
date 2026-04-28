import { useState, useEffect } from 'react';
import axios from 'axios';

// Importamos los componentes visuales que separaste
import Header from '../../components/Header';
import Card from '../../components/Card';
import ImageUploader from '../../components/ImageUploader';
import { Icon, icons } from '../../components/Icons';

const API = 'http://127.0.0.1:8000/api';

const VistaProductos = () => {
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState({ nombre: '', precio: '', descripcion: '', talle: '', categoria: '' });
  const [images,      setImages]      = useState([]);
  const [statusMsg,   setStatusMsg]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [productos,   setProductos]   = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [fetching,    setFetching]    = useState(true);
  const [editando,    setEditando]    = useState(null); 

  const talles = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'];

  const fetchData = async () => {
    setFetching(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API}/productos/`),
        axios.get(`${API}/categorias/`),
      ]);
      setProductos(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.results || []);
      setCategorias(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
    } catch {
      setProductos([]);
      setCategorias([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const abrirEditar = (prod) => {
    setEditando(prod.id);
    setForm({
      nombre: prod.nombre,
      precio: prod.precio,
      descripcion: prod.descripcion || '',
      talle: prod.talle,
      categoria: prod.categoria || ''
    });
    setImages([]); 
    setShowForm(true);
    setStatusMsg('');
  };

  const resetForm = () => {
    setShowForm(false);
    setForm({ nombre: '', precio: '', descripcion: '', talle: '', categoria: '' });
    setImages([]);
    setEditando(null);
    setStatusMsg('');
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio || !form.talle) {
      setStatusMsg('Completá nombre, precio y talle.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nombre',      form.nombre);
      formData.append('precio',      form.precio);
      formData.append('talle',       form.talle);
      formData.append('descripcion', form.descripcion);
      if (form.categoria) formData.append('categoria', form.categoria);
      
      images.forEach((img, i) => {
        if (img.file) formData.append(i === 0 ? 'imagen' : `imagen_extra_${i}`, img.file);
      });

      if (editando) {
        await axios.patch(`${API}/productos/${editando}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/productos/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setStatusMsg('ok');
      resetForm();
      await fetchData(); 
    } catch {
      setStatusMsg('Error al guardar. Verificá la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await axios.delete(`${API}/productos/${id}/`);
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('No se pudo eliminar el producto.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', color: '#1e293b', background: 'white', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' };

  const getNombreCategoria = (id) => {
    const cat = categorias.find(c => c.id === id || c.id === Number(id));
    return cat ? cat.nombre : '—';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <Header title="Productos & Stock" subtitle="Gestioná tu catálogo de productos" />
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
          fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          <Icon d={icons.plus} size={16} color="white" />
          Agregar producto
        </button>
      </div>

      {showForm && (
        <Card style={{ maxWidth: 600, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Icon d={icons.tag} size={20} color="#6366f1" />
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
               {editando ? 'Editar Producto' : 'Nuevo Producto'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Nombre del producto *</label>
              <input style={inputStyle} placeholder="Ej: Remera básica blanca"
                value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div>
              <label style={labelStyle}>Precio (ARS) *</label>
              <input style={inputStyle} type="number" placeholder="0.00"
                value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div>
              <label style={labelStyle}>Talle *</label>
              <select style={inputStyle} value={form.talle}
                onChange={e => setForm({ ...form, talle: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}>
                <option value="">Seleccioná un talle</option>
                {talles.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>
                Categoría
                {categorias.length === 0 && (
                  <span style={{ fontWeight: 400, color: '#f59e0b', fontSize: 12, marginLeft: 8 }}>
                    (No hay categorías creadas)
                  </span>
                )}
              </label>
              <select
                style={inputStyle}
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                disabled={categorias.length === 0}
              >
                <option value="">Sin categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
                placeholder="Describí el producto..."
                value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon d={icons.grid} size={14} color="#6366f1" />
                Imágenes del producto
                <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(opcional · hasta 5)</span>
              </label>
              <ImageUploader images={images} setImages={setImages} max={5} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button onClick={handleSubmit} disabled={loading} style={{
              flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? 'Guardando...' : editando ? 'Actualizar producto' : 'Guardar producto'}
            </button>
            <button onClick={resetForm} style={{
              padding: '12px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Cancelar
            </button>
          </div>

          {statusMsg === 'ok' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
              <Icon d={icons.check} size={16} color="#16a34a" />
              <span style={{ color: '#15803d', fontWeight: 600, fontSize: 14 }}>¡Producto guardado!</span>
            </div>
          )}
          {statusMsg && statusMsg !== 'ok' && (
            <p style={{ marginTop: 12, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>{statusMsg}</p>
          )}
        </Card>
      )}

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {fetching ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <p style={{ fontWeight: 600 }}>Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <Icon d={icons.package} size={40} color="#e2e8f0" />
            <p style={{ marginTop: 12, fontWeight: 600 }}>No hay productos cargados aún</p>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>Usá el botón de arriba para agregar tu primer producto</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: '56px 1fr 100px 80px 120px 100px',
              padding: '12px 20px', borderBottom: '1px solid #f1f5f9',
              color: '#94a3b8', fontSize: 12, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.05em', gap: 12
            }}>
              <span>Img</span>
              <span>Nombre</span>
              <span>Precio</span>
              <span>Talle</span>
              <span>Categoría</span>
              <span>Acciones</span>
            </div>

            {productos.map(prod => (
              <div key={prod.id} style={{
                display: 'grid', gridTemplateColumns: '56px 1fr 100px 80px 120px 100px',
                alignItems: 'center', padding: '14px 20px',
                borderBottom: '1px solid #f8fafc', gap: 12,
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
                  background: '#f1f5f9', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {prod.imagen
                    ? <img src={prod.imagen} alt={prod.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Icon d={icons.image} size={20} color="#cbd5e1" />
                  }
                </div>

                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{prod.nombre}</div>
                  {prod.descripcion && (
                    <div style={{
                      fontSize: 12, color: '#94a3b8', marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260
                    }}>{prod.descripcion}</div>
                  )}
                </div>

                <div style={{ fontWeight: 700, color: '#10b981', fontSize: 14 }}>
                  ${Number(prod.precio).toLocaleString('es-AR')}
                </div>

                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                    background: '#f0f0ff', color: '#6366f1', fontWeight: 700, fontSize: 12
                  }}>{prod.talle}</span>
                </div>

                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {prod.categoria ? getNombreCategoria(prod.categoria) : <span style={{ color: '#cbd5e1' }}>Sin categoría</span>}
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => abrirEditar(prod)}
                    style={{
                      padding: '6px 10px', borderRadius: 7, border: '1.5px solid #e2e8f0',
                      background: 'white', color: '#6366f1', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600
                    }}
                    title="Editar producto"
                  >
                    <Icon d={icons.edit} size={13} color="#6366f1" />
                  </button>
                  <button
                    onClick={() => handleEliminar(prod.id)}
                    style={{
                      padding: '6px 10px', borderRadius: 7, border: '1.5px solid #fee2e2',
                      background: '#fff5f5', color: '#ef4444', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600
                    }}
                    title="Eliminar producto"
                  >
                    <Icon d={icons.trash} size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}

            <div style={{
              padding: '12px 20px', borderTop: '1px solid #f1f5f9',
              fontSize: 13, color: '#94a3b8', textAlign: 'right'
            }}>
              {productos.length} producto{productos.length !== 1 ? 's' : ''} en total
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default VistaProductos;