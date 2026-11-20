import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { Button } from '../common/Button';
import { MaskedAmount } from '../common/MaskedAmount';
import { HoverEyeTrigger } from '../common/HoverEyeTrigger';
import { ModalNuevoPago } from '../common/ModalNuevoPago';
import { formatearFechaVE } from '../../utils/formatters';
import { EstatusCXP } from '../../types';

// Opciones de paginación estandarizadas: 5, 15, 25, 50
const OPCIONES_PAGINACION = [5, 15, 25, 50];

export const CxpTable: React.FC = () => {
  const { compromisosCXP, cuotasCXC, proyectos, tasaBCV } = useData();
  const [filtroEstatus, setFiltroEstatus] = useState<string>('TODOS');
  const [itemsPorPagina, setItemsPorPagina] = useState<number>(5);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [mensajePago, setMensajePago] = useState<string | null>(null);
  const [mostrarMontosTabla, setMostrarMontosTabla] = useState<boolean>(false);
  const [modalPagoOpen, setModalPagoOpen] = useState<boolean>(false);
  const [compromisoParaPagoId, setCompromisoParaPagoId] = useState<string | undefined>(undefined);

  const getEstatusBadge = (estatus: EstatusCXP): { variant: BadgeVariant; label: string } => {
    switch (estatus) {
      case 'Pagado':
        return { variant: 'success', label: 'Pagado' };
      case 'Por Pagar':
        return { variant: 'warning', label: 'Por Pagar (Liberado)' };
      case 'Bloqueado por Cobro':
      default:
        return { variant: 'danger', label: 'Bloqueado por Cobro' };
    }
  };

  const compromisosFiltrados = compromisosCXP.filter((comp) => {
    if (filtroEstatus === 'TODOS') return true;
    return comp.estatus === filtroEstatus;
  });

  const totalItems = compromisosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const indiceInicio = (paginaSegura - 1) * itemsPorPagina;
  const indiceFin = Math.min(indiceInicio + itemsPorPagina, totalItems);
  const compromisosPaginados = compromisosFiltrados.slice(indiceInicio, indiceFin);

  const handleFiltroChange = (nuevoEstatus: string) => {
    setFiltroEstatus(nuevoEstatus);
    setPaginaActual(1);
  };

  const handleItemsPorPaginaChange = (cantidad: number) => {
    setItemsPorPagina(cantidad);
    setPaginaActual(1);
  };

  const handleAbrirModalPago = (id: string) => {
    setCompromisoParaPagoId(id);
    setModalPagoOpen(true);
  };

  const handlePagoExitoso = (proveedor: string, concepto: string) => {
    setMensajePago(`¡Pago registrado con éxito para "${proveedor}" (${concepto})!`);
    setTimeout(() => setMensajePago(null), 5000);
  };

  return (
    <div>
      {/* Alerta de notificación */}
      {mensajePago && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '2px solid #059669',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            color: '#065f46',
            fontWeight: 600,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>✓</span>
          <span>{mensajePago}</span>
        </div>
      )}

      <Card
        title="Compromisos de Pago a Terceros (CXP)"
        subtitle="Control estricto de egresos y flujo de caja con candado de seguridad"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {/* Un único ojo por clic para mantener visibles los montos al hacer scroll en la tabla */}
            <HoverEyeTrigger
              active={mostrarMontosTabla}
              onHoverChange={setMostrarMontosTabla}
              label="Ver montos de la tabla"
              mode="click"
            />

            {/* Selector de paginación: 5, 15, 25, 50 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.90rem', fontWeight: 600, color: '#475569' }}>
                Mostrar:
              </span>
              <select
                value={itemsPorPagina}
                onChange={(e) => handleItemsPorPaginaChange(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                {OPCIONES_PAGINACION.map((num) => (
                  <option key={num} value={num}>
                    {num} registros
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por estatus */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.90rem', fontWeight: 600, color: '#475569' }}>
                Filtrar por estatus:
              </span>
              <select
                value={filtroEstatus}
                onChange={(e) => handleFiltroChange(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.92rem',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                <option value="TODOS">Todos los estatus</option>
                <option value="Bloqueado por Cobro">Bloqueado por Cobro</option>
                <option value="Por Pagar">Por Pagar (Liberado)</option>
                <option value="Pagado">Pagado</option>
              </select>
            </div>
          </div>
        }
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.92rem', color: '#475569', fontWeight: 700 }}>
                  Proveedor & Concepto
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.92rem', color: '#475569', fontWeight: 700 }}>
                  Sustento de Cobro (Cuota CXC)
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.92rem', color: '#475569', fontWeight: 700 }}>
                  Vencimiento
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.92rem', color: '#475569', fontWeight: 700 }}>
                  Monto VES / Ref. USD
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.92rem', color: '#475569', fontWeight: 700 }}>
                  Estatus Candado
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.92rem', color: '#475569', fontWeight: 700, textAlign: 'center' }}>
                  Acción Operativa
                </th>
              </tr>
            </thead>
            <tbody>
              {compromisosPaginados.map((comp) => {
                const proyecto = proyectos.find((p) => p.id === comp.proyectoId);
                const cuotaAsociada = cuotasCXC.find((c) => c.id === comp.cuotaCxcAsociadaId);
                const cuotaEstaCobrada = cuotaAsociada?.estatus === 'Cobrado';
                const badge = getEstatusBadge(comp.estatus);

                return (
                  <tr
                    key={comp.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: comp.estatus === 'Bloqueado por Cobro' ? '#fffbfb' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '18px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                        {comp.proveedor}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#475569', fontWeight: 600, marginTop: '3px' }}>
                        RIF: {comp.rifProveedor} • {proyecto?.codigo}
                        {proyecto?.codigoOdoo ? ` • Odoo: ${proyecto.codigoOdoo}` : ''}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#64748b', marginTop: '3px' }}>
                        {comp.concepto}
                      </div>
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#1e293b' }}>
                        {cuotaAsociada ? `Cuota ${cuotaAsociada.numeroCuota} de ${cuotaAsociada.totalCuotas}` : 'Sin cuota vinculada'}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        {cuotaEstaCobrada ? (
                          <span style={{ fontSize: '0.84rem', color: '#059669', fontWeight: 700 }}>
                            ✓ Cobro del cliente validado
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.84rem', color: '#dc2626', fontWeight: 700 }}>
                            • Cliente aún debe la cuota ({cuotaAsociada?.estatus || 'Pendiente'})
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: '18px 16px',
                        fontWeight: 700,
                        fontSize: '1.08rem',
                        color: '#1e293b',
                        fontFamily: "'JetBrains Mono', monospace"
                      }}
                    >
                      {formatearFechaVE(comp.fechaVencimientoCalculada)}
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <MaskedAmount
                        montoUSD={comp.montoUSD}
                        tasaBCV={tasaBCV}
                        mostrarVES={true}
                        tamano="md"
                        color="#0f172a"
                        enmascarado={!mostrarMontosTabla}
                      />
                    </td>

                    <td style={{ padding: '18px 16px' }}>
                      <Badge label={badge.label} variant={badge.variant} />
                    </td>

                    <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                      {comp.estatus === 'Por Pagar' ? (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleAbrirModalPago(comp.id)}
                          title="Autorizar desembolso al proveedor"
                        >
                          Autorizar Pago
                        </Button>
                      ) : comp.estatus === 'Bloqueado por Cobro' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={true}
                          title="Bloqueado por Candado Financiero: La cuota de cobro no está cobrada"
                        >
                          Bloqueado
                        </Button>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.95rem' }}>
                          ✓ Pagado {comp.soporteComprobante ? `(${comp.soporteComprobante})` : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación Inferior (5, 15, 25, 50) */}
        <div
          style={{
            marginTop: '18px',
            paddingTop: '14px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.90rem', color: '#475569', fontWeight: 500 }}>
            Mostrando{' '}
            <strong style={{ color: '#0f172a' }}>
              {totalItems === 0 ? 0 : indiceInicio + 1} - {indiceFin}
            </strong>{' '}
            de <strong style={{ color: '#0f172a' }}>{totalItems}</strong> compromisos registrados
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
              disabled={paginaSegura <= 1}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: paginaSegura <= 1 ? '#f1f5f9' : '#ffffff',
                color: paginaSegura <= 1 ? '#94a3b8' : '#0f172a',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: paginaSegura <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ◀ Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((numPag) => {
              const activa = numPag === paginaSegura;
              return (
                <button
                  key={numPag}
                  onClick={() => setPaginaActual(numPag)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: activa ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: activa ? '#0f172a' : '#ffffff',
                    color: activa ? '#ffffff' : '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.90rem',
                    cursor: 'pointer'
                  }}
                >
                  {numPag}
                </button>
              );
            })}

            <button
              onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
              disabled={paginaSegura >= totalPaginas}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: paginaSegura >= totalPaginas ? '#f1f5f9' : '#ffffff',
                color: paginaSegura >= totalPaginas ? '#94a3b8' : '#0f172a',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: paginaSegura >= totalPaginas ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente ▶
            </button>
          </div>
        </div>
      </Card>

      {/* Modal Guiado para Autorizar Pago a Proveedor */}
      <ModalNuevoPago
        isOpen={modalPagoOpen}
        compromisoInicialId={compromisoParaPagoId}
        onClose={() => setModalPagoOpen(false)}
        onPagoExitoso={handlePagoExitoso}
      />
    </div>
  );
};
