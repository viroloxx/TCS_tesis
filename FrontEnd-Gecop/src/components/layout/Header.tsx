import React from 'react';
import { useData } from '../../context/DataContext';
import { formatearMonedaVE } from '../../utils/formatters';
import { TabActiva } from './Sidebar';
import tcsLogo from '../../assets/images/tcs-logo.png';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNavigate?: (tab: TabActiva) => void;
}

export const Header: React.FC<HeaderProps> = ({ sidebarOpen, onToggleSidebar, onNavigate }) => {
  const {
    tasaBCV,
    cargandoTasaBCV,
    fechaActualizacionBCV,
    fuenteTasaBCV,
    sincronizarTasaBCV,
    kpis
  } = useData();

  const handleSyncBCV = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await sincronizarTasaBCV();
  };

  return (
    <header
      style={{
        minHeight: '76px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '10px 26px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
      }}
    >
      {/* Botón colapsar menú y Nombre del Portal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
          style={{
            background: '#f8fafc',
            border: '1.5px solid #cbd5e1',
            borderRadius: '10px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '1.15rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0f172a'
          }}
        >
          {sidebarOpen ? '◀' : '☰'}
        </button>

        {/* Logo TCS e Identidad del Portal alineados */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              backgroundColor: '#0f172a',
              borderRadius: '10px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(15, 23, 42, 0.12)'
            }}
          >
            <img
              src={tcsLogo}
              alt="Logo TCS"
              style={{
                height: '30px',
                width: 'auto',
                display: 'block'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '0.04em',
                lineHeight: 1.15,
                textTransform: 'uppercase'
              }}
            >
              Technology Consulting Solutions
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#64748b',
                lineHeight: 1.3
              }}
            >
              Portal de Gestión de Cobros y Pagos
            </span>
          </div>
        </div>
      </div>

      {/* Botón destacado en azul vibrante para Cobros Nuevos (Pulse Glow rápido) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          padding: '0 14px'
        }}
      >
        {kpis.compromisosBloqueadosCount > 0 && (
          <div
            onClick={() => onNavigate?.('cxc')}
            className="pulse-glow-candado"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onNavigate?.('cxc');
              }
            }}
            title="Cobros Nuevos pendientes: Haz clic para ir directamente al Control de Cuentas por Cobrar (CXC)"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #0284c7 100%)',
              border: '2px solid #60a5fa',
              borderRadius: '12px',
              padding: '10px 22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'filter 0.15s ease',
              color: '#ffffff'
            }}
          >
            <span
              style={{
                width: '11px',
                height: '11px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)',
                flexShrink: 0
              }}
            />
            <div style={{ fontSize: '0.96rem', color: '#ffffff', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
              <strong style={{ fontWeight: 800 }}>Cobros Nuevos:</strong>{' '}
              <span style={{ fontWeight: 600 }}>{kpis.compromisosBloqueadosCount} proyectos por cobrar</span>
            </div>
            <span
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: '#e0f2fe',
                lineHeight: 1,
                marginLeft: '2px'
              }}
            >
              →
            </span>
          </div>
        )}
      </div>

      {/* Acciones del Header: Indicador de Tasa Oficial BCV conectado en vivo (solo lectura + sincronización oficial) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        {/* Indicador de Tasa BCV */}
        <div
          title={
            fechaActualizacionBCV
              ? `Tasa Oficial del Banco Central de Venezuela (Actualizado: ${fechaActualizacionBCV})`
              : 'Tasa Oficial del Banco Central de Venezuela (BCV)'
          }
          style={{
            backgroundColor: '#f8fafc',
            border: `1.5px solid ${fuenteTasaBCV === 'BCV Oficial (En Vivo)' ? '#a7f3d0' : '#cbd5e1'}`,
            borderRadius: '12px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            userSelect: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              color: fuenteTasaBCV === 'BCV Oficial (En Vivo)' ? '#065f46' : '#0f172a',
              backgroundColor: fuenteTasaBCV === 'BCV Oficial (En Vivo)' ? '#d1fae5' : '#e2e8f0',
              padding: '5px 8px',
              borderRadius: '7px',
              letterSpacing: '0.04em'
            }}
          >
            BCV
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {cargandoTasaBCV ? 'Sincronizando BCV...' : 'Tasa Oficial BCV'}
              </span>
              {fuenteTasaBCV === 'BCV Oficial (En Vivo)' && !cargandoTasaBCV && (
                <span
                  title="Sincronizada en vivo con el BCV"
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#059669',
                    display: 'inline-block'
                  }}
                />
              )}
            </div>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                fontSize: '0.96rem',
                color: '#0f172a'
              }}
            >
              {formatearMonedaVE(tasaBCV, 'VES')} / $
            </span>
          </div>

          {/* Botón para sincronizar en vivo con el BCV */}
          <button
            type="button"
            onClick={handleSyncBCV}
            disabled={cargandoTasaBCV}
            title="Consultar y actualizar ahora mismo el valor oficial del dólar BCV en vivo"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: cargandoTasaBCV ? 'wait' : 'pointer',
              color: '#0284c7',
              fontWeight: 800,
              fontSize: '1.05rem',
              padding: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.borderColor = '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            ↻
          </button>
        </div>
      </div>
    </header>
  );
};
