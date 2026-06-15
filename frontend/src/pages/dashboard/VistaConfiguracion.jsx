import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Card from '../../components/Card';
import { Save, CheckCircle2, AlertCircle, Mail, Landmark, Smartphone } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import './VistaConfiguracion.css';

const VistaConfiguracion = () => {
    const [formData, setFormData] = useState({
        correo_contacto: '',
        alias_bancario: '',
        instagram: '',
        telefono: ''
    });
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        const fetchConfiguracion = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/banner/`);
                if (res.data) {
                    setFormData({
                        correo_contacto: res.data.correo_contacto || '',
                        alias_bancario: res.data.alias_bancario || '',
                        instagram: res.data.instagram || '',
                        telefono: res.data.telefono || ''
                    });
                }
            } catch (error) {
                console.error("Error al cargar la configuración:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfiguracion();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setMensaje({ tipo: '', texto: '' });

        const data = new FormData();
        data.append('correo_contacto', formData.correo_contacto);
        data.append('alias_bancario', formData.alias_bancario);
        data.append('instagram', formData.instagram);
        data.append('telefono', formData.telefono);

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/banner/`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMensaje({ tipo: 'success', texto: '¡Configuración guardada con éxito!' });
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 4000);
        } catch (error) {
            console.error("Error al guardar:", error);
            setMensaje({ tipo: 'error', texto: 'Hubo un problema al guardar los cambios.' });
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <div className="vista-config-container">
                <Header title="Configuración" subtitle="Ajustes generales de la tienda" />
                <Card><div className="loading-state">Cargando configuración...</div></Card>
            </div>
        );
    }

    return (
        <div className="vista-config-container">
            <Header title="Configuración General" subtitle="Administrá los datos de contacto y facturación de tu negocio" />

            {mensaje.texto && (
                <div className={`alert ${mensaje.tipo === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {mensaje.tipo === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {mensaje.texto}
                </div>
            )}

            <form onSubmit={handleSubmit} className="config-grid">

                {/* TARJETA 1: DATOS INTERNOS Y COBRO */}
                <Card>
                    <h3 className="config-card-title">Datos de Notificación y Cobro</h3>
                    <p className="config-card-desc">
                        Estos datos son para gestión interna y correos automáticos.
                    </p>

                    <div className="input-group">
                        <label className="form-label">Correo de Notificaciones</label>
                        <div className="input-with-icon">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                name="correo_contacto"
                                value={formData.correo_contacto}
                                onChange={handleChange}
                                className="input-moderno con-icono"
                                placeholder="ejemplo@mitienda.com"
                            />
                        </div>
                        <span className="input-hint">Aquí recibirás los avisos de nuevas compras.</span>
                    </div>

                    <div className="input-group">
                        <label className="form-label">Alias Bancario / CVU</label>
                        <div className="input-with-icon">
                            <Landmark size={18} className="input-icon" />
                            <input
                                type="text"
                                name="alias_bancario"
                                value={formData.alias_bancario}
                                onChange={handleChange}
                                className="input-moderno con-icono"
                                placeholder="MI.TIENDA.MP"
                            />
                        </div>
                        <span className="input-hint">Aparecerá en los correos enviados al cliente en pagos por transferencia.</span>
                    </div>
                </Card>

                {/* TARJETA 2: REDES SOCIALES Y CONTACTO PÚBLICO */}
                <Card>
                    <h3 className="config-card-title">Atención al Cliente y Redes</h3>
                    <p className="config-card-desc">
                        Estos datos se mostrarán en tu tienda web para que los clientes te contacten.
                    </p>

                    <div className="input-group">
                        <label className="form-label">Usuario de Instagram</label>
                        <div className="input-with-icon">
                            {/* ✅ FaInstagram de react-icons reemplaza a Instagram de lucide-react */}
                            <FaInstagram size={18} className="input-icon color-ig" />
                            <input
                                type="text"
                                name="instagram"
                                value={formData.instagram}
                                onChange={handleChange}
                                className="input-moderno con-icono"
                                placeholder="ej: modaytelas"
                            />
                        </div>
                        <span className="input-hint">Escribí tu usuario sin el "@".</span>
                    </div>

                    <div className="input-group">
                        <label className="form-label">Teléfono / WhatsApp</label>
                        <div className="input-with-icon">
                            {/* ✅ FaWhatsapp de react-icons reemplaza a Smartphone de lucide-react */}
                            <FaWhatsapp size={18} className="input-icon color-wpp" />
                            <input
                                type="text"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="input-moderno con-icono"
                                placeholder="ej: 5493512345678"
                            />
                        </div>
                        <span className="input-hint">Código de país + área + número (sin el '+').</span>
                    </div>
                </Card>

                {/* BARRA DE ACCIÓN FLOTANTE AL FINAL */}
                <div className="form-actions-wrapper">
                    <button type="submit" className="btn-guardar" disabled={guardando}>
                        {guardando ? 'Guardando...' : (
                            <>
                                <Save size={18} /> Guardar todos los cambios
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default VistaConfiguracion;