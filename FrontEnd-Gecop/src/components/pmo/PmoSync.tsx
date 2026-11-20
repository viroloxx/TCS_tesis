import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge, BadgeVariant } from '../common/Badge';
import { formatearFechaVE } from '../../utils/formatters';
import { EstatusEntregable } from '../../types';

export const PmoSync: React.FC = () => {
  const { entregables, proyectos, cuotasCXC, actualizarFechaEntregable } = useData();
  const [fechasEdicion, setFechasEdicion] = useState<Record<string, string>>({});
  const [mensajeSync, setMensajeSync] = useState<string | null>(null);

  const getEstatusBadge = (estatus: EstatusEntregable): { variant: BadgeVariant; label: string } => {
    switch (estatus) {
      case 'Completado':
        return { variant: 'success', label: 'Completado' };
      case 'En Proceso':
        return { variant: 'info', label: 'En Proceso' };
      case 'Retrasado':
        return { variant: 'danger', label: 'Retrasado' };
      case 'Pendiente Aprobación':
      default:
        return { variant: 'warning', label: 'Pendiente' };
    }
  };

  const handleFechaChange = (entregableId: string, valor: string) => {
    setFechasEdicion((prev) => ({ ...prev, [entregableId]: valor }));
  };

  const handleGuardarFecha = (entregableId: string, descHito: string) => {
    const nuevaFecha = fechasEdicion[entregableId];
    if (!nuevaFecha) return;

    actualizarFechaEntregable(entregableId, nuevaFecha);
    setMensajeSync(
      `¡Cronograma sincronizado con éxito! La fecha del hito "${descHito}" se actualizó a ${formatearFechaVE(
        nuevaFecha
      )}. Las cuotas de cobro (CXC) asociadas y la proyección mensual se han recalculado en tiempo real.`
    );
    setTimeout(() => setMensajeSync(null), 6000);
  };

  return (
    <div>
      {/* Alerta de sincronización */}
      {mensajeSync && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '2px solid #2563eb',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#1e40af',
            fontWeight: 600,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>↻</span>
          <span>{mensajeSync}</span>
        </div>
      )}

      {/* Tarjeta Explicativa */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>
            Regla de Negocio TCS: Sincronización Automática PMO
          </h4>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.4 }}>
            Cualquier reprogramación de fechas en los entregables y actas de aceptación técnica de la PMO
            impacta de forma inmediata las fechas de vencimiento de las cuotas CXC y redistribuye los
            ingresos en el motor de Proyección Mensual Consolidada.
          </p>
        </div>
      </div>

      <Card
        title="Cronograma de Entregables e Hitos PMO"
        subtitle="Sincronización directa entre la Gestión de Proyectos y el Flujo Financiero"
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
                  Proyecto & Responsable PMO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
                  Hito / Entregable
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
                  Avance PMO
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
                  Fecha Programada
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 700 }}>
                  Cuota Vinculada
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.88rem', color: '#475569', fontWeight: 700, textAlign: 'center' }}>
                  Reprogramar Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {entregables.map((ent) => {
                const proyecto = proyectos.find((p) => p.id === ent.proyectoId);
                const cuotaAsociada = cuotasCXC.find((c) => c.entregableId === ent.id);
                const badge = getEstatusBadge(ent.estatus);
                const fechaActual = fechasEdicion[ent.id] ?? ent.fechaProgramada;

                return (
                  <tr
                    key={ent.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9'
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                        {proyecto?.nombre}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {proyecto?.responsablePMO} • {proyecto?.codigo}
                      </div>
                    </td>

                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.90rem', color: '#1e293b' }}>
                        {ent.codigoHito}: {ent.descripcion}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <Badge label={badge.label} variant={badge.variant} size="sm" />
                      </div>
                    </td>

                    <td style={{ padding: '16px', width: '130px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}
                        >
                          <div
                            style={{
                              width: `${ent.porcentajeAvance}%`,
                              height: '100%',
                              backgroundColor: ent.porcentajeAvance === 100 ? '#059669' : '#2563eb'
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                          {ent.porcentajeAvance}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '16px', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                      {formatearFechaVE(ent.fechaProgramada)}
                    </td>

                    <td style={{ padding: '16px' }}>
                      {cuotaAsociada ? (
                        <div style={{ fontSize: '0.82rem', color: '#1e40af', fontWeight: 600 }}>
                          Cuota #{cuotaAsociada.numeroCuota} (${cuotaAsociada.montoUSD.toLocaleString('es-VE')})
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.80rem', color: '#94a3b8' }}>Sin cuota</span>
                      )}
                    </td>

                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="date"
                          value={fechaActual}
                          onChange={(e) => handleFechaChange(ent.id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: '#0f172a'
                          }}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleGuardarFecha(ent.id, ent.descripcion)}
                          title="Sincronizar fecha y recalcular proyección"
                        >
                          Sincronizar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
