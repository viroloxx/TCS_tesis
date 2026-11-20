import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import tcsLogo from '../../assets/images/tcs-logo.png';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('admin@tcs.com.ve');
  const [contrasena, setContrasena] = useState('••••••••');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alertaOlvido, setAlertaOlvido] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(correo, contrasena);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        backgroundColor: '#f8fafc'
      }}
    >
      {/* ================= COLUMNA IZQUIERDA: BRANDING CORPORATIVO TCS ================= */}
      <div
        style={{
          flex: '1 1 55%',
          background: 'linear-gradient(135deg, #071527 0%, #0a1c36 40%, #030c18 100%)',
          color: '#ffffff',
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Efecto de resplandor sutil de fondo */}
        <div
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(7, 21, 39, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Header Superior Izquierdo: Logotipo TCS */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Isotipo Oficial TCS */}
            <img
              src={tcsLogo}
              alt="Logo Technology Consulting Solutions"
              style={{
                height: '40px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />

            {/* Tipografía Razón Social y Portal */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  lineHeight: 1.2
                }}
              >
                Technology Consulting Solutions
              </span>
              <span
                style={{
                  fontSize: '0.74rem',
                  letterSpacing: '0.10em',
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginTop: '3px'
                }}
              >
                Portal de Gestión de Cobros y Pagos
              </span>
            </div>
          </div>
        </div>

        {/* Contenido Central: Mensaje Estratégico TCS */}
        <div style={{ maxWidth: '620px', position: 'relative', zIndex: 1, margin: '60px 0' }}>
          {/* Badge Impulso Comercial / Gestión Financiera */}
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(14, 165, 233, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.28)',
                color: '#38bdf8',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '6px 14px',
                borderRadius: '9999px'
              }}
            >
              Dinamización de Cobros y Pagos
            </span>
          </div>

          {/* Titular Principal */}
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              lineHeight: 1.22,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              margin: '0 0 24px 0'
            }}
          >
            Asegura el control total de los ingresos y egresos.
          </h1>

          {/* Subtítulo / Párrafo explicativo institucional */}
          <p
            style={{
              fontSize: '1.02rem',
              lineHeight: 1.65,
              color: '#cbd5e1',
              margin: 0,
              fontWeight: 400
            }}
          >
            Sincroniza los cobros y pagos en tiempo real con la tasa oficial BCV,
            resguarda tus fondos y obligaciones con candado financiero, y ejecuta
            cada abono o desembolso con máxima precisión y control.
          </p>
        </div>

        {/* Footer Inferior Izquierdo: Copyright y Versión */}
        <div style={{ position: 'relative', zIndex: 1, fontSize: '0.80rem', color: '#64748b' }}>
          © 2026 Technology Consulting Solutions. Todos los derechos reservados. · v1.5.4
        </div>
      </div>

      {/* ================= COLUMNA DERECHA: FORMULARIO DE INICIO DE SESIÓN ================= */}
      <div
        style={{
          flex: '1 1 45%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          backgroundColor: '#f8fafc'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '42px 36px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          {/* Encabezado del Formulario */}
          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: '#0f172a',
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em'
              }}
            >
              Iniciar Sesión
            </h2>
            <p
              style={{
                fontSize: '0.90rem',
                color: '#64748b',
                margin: 0,
                lineHeight: 1.4
              }}
            >
              Ingresa tus credenciales corporativas para continuar
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontWeight: 800 }}>!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Notificación informativa si hace clic en "¿Olvidaste tu contraseña?" */}
          {alertaOlvido && (
            <div
              style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                color: '#0369a1',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                marginBottom: '20px'
              }}
            >
              Por políticas de seguridad, contacta al Administrador de Redes de TCS en{' '}
              <strong>soporte@tcs.com.ve</strong> para restaurar tu clave de acceso.
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            {/* Campo 1: Correo Electrónico */}
            <div style={{ marginBottom: '20px' }}>
              <label
                htmlFor="correo-login"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px'
                }}
              >
                Correo Electrónico
              </label>
              <input
                id="correo-login"
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@tcs.com.ve"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
            </div>

            {/* Campo 2: Contraseña */}
            <div style={{ marginBottom: '10px' }}>
              <label
                htmlFor="pass-login"
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px'
                }}
              >
                Contraseña
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  id="pass-login"
                  type={mostrarContrasena ? 'text' : 'password'}
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0284c7')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  title={mostrarContrasena ? 'Ocultar contraseña' : 'Ver contraseña'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {mostrarContrasena ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Link ¿Olvidaste tu contraseña? */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setAlertaOlvido(!alertaOlvido)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Botón Principal: Acceder al Sistema */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px 20px',
                backgroundColor: '#0a2540',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.01em',
                boxShadow: '0 4px 12px rgba(10, 37, 64, 0.15)',
                transition: 'background-color 0.15s ease, transform 0.05s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0a2540')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.99)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Acceder al Sistema
            </button>
          </form>

          {/* Aviso de Confidencialidad */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p
              style={{
                fontSize: '0.74rem',
                color: '#94a3b8',
                margin: '0 0 16px 0',
                lineHeight: 1.4
              }}
            >
              Acceso restringido únicamente a personal autorizado de TCS.
            </p>

            {/* Pill de Versión y Build */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem'
              }}
            >
              <span
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  color: '#0284c7',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px'
                }}
              >
                v1.5.4
              </span>
              <span
                style={{
                  color: '#94a3b8',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.72rem'
                }}
              >
                · Build ce39d3a
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
