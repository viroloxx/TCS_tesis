import React, { useState } from 'react';
import { Card } from '../common/Card';
import { formatearMonedaVE, enmascararMonto, convertirUsdAves } from '../../utils/formatters';

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

  const ocultarMonto = !revelarPorHover;
  const montoVES = convertirUsdAves(montoUSD, tasaBCV);
  const textoVES = enmascararMonto(formatearMonedaVE(montoVES, 'VES'), ocultarMonto);
  const textoUSD = enmascararMonto(formatearMonedaVE(montoUSD, 'USD'), ocultarMonto);

  return (
    <Card
      style={{
        borderLeft: colorBorde ? `5px solid ${colorBorde}` : undefined,
        marginBottom: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <div>
        {/* Fila superior fija: Título a la izquierda y botón de ojo con posición/tamaño bloqueado a la derecha */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              lineHeight: 1.25
            }}
          >
            {titulo}
          </span>

          <div
            onMouseEnter={() => setRevelarPorHover(true)}
            onMouseLeave={() => setRevelarPorHover(false)}
            title="Pasa el cursor por encima para revelar el monto"
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              flexShrink: 0,
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
              transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease'
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

        {/* Contenedor de montos con altura fija y ancho completo para evitar saltos o descuadres */}
        <div
          style={{
            marginTop: '10px',
            minHeight: '58px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
              fontWeight: 700,
              fontSize: 'clamp(1.16rem, 1.42vw, 1.46rem)',
              color: esAlerta ? '#dc2626' : '#0f172a',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            {textoVES}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
              fontWeight: 600,
              fontSize: '0.90rem',
              color: '#475569',
              marginTop: '4px',
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              display: 'block'
            }}
          >
            Ref. {textoUSD}
          </span>
        </div>
      </div>

      {(badgeTexto || detalleTexto) && (
        <div
          style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            fontSize: '0.82rem'
          }}
        >
          {badgeTexto && (
            <span
              style={{
                backgroundColor: `${badgeColor}15`,
                color: badgeColor,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              {badgeTexto}
            </span>
          )}
          {detalleTexto && (
            <span style={{ color: '#64748b', fontWeight: 500, textAlign: 'right' }}>
              {detalleTexto}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
