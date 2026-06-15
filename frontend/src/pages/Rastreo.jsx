import React, { useState } from 'react';
import Navbar from './Navbar/Navbar.jsx'; // El Navbar real de tu aplicación
import TrackingStatus from '../components/TrackingStatus';
import { Truck } from 'lucide-react'; 
import './Rastreo.css'; 

const Rastreo = () => {
    const [inputValue, setInputValue] = useState('');
    const [trackingNumberToSearch, setTrackingNumberToSearch] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (inputValue.trim() !== '') {
            setTrackingNumberToSearch(inputValue.trim());
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--crema-fondo)', minHeight: '100vh', width: '100%' }}>
            
            <Navbar cartCount={0} /> 
            
            <div className="rastreo-page-container">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--dorado-acento)' }}>
                    <Truck size={40} strokeWidth={1.2} />
                </div>
                
                <h2 className="rastreo-title">Seguí tu envío</h2>
                <p className="rastreo-subtitle">
                    Ingresá el número de seguimiento que te enviamos por mail para verificar el estado de entrega de tus telas en tiempo real.
                </p>

                <form onSubmit={handleSearch} className="rastreo-form">
                    <input 
                        type="text" 
                        className="rastreo-input"
                        placeholder="Ej: CP123456789AR" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    <button type="submit" className="rastreo-button">
                        Buscar Paquete
                    </button>
                </form>

                {trackingNumberToSearch && (
                    <TrackingStatus trackingNumber={trackingNumberToSearch} />
                )}
            </div>
        </div>
    );
};

export default Rastreo;