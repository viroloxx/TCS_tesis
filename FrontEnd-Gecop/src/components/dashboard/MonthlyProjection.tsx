import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { MaskedAmount } from '../common/MaskedAmount';
import { Badge } from '../common/Badge';
import { HoverEyeTrigger } from '../common/HoverEyeTrigger';
import { formatearMonedaVE, enmascararMonto } from '../../utils/formatters';

type PeriodoFiltro = 'MES_ACTUAL' | '3_MESES' | '6_MESES' | '1_ANO';

const ETIQUETAS_PERIODO: Record<PeriodoFiltro, string> = {
  MES_ACTUAL: 'Mes actual',
  '3_MESES': 'Últimos 3 meses',
  '6_MESES': 'Últimos 6 meses',
  '1_ANO': 'Último año (12 meses)'
};

export const MonthlyProjection: React.FC = () => {
  const { proyecciones, tasaBCV } = useData();
  const [mostrarMontos, setMostrarMontos] = useState<boolean>(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('3_MESES');

  const proyeccionesFiltradas = useMemo(() => {
    if (proyecciones.length === 0) return [];

    // Cortar siempre en el mes actual hacia atrás, excluyendo meses futuros
    const hoy = new Date();
    const mesLocal = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    const mesCorteActual = proyecciones.some((p) => p.mesAno <= mesLocal) ? mesLocal : '2026-11';
    const hastaMesActual = proyecciones.filter((p) => p.mesAno <= mesCorteActual);

    switch (periodoFiltro) {
      case 'MES_ACTUAL':
        return hastaMesActual.slice(-1);
      case '3_MESES':
        return hastaMesActual.slice(-3);
      case '6_MESES':
        return hastaMesActual.slice(-6);
      case '1_ANO':
      default:
        return hastaMesActual.slice(-12);
    }
  }, [proyecciones, periodoFiltro]);

  return (
    <Card
      title="Proyección Mensual Consolidada de Flujo"
      subtitle="Integración Odoo Ventas + El Cotizador TCS + Cronograma PMO Propia"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="filtro-periodo-proyeccion"
              style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569' }}
            >
              Periodo:
            </label>
            <select
              id="filtro-periodo-proyeccion"
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value as PeriodoFiltro)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.90rem',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="MES_ACTUAL">Mes actual</option>
              <option value="3_MESES">Últimos 3 meses</option>
              <option value="6_MESES">Últimos 6 meses</option>
              <option value="1_ANO">Último año</option>
            </select>
          </div>

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
            {proyeccionesFiltradas.map((p) => {
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

      {/* Pie informativo del periodo visualizado */}
      <div
        style={{
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '0.88rem',
          color: '#475569'
        }}
      >
        <span>
          Visualizando{' '}
          <strong style={{ color: '#0f172a' }}>
            {proyeccionesFiltradas.length}{' '}
            {proyeccionesFiltradas.length === 1 ? 'mes' : 'meses'}
          </strong>{' '}
          • Periodo seleccionado:{' '}
          <strong style={{ color: '#0f172a' }}>{ETIQUETAS_PERIODO[periodoFiltro]}</strong>
        </span>
        {proyeccionesFiltradas.length > 0 && (
          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>
            Rango: {proyeccionesFiltradas[0].nombreMes}
            {proyeccionesFiltradas.length > 1
              ? ` — ${proyeccionesFiltradas[proyeccionesFiltradas.length - 1].nombreMes}`
              : ''}
          </span>
        )}
      </div>
    </Card>
  );
};
