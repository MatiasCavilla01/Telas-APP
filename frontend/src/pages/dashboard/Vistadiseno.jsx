import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Icon, icons } from '../../components/Icons';

const API = 'http://127.0.0.1:8000/api';

const VistaDiseno = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl,   setPreviewUrl]   = useState(null);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [loading,      setLoading]      = useState(false);
  const [dragging,     setDragging]     = useState(false);

  useEffect(() => {
    axios.get(`${API}/banner/`)
      .then(res => { if (res.data?.main_image) setPreviewUrl(res.data.main_image); })
      .catch(() => {});
  }, []);

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setStatusMsg('');
  };

  const handleUpload = async () => {
    if (!selectedFile) { setStatusMsg('Seleccioná una imagen primero.'); return; }
    setLoading(true); setStatusMsg('');
    const formData = new FormData();
    formData.append('main_image', selectedFile);
    formData.append('title', 'Mi Tienda Oficial');
    try {
      await axios.post(`${API}/banner/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMsg('ok');
    } catch {
      setStatusMsg('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Diseño & Colores" subtitle="Personalizá la apariencia visual de tu tienda" />
      <Card style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Icon d={icons.image} size={20} color="#6366f1" />
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Banner Principal</span>
        </div>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            width: '100%', height: 220, borderRadius: 10, marginBottom: 20,
            border: dragging ? '2px dashed #6366f1' : '2px dashed #e2e8f0',
            background: dragging ? '#f0f0ff' : '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
          }}
          onClick={() => document.getElementById('banner-input').click()}
        >
          {previewUrl
            ? <img src={previewUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <Icon d={icons.upload} size={32} color="#cbd5e1" />
                <p style={{ margin: '10px 0 4px', fontWeight: 600, color: '#64748b' }}>Arrastrá o hacé clic para subir</p>
                <p style={{ margin: 0, fontSize: 12 }}>PNG, JPG, WEBP · Máx. 5MB</p>
              </div>
            )}
          <input id="banner-input" type="file" accept="image/*"
            style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        </div>
        <button onClick={handleUpload} disabled={loading} style={{
          width: '100%', padding: '13px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: loading ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <Icon d={icons.upload} size={17} color="white" />
          {loading ? 'Guardando...' : 'Guardar banner'}
        </button>
        {statusMsg === 'ok' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16,
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
            <Icon d={icons.check} size={16} color="#16a34a" />
            <span style={{ color: '#15803d', fontWeight: 600, fontSize: 14 }}>¡Banner actualizado con éxito!</span>
          </div>
        )}
        {statusMsg === 'error' && (
          <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, fontWeight: 600 }}>
            Hubo un error al guardar. Intentá de nuevo.
          </div>
        )}
      </Card>
    </div>
  );
};

export default VistaDiseno;