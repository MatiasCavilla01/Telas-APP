import { useState, useEffect } from 'react';
import axios from 'axios';

const Home = () => {
  const [bannerData, setBannerData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cuando la página carga, vamos a buscar la foto a Django
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/banner/')
      .then(response => {
        setBannerData(response.data);
      })
      .catch(error => {
        console.error("Error al cargar el banner:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando vidriera...</div>;

  // Creamos el estilo dinámico para la imagen de fondo
  const heroStyle = {
    // Si hay imagen, usamos su URL. Si no, dejamos un gris de fondo.
    backgroundImage: bannerData && bannerData.main_image ? `url(${bannerData.main_image})` : 'none',
    backgroundColor: '#e5e7eb', 
    backgroundSize: 'cover', // Hace que la imagen cubra todo el espacio sin deformarse
    backgroundPosition: 'center', // Centra la imagen
    height: '80vh', // Ocupa el 80% del alto de la pantalla del usuario
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center',
    textShadow: '2px 2px 5px rgba(0,0,0, 0.8)' // Sombra para que el texto resalte
  };

  return (
    <div>
      {/* Sección Hero (La imagen principal con el título) */}
      <div style={heroStyle}>
        <h1 style={{ fontSize: '4rem', margin: '0 0 10px 0' }}>
          {bannerData && bannerData.title ? bannerData.title : "Bienvenido a Telas-APP"}
        </h1>
        <p style={{ fontSize: '1.5rem', margin: 0 }}>Calidad y diseño para tus creaciones</p>
      </div>
      
      {/* Sección de Catálogo (La llenaremos en el futuro) */}
      <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'white' }}>
        <h2>Nuestros Productos</h2>
        <p style={{ color: '#666' }}>El catálogo se cargará aquí próximamente...</p>
      </div>
    </div>
  );
};

export default Home;