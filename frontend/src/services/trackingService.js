// Usamos tu dominio real de PythonAnywhere como URL por defecto
const API_URL = import.meta.env.VITE_API_URL || 'https://ignaciozurbriggen.pythonanywhere.com/api';

export const fetchTrackingStatus = async (trackingNumber) => {
    try {
        const response = await fetch(`${API_URL}/rastrear/${trackingNumber}/`);
        
        if (!response.ok) {
            throw new Error('No se pudo encontrar información para este número de envío.');
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error al rastrear:", error);
        throw error;
    }
};