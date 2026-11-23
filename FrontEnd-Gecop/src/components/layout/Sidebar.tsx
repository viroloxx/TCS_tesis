import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';

export type TabActiva = 'dashboard' | 'proyeccion' | 'cxc' | 'cxp' | 'pmo';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab: TabActiva;
  onSelectTab: (tab: TabActiva) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  activeTab,
  onSelectTab
}) => {
  const { usuario, logout } = useAuth();
  const [confirmarSalidaOpen, setConfirmarSalidaOpen] = useState<boolean>(false);
  const menuItems = [
    {
      id: 'dashboard' as TabActiva,
      label: 'Tablero de Control',
      symbol: '▣',
      desc: 'KPIs y Resumen Financiero'
    },
    {
      id: 'cxc' as TabActiva,
      label: 'Control de Cobros',
      symbol: '↙',
      desc: 'Facturación y Recaudación'
    },
    {
      id: 'cxp' as TabActiva,
      label: 'Compromisos de Pago',
      symbol: '↗',
      desc: 'Candado Financiero a Terceros'
    }
  ];

  return (
    <>
      <aside
      style={{
        width: collapsed ? '72px' : '260px',
        backgroundColor: '#0f172a', // Navy institucional TCS
        color: '#ffffff',
        transition: 'width 0.25s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: 'calc(100vh - 60px)',
        position: 'sticky',
        top: '60px',
        borderRight: '1px solid #1e293b',
        userSelect: 'none',
        overflowX: 'hidden'
      }}
    >
      {/* Navegación Principal */}
      <div style={{ padding: collapsed ? '16px 8px' : '20px 16px' }}>
        {!collapsed && (
          <div style={{ marginBottom: '20px', paddingLeft: '8px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                color: '#94a3b8',
                fontWeight: 700,
                letterSpacing: '0.05em'
              }}
            >
              Módulos Principales
            </span>
          </div>
        )}

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: collapsed ? '12px 0' : '12px 14px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: isActive ? '4px solid #38bdf8' : '4px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    width: '24px',
                    textAlign: 'center',
                    color: isActive ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {item.symbol}
                </span>
                {!collapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: isActive ? 700 : 500 }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {item.desc}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer del Sidebar: Perfil de Usuario, Botón Salir y Versión */}
      <div
        style={{
          padding: collapsed ? '14px 8px' : '16px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Bloque de Usuario */}
        <div
          title={collapsed ? `${usuario?.nombre || 'Administrador GECOP'} (${usuario?.rol || 'Finanzas & Cobros'})` : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              border: '1.5px solid #38bdf8',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0
            }}
          >
            {usuario?.iniciales || 'AD'}
          </div>

          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <span
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {usuario?.nombre || 'Administrador GECOP'}
              </span>
              <span
                style={{
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {usuario?.rol || 'Finanzas & Cobros'}
              </span>
            </div>
          )}
        </div>

        {/* Botón Salir */}
        <button
          onClick={() => setConfirmarSalidaOpen(true)}
          title="Cerrar sesión del sistema"
          style={{
            backgroundColor: '#dc2626',
            border: '1px solid #ef4444',
            cursor: 'pointer',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 700,
            padding: collapsed ? '8px 0' : '9px 12px',
            borderRadius: '8px',
            width: '100%',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
        >
          <span style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1 }}>↪</span>
          {!collapsed && <span>Salir</span>}
        </button>

        {/* Versión corporativa */}
        <div style={{ textAlign: collapsed ? 'center' : 'left', paddingTop: '4px' }}>
          {!collapsed ? (
            <div>
              <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#94a3b8' }}>
                TCS ERP • Módulo ADM
              </div>
              <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px' }}>
                v1.0.0 • Ecosistema GECOP
              </div>
            </div>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>v1.0</span>
          )}
        </div>
      </div>
    </aside>

      {confirmarSalidaOpen &&
        createPortal(
          <div
            onClick={() => setConfirmarSalidaOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-salir-titulo"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
              padding: '20px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '28px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
                border: '1px solid #cbd5e1',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '14px'
                }}
              >
                <span
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}
                >
                  ↪
                </span>
                <h3
                  id="modal-salir-titulo"
                  style={{
                    margin: 0,
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#0f172a'
                  }}
                >
                  Confirmar Cierre de Sesión
                </h3>
              </div>

              <p
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '0.96rem',
                  lineHeight: 1.5,
                  color: '#334155'
                }}
              >
                ¿Está seguro que desea cerrar la sesión actual de{' '}
                <strong style={{ color: '#0f172a' }}>
                  {usuario?.nombre || 'Administrador GECOP'}
                </strong>{' '}
                y volver a la pantalla de inicio de sesión?
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setConfirmarSalidaOpen(false)}
                  style={{
                    padding: '10px 18px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    color: '#0f172a',
                    border: '2px solid #cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmarSalidaOpen(false);
                    logout();
                  }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: '1px solid #b91c1c',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                >
                  Sí, Salir al Login
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
