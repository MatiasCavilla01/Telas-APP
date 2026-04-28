import { useState, useEffect } from 'react';
import axios from 'axios';

// Importamos los componentes visuales que separaste
import Header from '../../components/Header';
import Card from '../../components/Card';
import ImageUploader from '../../components/ImageUploader';
import { Icon, icons } from '../../components/Icons';

const API = 'http://127.0.0.1:8000/api';

const VistaCategorias = () => {
  const [categorias,  setCategorias]  = useState([]);
  const [showForm,    setShowForm]    = useState(false);
  const [nombre,      setNombre]      = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [images,      setImages]      = useState([]); 
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);
  const [statusMsg,   setStatusMsg]   = useState('');
  const [editando,    setEditando]    = useState(null); 

  const fetchCategorias = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API}/categorias/`);
      setCategorias(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      setCategorias([]);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchCategorias(); }, []);

  const abrirEditar = (cat) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setDescripcion(cat.descripcion || '');
    setImages([]); 
    setShowForm(true);
    setStatusMsg('');
  };

  const resetForm = () => {
    setShowForm(false);
    setNombre('');
    setDescripcion('');
    setImages([]); 
    setEditando(null);
    setStatusMsg('');
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) { setStatusMsg('El nombre es obligatorio.'); return; }
    setLoading(true); setStatusMsg('');
    
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('descripcion', descripcion);
      
      if (images.length > 0 && images[0].file) {
        formData.append('imagen', images[0].file);
      }

      if (editando) {
        await axios.patch(`${API}/categorias/${editando.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/categorias/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setStatusMsg('ok');
      await fetchCategorias();
      setTimeout(resetForm, 800);
    } catch {
      setStatusMsg('Error al guardar. Verificá la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await axios.delete(`${API}/categorias/${id}/`);
      setCategorias(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('No se pudo eliminar. Puede que tenga productos asociados.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
    outline: 'none', color: '#1e293b', background: 'white', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <Header title="Categorías" subtitle="Organizá tus productos por categoría" />
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
          fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        }}>
          <Icon d={icons.plus} size={16} color="white" />
          Nueva categoría
        </button>
      </div>

      {showForm && (
        <Card style={{ maxWidth: 520, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon d={icons.category} size={20} color="#6366f1" />
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
                {editando ? 'Editar categoría' : 'Nueva categoría'}
              </span>
            </div>
            <button onClick={resetForm} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4
            }}>
              <Icon d={icons.x} size={18} color="#94a3b8" />
            </button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Nombre *</label>
            <input
              style={inputStyle}
              placeholder="Ej: Remeras, Pantalones, Accesorios..."
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Descripción <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span></label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
              placeholder="Breve descripción de la categoría..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon d={icons.image} size={14} color="#6366f1" />
              Imagen de la categoría
              <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>(opcional)</span>
            </label>
            <ImageUploader images={images} setImages={setImages} max={1} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleSubmit} disabled={loading} style={{
              flex: 1, padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
            }}>
              {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear categoría'}
            </button>
            <button onClick={resetForm} style={{
              padding: '12px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'white', color: '#64748b', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Cancelar</button>
          </div>

          {statusMsg === 'ok' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
              <Icon d={icons.check} size={16} color="#16a34a" />
              <span style={{ color: '#15803d', fontWeight: 600, fontSize: 14 }}>¡Categoría guardada!</span>
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
            <p style={{ fontWeight: 600 }}>Cargando categorías...</p>
          </div>
        ) : categorias.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
            <Icon d={icons.category} size={40} color="#e2e8f0" />
            <p style={{ marginTop: 12, fontWeight: 600 }}>No hay categorías todavía</p>
            <p style={{ fontSize: 13, margin: '4px 0 0' }}>Creá tu primera categoría con el botón de arriba</p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: '48px 1fr auto auto',
              padding: '12px 20px', borderBottom: '1px solid #f1f5f9', gap: 16,
              color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <span>Img</span>
              <span>Nombre</span>
              <span style={{ marginRight: 48 }}>Descripción</span>
              <span>Acciones</span>
            </div>
            {categorias.map(cat => (
              <div key={cat.id} style={{
                display: 'grid', gridTemplateColumns: '48px 1fr auto auto',
                alignItems: 'center', gap: 16,
                padding: '16px 20px', borderBottom: '1px solid #f8fafc',
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
                  {cat.imagen
                    ? <img src={cat.imagen} alt={cat.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Icon d={icons.image} size={20} color="#cbd5e1" />
                  }
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{cat.nombre}</div>
                </div>
                
                <div style={{ width: 200 }}>
                  {cat.descripcion && (
                    <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cat.descripcion}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => abrirEditar(cat)}
                    style={{
                      padding: '7px 14px', borderRadius: 7, border: '1.5px solid #e2e8f0',
                      background: 'white', color: '#6366f1', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <Icon d={icons.edit} size={13} color="#6366f1" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(cat.id)}
                    style={{
                      padding: '7px 12px', borderRadius: 7, border: '1.5px solid #fee2e2',
                      background: '#fff5f5', color: '#ef4444', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      display: 'flex', alignItems: 'center', gap: 5
                    }}
                  >
                    <Icon d={icons.trash} size={13} color="#ef4444" />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  );
};

export default VistaCategorias;