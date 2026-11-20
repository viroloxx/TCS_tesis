import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { MaskedAmount } from '../common/MaskedAmount';
import { Badge } from '../common/Badge';
import { HoverEyeTrigger } from '../common/HoverEyeTrigger';
import { formatearMonedaVE, enmascararMonto } from '../../utils/formatters';

export const MonthlyProjection: React.FC = () => {
  const { proyecciones, tasaBCV } = useData();
  const [mostrarMontos, setMostrarMontos] = useState<boolean>(false);

  return (
    <Card
      title="Proyección Mensual Consolidada de Flujo"
      subtitle="Integración Odoo Ventas + El Cotizador TCS + Cronograma PMO Propia"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HoverEyeTrigger
            active={mostrarMontos}
            onHoverChange={setMostrarMontos}
            label="Ver montos"
            mode="click"
          />
          <Badge label="Cálculo en Tiempo Real" variant="info" />
        </div>
      }
    >
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '14px 16px', fontSize: '0.94rem', color: '#475569', fontWeight: 700 }}>
                Periodo / Mes
              </th>
              <th style={{ padding: '14px 16px', fontSize: '0.94rem', color: '#065f46', fontWeight: 700 }}>
                ↙ Ingresos Proyectados (CXC)
              </th>
              <th style={{ padding: '14px 16px', fontSize: '0.94rem', color: '#991b1b', fontWeight: 700 }}>
                ↗ Egresos Proyectados (CXP)
              </th>
              <th style={{ padding: '14px 16px', fontSize: '0.94rem', color: '#0f172a', fontWeight: 700 }}>
                Flujo Neto Estimado
              </th>
              <th style={{ padding: '14px 16px', fontSize: '0.94rem', color: '#475569', fontWeight: 700 }}>
                Estatus Proyección
              </th>
            </tr>
          </thead>
          <tbody>
            {proyecciones.map((p) => {
              const totalIngresos = p.totalCXCCobradoUSD + p.totalCXCEstimadoUSD;
              const totalEgresos = p.totalCXPPagadoUSD + p.totalCXPEstimadoUSD;
              const esPositivo = p.flujoNetoProyectadoUSD >= 0;

              const cobradoVES = enmascararMonto(
                formatearMonedaVE(p.totalCXCCobradoUSD * tasaBCV, 'VES'),
                !mostrarMontos
              );
              const pagadoVES = enmascararMonto(
                formatearMonedaVE(p.totalCXPPagadoUSD * tasaBCV, 'VES'),
                !mostrarMontos
              );

              return (
                <tr
                  key={p.mesAno}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background-color 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <td style={{ padding: '16px', fontWeight: 700, fontSize: '1.02rem', color: '#0f172a' }}>
                    {p.nombreMes}
                    <div
                      style={{
                        fontSize: '0.84rem',
                        color: '#64748b',
                        fontWeight: 500,
                        marginTop: '3px',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      Cobrado: {cobradoVES} | Pagado: {pagadoVES}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <MaskedAmount
                      montoUSD={totalIngresos}
                      tasaBCV={tasaBCV}
                      mostrarVES={true}
                      tamano="md"
                      color="#047857"
                      enmascarado={!mostrarMontos}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <MaskedAmount
                      montoUSD={totalEgresos}
                      tasaBCV={tasaBCV}
                      mostrarVES={true}
                      tamano="md"
                      color="#b91c1c"
                      enmascarado={!mostrarMontos}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div
                      style={{
                        padding: '6px 12px',
                        backgroundColor: esPositivo ? '#f0fdf4' : '#fef2f2',
                        borderRadius: '8px',
                        display: 'inline-block',
                        border: `1px solid ${esPositivo ? '#bbf7d0' : '#fecaca'}`
                      }}
                    >
                      <MaskedAmount
                        montoUSD={p.flujoNetoProyectadoUSD}
                        tasaBCV={tasaBCV}
                        mostrarVES={true}
                        tamano="md"
                        color={esPositivo ? '#15803d' : '#b91c1c'}
                        enmascarado={!mostrarMontos}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {esPositivo ? (
                      <Badge label="Superávit Operativo" variant="success" icon="▲" />
                    ) : (
                      <Badge label="Déficit / Ajuste" variant="danger" icon="▼" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
