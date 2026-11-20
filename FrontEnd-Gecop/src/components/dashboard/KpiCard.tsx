import React, { useState } from 'react';
import { Card } from '../common/Card';
import { MaskedAmount } from '../common/MaskedAmount';

interface KpiCardProps {
  titulo: string;
  montoUSD: number;
  tasaBCV: number;
  emoji?: string;
  badgeTexto?: string;
  badgeColor?: string;
  bordeColor?: string;
  esAlerta?: boolean;
  detalleTexto?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  titulo,
  montoUSD,
  tasaBCV,
  badgeTexto,
  badgeColor = '#059669',
  bordeColor,
  esAlerta = false,
  detalleTexto
}) => {
  // Por defecto en modo incógnito; al pasar por encima del ojo se revelan los valores
  const [revelarPorHover, setRevelarPorHover] = useState<boolean>(false);
  const colorBorde = bordeColor || (esAlerta ? '#ef4444' : undefined);

  return (
    <Card
      style={{
        borderLeft: colorBorde ? `5px solid ${colorBorde}` : undefined,
        marginBottom: 0
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            {titulo}
          </span>
          <div style={{ marginTop: '8px' }}>
            <MaskedAmount
              montoUSD={montoUSD}
              tasaBCV={tasaBCV}
              mostrarVES={true}
              tamano="xl"
              color={esAlerta ? '#dc2626' : '#0f172a'}
              enmascarado={!revelarPorHover}
            />
          </div>
        </div>

        <div
          onMouseEnter={() => setRevelarPorHover(true)}
          onMouseLeave={() => setRevelarPorHover(false)}
          title="Pasa el cursor por encima para revelar el monto"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: revelarPorHover
              ? (esAlerta ? '#fee2e2' : '#e0f2fe')
              : (esAlerta ? '#fef2f2' : '#f1f5f9'),
            border: revelarPorHover
              ? `1.5px solid ${esAlerta ? '#ef4444' : '#38bdf8'}`
              : '1.5px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: revelarPorHover
              ? (esAlerta ? '#dc2626' : '#0284c7')
              : '#64748b',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      </div>

      {(badgeTexto || detalleTexto) && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.82rem'
          }}
        >
          {badgeTexto && (
            <span
              style={{
                backgroundColor: `${badgeColor}15`,
                color: badgeColor,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px'
              }}
            >
              {badgeTexto}
            </span>
          )}
          {detalleTexto && (
            <span style={{ color: '#64748b', fontWeight: 500 }}>
              {detalleTexto}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
