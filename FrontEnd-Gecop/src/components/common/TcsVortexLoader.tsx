import React from 'react';
import tcsLogo from '../../assets/images/tcs-logo.png';

export type VortexTransitionType = 'login' | 'logout' | 'crm';

interface TcsVortexLoaderProps {
  isOpen: boolean;
  titulo?: string;
  subtitulo?: string;
  tipo?: VortexTransitionType;
}

export const TcsVortexLoader: React.FC<TcsVortexLoaderProps> = ({
  isOpen,
  titulo = 'Cargando Portal de Gestión (GECOP)'
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={titulo}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#071527',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none'
      }}
    >
      <img
        src={tcsLogo}
        alt="Logotipo Technology Consulting Solutions"
        className="tcs-logo-vortex-simple"
        style={{
          width: '140px',
          height: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  );
};
