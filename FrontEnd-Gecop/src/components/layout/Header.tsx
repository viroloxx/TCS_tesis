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
        height: '60px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {/* Botón colapsar menú y Nombre del Portal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Colapsar menú lateral' : 'Expandir menú lateral'}
          style={{
            background: 'none',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '1.1rem',
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
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}
          >
            <img
              src={tcsLogo}
              alt="Logo TCS"
              style={{
                height: '26px',
                width: 'auto',
                display: 'block'
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: '0.85rem',
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
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#64748b',
                lineHeight: 1.25
              }}
            >
              Portal de Gestión de Cobros y Pagos <span style={{ fontWeight: 700, color: '#0284c7' }}>(GECOP)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Candado Activo Centrado (Pulse Glow) interactivo hacia CXC */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          padding: '0 16px'
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
            title="Candado Financiero TCS: Haz clic para gestionar el Control de Cuentas por Cobrar (CXC)"
            style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '10px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#d97706',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              ●
            </span>
            <div style={{ fontSize: '0.80rem', color: '#92400e', whiteSpace: 'nowrap' }}>
              <strong style={{ fontWeight: 800 }}>Cobros Nuevos:</strong>{' '}
              <span>{kpis.compromisosBloqueadosCount} proyectos por cobrar.</span>
            </div>
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
            borderRadius: '10px',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            userSelect: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: fuenteTasaBCV === 'BCV Oficial (En Vivo)' ? '#065f46' : '#0f172a',
              backgroundColor: fuenteTasaBCV === 'BCV Oficial (En Vivo)' ? '#d1fae5' : '#e2e8f0',
              padding: '4px 7px',
              borderRadius: '6px',
              letterSpacing: '0.04em'
            }}
          >
            BCV
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {cargandoTasaBCV ? 'Sincronizando BCV...' : 'Tasa Oficial BCV'}
              </span>
              {fuenteTasaBCV === 'BCV Oficial (En Vivo)' && !cargandoTasaBCV && (
                <span
                  title="Sincronizada en vivo con el BCV"
                  style={{
                    width: '7px',
                    height: '7px',
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
                fontSize: '0.90rem',
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
              borderRadius: '7px',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: cargandoTasaBCV ? 'wait' : 'pointer',
              color: '#0284c7',
              fontWeight: 800,
              fontSize: '0.95rem',
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
