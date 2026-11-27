import React from 'react';
import { useMasking } from '../../context/MaskingContext';
import { formatearMonedaVE, enmascararMonto, convertirUsdAves } from '../../utils/formatters';

interface MaskedAmountProps {
  montoUSD: number;
  tasaBCV?: number;
  mostrarVES?: boolean;
  tamano?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  enmascarado?: boolean;
}

export const MaskedAmount: React.FC<MaskedAmountProps> = ({
  montoUSD,
  tasaBCV,
  mostrarVES = false,
  tamano = 'md',
  color = '#0f172a',
  className,
  enmascarado
}) => {
  const { isMasked } = useMasking();
  const ocultarMonto = enmascarado !== undefined ? enmascarado : isMasked;

  const formattedUSD = formatearMonedaVE(montoUSD, 'USD');
  const displayUSD = enmascararMonto(formattedUSD, ocultarMonto);

  const getFontSize = () => {
    switch (tamano) {
      case 'sm':
        return '0.96rem';
      case 'lg':
        return '1.42rem';
      case 'xl':
        return '1.78rem';
      case 'md':
      default:
        return '1.14rem';
    }
  };

  let displayVES = '';
  if (tasaBCV && tasaBCV > 0) {
    const montoVES = convertirUsdAves(montoUSD, tasaBCV);
    const formattedVES = formatearMonedaVE(montoVES, 'VES');
    displayVES = enmascararMonto(formattedVES, ocultarMonto);
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      {mostrarVES && displayVES ? (
        <>
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
              fontWeight: 700,
              fontSize: getFontSize(),
              color: color,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              whiteSpace: 'nowrap'
            }}
          >
            {displayVES}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
              fontWeight: 600,
              fontSize: '0.90rem',
              color: '#475569',
              marginTop: '3px',
              lineHeight: 1.25,
              whiteSpace: 'nowrap'
            }}
          >
            Ref. {displayUSD}
          </span>
        </>
      ) : (
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Courier New', Courier, monospace",
            fontWeight: 700,
            fontSize: getFontSize(),
            color: color,
            letterSpacing: '-0.02em',
            lineHeight: 1.2
          }}
        >
          {displayUSD}
        </span>
      )}
    </div>
  );
};
