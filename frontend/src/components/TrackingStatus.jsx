import React, { useState, useEffect } from 'react';
import { fetchTrackingStatus } from '../services/trackingService';

const TrackingStatus = ({ trackingNumber }) => {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!trackingNumber) return;

        const getStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchTrackingStatus(trackingNumber);
                if (data && data.length > 0) {
                    setStatusData(data[0]); 
                } else {
                    setError("No se encontraron registros con ese número de seguimiento.");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getStatus();
    }, [trackingNumber]);

    if (loading) return <div style={{ marginTop: '25px', color: 'var(--verde-atelier)', fontSize: '0.9rem' }}>Buscando novedades en el correo...</div>;
    if (error) return <div style={{ color: '#d9534f', marginTop: '25px', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>;
    if (!statusData) return null;

    return (
        <div className="tracking-result-box">
            <h3>Novedades del Envío</h3>
            <div className="tracking-info-row">
                <strong>Código:</strong> {trackingNumber}
            </div>
            <div className="tracking-info-row">
                <strong>Estado actual:</strong> <span style={{ color: 'var(--verde-atelier)', fontWeight: '600' }}>{statusData.status?.name || 'Procesando'}</span>
            </div>
            {statusData.status?.description && (
                <div className="tracking-info-row" style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                    <strong>Detalle:</strong> {statusData.status.description}
                </div>
            )}
        </div>
    );
};

export default TrackingStatus;