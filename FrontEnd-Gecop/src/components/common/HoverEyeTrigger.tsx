import React from 'react';

interface HoverEyeTriggerProps {
  active: boolean;
  onHoverChange: (visible: boolean) => void;
  label?: string;
  mode?: 'hover' | 'click';
}

export const HoverEyeTrigger: React.FC<HoverEyeTriggerProps> = ({
  active,
  onHoverChange,
  label = 'Ver montos',
  mode = 'hover'
}) => {
  const esClick = mode === 'click';

  const textoBoton = esClick
    ? active
      ? 'Ocultar montos'
      : label
    : label;

  return (
    <button
      type="button"
      onClick={esClick ? () => onHoverChange(!active) : undefined}
      onMouseEnter={!esClick ? () => onHoverChange(true) : undefined}
      onMouseLeave={!esClick ? () => onHoverChange(false) : undefined}
      title={
        esClick
          ? active
            ? 'Haga clic para volver a ocultar los montos de la tabla'
            : 'Haga clic para dejar visibles los montos mientras hace scroll en la tabla'
          : 'Pase el cursor por encima del ojo para revelar los montos en Bolívares y Dólares'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '7px 14px',
        minWidth: esClick && label ? '168px' : undefined,
        borderRadius: '10px',
        backgroundColor: active ? '#e0f2fe' : '#f1f5f9',
        border: `1.5px solid ${active ? '#0284c7' : '#cbd5e1'}`,
        color: active ? '#0369a1' : '#334155',
        fontWeight: 700,
        fontSize: '0.88rem',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease'
      }}
    >
      {esClick && active ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
      {textoBoton && <span>{textoBoton}</span>}
    </button>
  );
};
