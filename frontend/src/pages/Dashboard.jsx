import { useState, useEffect } from 'react'; // 1. Agregamos useEffect aquí
import axios from 'axios';

const Dashboard = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  // 2. LA MAGIA: Cuando el panel carga, busca lo que ya está guardado
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/banner/')
      .then(response => {
        // Si Django nos devuelve una imagen, la ponemos en la vista previa
        if (response.data && response.data.main_image) {
          setPreviewUrl(response.data.main_image);
        }
      })
      .catch(error => {
        // Si es 404 (no hay configuración) no hacemos nada, dejamos que suba la primera
        console.log("Aún no hay banner o error de conexión.");
      });
  }, []); // Los corchetes vacíos aseguran que esto solo se ejecute una vez al entrar

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Reemplaza la vista previa con el archivo NUEVO que el usuario acaba de elegir
      setPreviewUrl(URL.createObjectURL(file));
      setStatusMsg("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMsg("Por favor, selecciona una imagen nueva primero.");
      return;
    }

    setStatusMsg("Subiendo imagen...");
    const formData = new FormData();
    formData.append('main_image', selectedFile);
    formData.append('title', 'Mi Tienda Oficial'); 

    try {
      await axios.post('http://127.0.0.1:8000/api/banner/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatusMsg("¡Diseño guardado con éxito!");
    } catch (error) {
      console.error("Error:", error);
      setStatusMsg("Hubo un error al guardar.");
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', background: '#f8fafc', minHeight: '100vh', color: '#1f2937' }}>
      <h2>Panel de Control</h2>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', maxWidth: '500px' }}>
        <h3>Banner Principal (Inicio)</h3>
        
        <div style={{ width: '100%', height: '200px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {previewUrl ? (
            <img src={previewUrl} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#9ca3af' }}>Sin imagen seleccionada</span>
          )}
        </div>

        <input type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: '20px', width: '100%' }} />
        <button onClick={handleUpload} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Guardar Diseño Visual
        </button>
        {statusMsg && <p style={{ marginTop: '15px', textAlign: 'center', color: statusMsg.includes('éxito') ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>{statusMsg}</p>}
      </div>
    </div>
  );
};

export default Dashboard;