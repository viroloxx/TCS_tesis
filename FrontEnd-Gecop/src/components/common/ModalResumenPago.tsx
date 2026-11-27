import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Badge, BadgeVariant } from './Badge';
import { Button } from './Button';
import { HoverEyeTrigger } from './HoverEyeTrigger';
import { formatearMonedaVE, formatearFechaVE, enmascararMonto } from '../../utils/formatters';
import { EstatusCXP } from '../../types';

interface ModalResumenPagoProps {
  isOpen: boolean;
  proyectoId?: string;
  onClose: () => void;
}

export const ModalResumenPago: React.FC<ModalResumenPagoProps> = ({
  isOpen,
  proyectoId,
  onClose
}) => {
  const { compromisosCXP, cuotasCXC, proyectos, clientes, tasaBCV } = useData();
  const [mostrarMontosResumen, setMostrarMontosResumen] = useState<boolean>(false);

  if (!isOpen || !proyectoId) return null;

  const proyecto = proyectos.find((p) => p.id === proyectoId);
  if (!proyecto) return null;

  const cliente = clientes.find((c) => c.id === proyecto.clienteId);
  const compromisosProyecto = compromisosCXP.filter((c) => c.proyectoId === proyecto.id);

  const fmtMonto = (montoUSD: number, moneda: 'VES' | 'USD'): string => {
    const val = moneda === 'VES' ? montoUSD * tasaBCV : montoUSD;
    return enmascararMonto(formatearMonedaVE(val, moneda), !mostrarMontosResumen);
  };

  const totalComprometidoUSD = compromisosProyecto.reduce((acc, c) => acc + c.montoUSD, 0);
  const totalPagadoUSD = compromisosProyecto
    .filter((c) => c.estatus === 'Pagado')
    .reduce((acc, c) => acc + c.montoUSD, 0);
  const totalPendienteUSD = Math.max(0, totalComprometidoUSD - totalPagadoUSD);
  const porcentajePagado =
    totalComprometidoUSD > 0 ? Math.round((totalPagadoUSD / totalComprometidoUSD) * 100) : 0;

  const pagadosCount = compromisosProyecto.filter((c) => c.estatus === 'Pagado').length;
  const liberadosCount = compromisosProyecto.filter((c) => c.estatus === 'Por Pagar').length;
  const bloqueadosCount = compromisosProyecto.filter((c) => c.estatus === 'Bloqueado por Cobro').length;

  const getBadgeEstatusCxp = (estatus: EstatusCXP): { variant: BadgeVariant; label: string } => {
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

  return (
    <div
      onClick={onClose}
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
        zIndex: 110,
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '32px 36px',
          maxWidth: '1080px',
          width: '96%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 30px -5px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1'
        }}
      >
        {/* Cabecera del Modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '16px',
            marginBottom: '20px',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Resumen de Compromisos de Pago a Terceros
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
              {proyecto.codigo} {proyecto.codigoOdoo ? `• Orden Odoo: ${proyecto.codigoOdoo}` : ''} —{' '}
              <strong style={{ color: '#0f172a' }}>{proyecto.nombre}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HoverEyeTrigger
              active={mostrarMontosResumen}
              onHoverChange={setMostrarMontosResumen}
              label="Ver montos"
              mode="click"
            />
            <button
              onClick={onClose}
              title="Cerrar resumen"
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                fontSize: '1.1rem',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 1. Tarjeta de Información del Proyecto & Estado de Candados */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Proyecto & Cliente Asociado
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Cliente:</span>
                <strong style={{ color: '#0f172a' }}>{cliente?.razonSocial || 'Cliente Corporativo'}</strong>{' '}
                <span style={{ color: '#475569', fontWeight: 600 }}>({cliente?.rif || 'N/A'})</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Responsable PMO:</span>
                <strong style={{ color: '#0f172a' }}>{proyecto.responsablePMO}</strong>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Estatus de Candado Financiero
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
                  {pagadosCount}
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#065f46' }}>Pagados</div>
              </div>
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.15rem', fontWeight: 800, color: '#d97706' }}>
                  {liberadosCount}
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#92400e' }}>Liberados</div>
              </div>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '1.15rem', fontWeight: 800, color: '#dc2626' }}>
                  {bloqueadosCount}
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991b1b' }}>Bloqueados</div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Progreso General de Pagos a Terceros */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                Estado General de Pagos a Terceros del Proyecto
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '8px' }}>
                ({pagadosCount} de {compromisosProyecto.length} compromisos pagados)
              </span>
            </div>
            <span
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.86rem',
                padding: '4px 10px',
                borderRadius: '20px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            >
              {porcentajePagado}% Pagado
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#e2e8f0',
              borderRadius: '999px',
              overflow: 'hidden',
              marginBottom: '14px'
            }}
          >
            <div
              style={{
                width: `${porcentajePagado}%`,
                height: '100%',
                backgroundColor: '#059669',
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              backgroundColor: '#f8fafc',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}
          >
            <div>
              <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Comprometido
              </span>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.02rem', color: '#0f172a' }}>
                {fmtMonto(totalComprometidoUSD, 'VES')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                Ref. {fmtMonto(totalComprometidoUSD, 'USD')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Pagado a Proveedores
              </span>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.02rem', color: '#059669' }}>
                {fmtMonto(totalPagadoUSD, 'VES')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#047857', fontWeight: 600 }}>
                Ref. {fmtMonto(totalPagadoUSD, 'USD')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.76rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>
                Saldo Pendiente por Pagar
              </span>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.02rem', color: '#d97706' }}>
                {fmtMonto(totalPendienteUSD, 'VES')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#b45309', fontWeight: 600 }}>
                Ref. {fmtMonto(totalPendienteUSD, 'USD')}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Desglose de Compromisos de Pago del Proyecto */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            Desglose de Compromisos con Proveedores y Sustento
          </h4>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Proveedor & Concepto</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Sustento CXC</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Monto</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {compromisosProyecto.map((comp) => {
                  const cuota = cuotasCXC.find((c) => c.id === comp.cuotaCxcAsociadaId);
                  const badge = getBadgeEstatusCxp(comp.estatus);
                  return (
                    <tr
                      key={comp.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: comp.estatus === 'Pagado' ? '#f0fdf4' : comp.estatus === 'Bloqueado por Cobro' ? '#fffbfb' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{comp.proveedor}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                          RIF: {comp.rifProveedor} • {comp.concepto}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                          Vence: {formatearFechaVE(comp.fechaVencimientoCalculada)}
                          {comp.soporteComprobante ? ` • Comprobante: ${comp.soporteComprobante}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>
                          {cuota ? `Cuota ${cuota.numeroCuota} de ${cuota.totalCuotas}` : 'Sin cuota'}
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: cuota?.estatus === 'Cobrado' ? '#059669' : '#dc2626', marginTop: '2px' }}>
                          {cuota?.estatus === 'Cobrado'
                            ? '✓ Cobro validado'
                            : `• Pendiente (${cuota?.estatus || 'N/A'})`}
                        </div>
                      </td>

                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0f172a' }}>
                          {fmtMonto(comp.montoUSD, 'VES')}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                          Ref. {fmtMonto(comp.montoUSD, 'USD')}
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <Badge label={badge.label} variant={badge.variant} />
                        {comp.estatus === 'Pagado' && comp.fechaPagoEfectivo && (
                          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                            Pagado: {formatearFechaVE(comp.fechaPagoEfectivo)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie del Modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
          <Button variant="primary" size="md" onClick={onClose}>
            Cerrar Resumen
          </Button>
        </div>
      </div>
    </div>
  );
};
