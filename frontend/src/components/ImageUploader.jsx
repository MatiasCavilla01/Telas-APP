import { useState, useEffect, useRef } from 'react';
import { Icon, icons } from './Icons';

const ImageUploader = ({ images, setImages, max = 5 }) => {
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrl,  setShowUrl]  = useState(false);
  const [urlError, setUrlError] = useState('');
  const fileInputRef            = useRef(null);

  const addFiles = (files) => {
    const valid     = Array.from(files).filter(f => f.type.startsWith('image/'));
    const remaining = max - images.length;
    if (remaining <= 0) return;
    const toAdd = valid.slice(0, remaining).map(file => ({
      id:      `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      source:  'file',
    }));
    setImages(prev => [...prev, ...toAdd]);
  };

  const onDragOver  = e => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);
  const onDrop      = e  => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  useEffect(() => {
    const handlePaste = e => {
      const items      = Array.from(e.clipboardData?.items || []);
      const imageItems = items.filter(i => i.type.startsWith('image/'));
      if (imageItems.length) addFiles(imageItems.map(i => i.getAsFile()));
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images]);

  const addByUrl = () => {
    setUrlError('');
    if (!urlInput.trim()) return;
    try { new URL(urlInput); } catch { setUrlError('URL inválida'); return; }
    if (images.length >= max) { setUrlError(`Máximo ${max} imágenes`); return; }
    setImages(prev => [...prev, {
      id:      `${Date.now()}-url`,
      file:    null,
      preview: urlInput.trim(),
      source:  'url',
      url:     urlInput.trim(),
    }]);
    setUrlInput('');
    setShowUrl(false);
  };

  const remove = (id) => setImages(prev => prev.filter(img => img.id !== id));

  return (
    <div>
      {images.length < max && (
        <div
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border:     dragging ? '2px dashed #6366f1' : '2px dashed #e2e8f0',
            background: dragging ? '#f0f0ff' : '#f8fafc',
            borderRadius: 10, padding: '28px 20px', textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s', marginBottom: 12,
          }}
        >
          <Icon d={icons.camera} size={28} color={dragging ? '#6366f1' : '#cbd5e1'} />
          <p style={{ margin: '10px 0 4px', fontWeight: 600, color: '#475569', fontSize: 14 }}>
            Arrastrá, pegá o hacé clic para seleccionar
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
            Galería · Google Fotos · Drive · Archivos del dispositivo · Ctrl+V
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        {!showUrl ? (
          <button
            onClick={() => setShowUrl(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 8,
              padding: '8px 14px', cursor: 'pointer', color: '#6366f1',
              fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Icon d={icons.link} size={14} color="#6366f1" />
            Agregar desde URL
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="url"
              placeholder="https://..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addByUrl()}
              autoFocus
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 8, outline: 'none',
                border: urlError ? '1.5px solid #ef4444' : '1.5px solid #6366f1',
                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button onClick={addByUrl} style={{
              padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#6366f1', color: 'white', fontWeight: 700,
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>Agregar</button>
            <button onClick={() => { setShowUrl(false); setUrlError(''); }} style={{
              padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0',
              background: 'white', color: '#64748b', cursor: 'pointer',
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>✕</button>
          </div>
        )}
        {urlError && <p style={{ margin: '6px 0 0', color: '#ef4444', fontSize: 12 }}>{urlError}</p>}
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{
              position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1',
              border: i === 0 ? '2px solid #6366f1' : '2px solid #e2e8f0'
            }}>
              <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {i === 0 && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: '#6366f1', color: 'white', fontSize: 10,
                  fontWeight: 700, textAlign: 'center', padding: '3px 0'
                }}>PRINCIPAL</div>
              )}
              <button
                onClick={() => remove(img.id)}
                style={{
                  position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                  borderRadius: '50%', background: 'rgba(15,23,42,0.7)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon d={icons.trash} size={11} color="white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94a3b8' }}>
          {images.length}/{max} imágenes · La primera es la imagen principal del producto
        </p>
      )}
    </div>
  );
};

export default ImageUploader;