import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Badge, BadgeVariant } from './Badge';
import { Button } from './Button';
import { HoverEyeTrigger } from './HoverEyeTrigger';
import { formatearMonedaVE, formatearFechaVE, enmascararMonto } from '../../utils/formatters';
import { exportarOImprimirResumenProyecto } from '../../utils/printResumen';
import { EstatusCXC, EstatusEntregable } from '../../types';

interface ModalResumenCobroProps {
  isOpen: boolean;
  cuotaId?: string;
  onClose: () => void;
}

export const ModalResumenCobro: React.FC<ModalResumenCobroProps> = ({
  isOpen,
  cuotaId,
  onClose
}) => {
  const { cuotasCXC, proyectos, clientes, entregables, compromisosCXP, tasaBCV } = useData();
  const [mostrarMontosResumen, setMostrarMontosResumen] = useState<boolean>(false);

  if (!isOpen || !cuotaId) return null;

  const cuotaRef = cuotasCXC.find((c) => c.id === cuotaId);
  if (!cuotaRef) return null;

  const cuotasProyecto = cuotasCXC
    .filter((c) => c.proyectoId === cuotaRef.proyectoId)
    .sort((a, b) => a.numeroCuota - b.numeroCuota);

  // Cuota en turno actual (o cuotaRef si ya todo está cobrado)
  const cuotaEnTurnoProyecto = cuotasProyecto.find((c) => c.estatus !== 'Cobrado');
  const cuota = cuotaEnTurnoProyecto || cuotaRef;

  const proyecto = proyectos.find((p) => p.id === cuota.proyectoId);
  const cliente = clientes.find((c) => c.id === proyecto?.clienteId);
  const entregablesProyecto = entregables.filter((e) => e.proyectoId === cuota.proyectoId);
  const compromisosVinculados = compromisosCXP.filter((cxp) => cxp.cuotaCxcAsociadaId === cuota.id);

  const esPagoAlContado =
    proyecto?.modalidadPago === 'Al Contado' || cuotasProyecto.length === 1;

  const fmtMonto = (montoUSD: number, moneda: 'VES' | 'USD'): string => {
    const val = moneda === 'VES' ? montoUSD * tasaBCV : montoUSD;
    return enmascararMonto(formatearMonedaVE(val, moneda), !mostrarMontosResumen);
  };

  const montoTotalProyectoUSD = cuotasProyecto.reduce((acc, c) => acc + c.montoUSD, 0);
  const montoCobradoProyectoUSD = cuotasProyecto
    .filter((c) => c.estatus === 'Cobrado')
    .reduce((acc, c) => acc + c.montoUSD, 0);
  const montoPendienteProyectoUSD = Math.max(0, montoTotalProyectoUSD - montoCobradoProyectoUSD);
  const porcentajePagado =
    montoTotalProyectoUSD > 0
      ? Math.round((montoCobradoProyectoUSD / montoTotalProyectoUSD) * 100)
      : 0;

  const cuotasCobradasCount = cuotasProyecto.filter((c) => c.estatus === 'Cobrado').length;
  const proyectoCompletamentePagado =
    cuotasProyecto.length > 0 && cuotasCobradasCount === cuotasProyecto.length;

  const getBadgeEstatusCuota = (estatus: EstatusCXC): { variant: BadgeVariant; label: string } => {
    switch (estatus) {
      case 'Cobrado':
        return { variant: 'success', label: 'Cobrado' };
      case 'Facturado':
        return { variant: 'info', label: 'Facturado' };
      case 'Por Facturar':
        return { variant: 'warning', label: 'Por Facturar' };
      case 'Vencido':
        return { variant: 'danger', label: 'Vencido' };
      default:
        return { variant: 'neutral', label: 'Pendiente' };
    }
  };

  const getBadgeEntregable = (estatus: EstatusEntregable): { variant: BadgeVariant; label: string } => {
    switch (estatus) {
      case 'Completado':
        return { variant: 'success', label: 'Completado' };
      case 'En Proceso':
        return { variant: 'info', label: 'En Proceso' };
      case 'Retrasado':
        return { variant: 'danger', label: 'Retrasado' };
      default:
        return { variant: 'warning', label: 'Pendiente Aprobación' };
    }
  };

  const handleExportarOImprimir = (modo: 'pdf' | 'print') => {
    exportarOImprimirResumenProyecto({
      proyecto,
      cliente,
      cuotaActual: cuota,
      cuotasProyecto,
      entregablesProyecto,
      compromisosLiberadosCount: compromisosVinculados.length,
      tasaBCV,
      modo
    });
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
            marginBottom: '20px'
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Resumen de Factura, Cuotas e Hitos del Proyecto
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
              {proyecto?.codigo} {proyecto?.codigoOdoo ? `• Orden Odoo: ${proyecto.codigoOdoo}` : ''} —{' '}
              <strong style={{ color: '#0f172a' }}>{proyecto?.nombre}</strong>
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

        {/* 1. Resumen de la Factura y Cobro Verificado + Información del Cliente */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}
        >
          {/* Datos de Factura en Turno o Verificada */}
          <div
            style={{
              backgroundColor: cuota.estatus === 'Cobrado' ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${cuota.estatus === 'Cobrado' ? '#bbf7d0' : '#cbd5e1'}`,
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: cuota.estatus === 'Cobrado' ? '#166534' : '#0f172a',
                  textTransform: 'uppercase'
                }}
              >
                {cuota.estatus === 'Cobrado'
                  ? esPagoAlContado
                    ? '✓ Pago al Contado Verificado'
                    : '✓ Detalle de Factura Verificada'
                  : esPagoAlContado
                    ? 'Pago Único al Contado (100%)'
                    : `Cuota en Turno (#${cuota.numeroCuota} de ${cuota.totalCuotas})`}
              </span>
              <Badge
                label={cuota.estatus === 'Cobrado' ? 'Cobrado' : cuota.estatus}
                variant={getBadgeEstatusCuota(cuota.estatus).variant}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: '#475569', display: 'block', fontSize: '0.78rem' }}>N° de Factura:</span>
                <strong style={{ color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                  {cuota.numeroFactura || 'Pendiente por emitir'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#475569', display: 'block', fontSize: '0.78rem' }}>Fecha Facturación / Venc.:</span>
                <strong style={{ color: '#0f172a' }}>
                  {formatearFechaVE(cuota.fechaFacturacion || cuota.fechaVencimiento)}
                </strong>
              </div>
              <div>
                <span style={{ color: '#475569', display: 'block', fontSize: '0.78rem' }}>
                  {cuota.estatus === 'Cobrado' ? 'Fecha Cobro Efectivo:' : 'Estatus del Cobro:'}
                </span>
                <strong style={{ color: cuota.estatus === 'Cobrado' ? '#15803d' : '#b45309' }}>
                  {cuota.estatus === 'Cobrado'
                    ? formatearFechaVE(cuota.fechaCobroEfectivo || cuota.fechaVencimiento)
                    : `Por cobrar (${cuota.estatus})`}
                </strong>
              </div>
              <div>
                <span style={{ color: '#475569', display: 'block', fontSize: '0.78rem' }}>Referencia / Comprobante:</span>
                <strong style={{ color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                  {cuota.estatus === 'Cobrado' ? cuota.referenciaCobro || 'REF-VERIFICADA' : 'En espera de abono'}
                </strong>
              </div>
            </div>

            <div
              style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: `1px dashed ${cuota.estatus === 'Cobrado' ? '#86efac' : '#cbd5e1'}`
              }}
            >
              <span style={{ color: '#475569', fontSize: '0.78rem', display: 'block' }}>
                {cuota.estatus === 'Cobrado'
                  ? `Monto Pagado en esta Cuota (#${cuota.numeroCuota} de ${cuota.totalCuotas}):`
                  : `Monto a Cobrar en Cuota en Turno (#${cuota.numeroCuota} de ${cuota.totalCuotas}):`}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: cuota.estatus === 'Cobrado' ? '#15803d' : '#0f172a'
                  }}
                >
                  {fmtMonto(cuota.montoUSD, 'VES')}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.86rem',
                    color: '#475569',
                    fontWeight: 600
                  }}
                >
                  Ref. {fmtMonto(cuota.montoUSD, 'USD')}
                </span>
              </div>
              {cuota.bancoReceptor && (
                <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: '4px', fontWeight: 600 }}>
                  Cuenta Receptora: {cuota.bancoReceptor}
                </div>
              )}
            </div>
          </div>

          {/* Información Importante del Cliente y Proyecto */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Información Importante del Cliente
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Razón Social & RIF:</span>
                <strong style={{ color: '#0f172a' }}>{cliente?.razonSocial}</strong>{' '}
                <span style={{ color: '#475569', fontWeight: 600 }}>({cliente?.rif})</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Contacto Autorizado:</span>
                <strong style={{ color: '#0f172a' }}>{cliente?.contactoNombre}</strong> •{' '}
                <span style={{ color: '#2563eb' }}>{cliente?.contactoEmail}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Responsable PMO:</span>
                  <strong style={{ color: '#0f172a' }}>{proyecto?.responsablePMO}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.78rem', display: 'block' }}>Candado CXP Liberado:</span>
                  <strong style={{ color: '#059669' }}>
                    {compromisosVinculados.length} compromiso(s)
                  </strong>
                </div>
              </div>
              {cuota.comentarios && (
                <div
                  style={{
                    marginTop: '4px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '0.80rem',
                    color: '#334155'
                  }}
                >
                  <strong>Observación:</strong> {cuota.comentarios}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Progreso General de Pago del Proyecto */}
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
                Estado General de Recaudación del Proyecto
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '8px' }}>
                ({cuotasCobradasCount} de {cuotasProyecto.length} {cuotasProyecto.length === 1 ? 'pago al contado' : 'cuotas pagadas'})
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

          {/* Barra de progreso visual */}
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

          {/* Totales del contrato */}
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
                Total Contrato
              </span>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.02rem', color: '#0f172a' }}>
                {fmtMonto(montoTotalProyectoUSD, 'VES')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                Ref. {fmtMonto(montoTotalProyectoUSD, 'USD')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Pagado / Cobrado
              </span>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.02rem', color: '#059669' }}>
                {fmtMonto(montoCobradoProyectoUSD, 'VES')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#047857', fontWeight: 600 }}>
                Ref. {fmtMonto(montoCobradoProyectoUSD, 'USD')}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.76rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase' }}>
                Por Entrar desde Odoo (Faltante)
              </span>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.02rem', color: '#d97706' }}>
                {fmtMonto(montoPendienteProyectoUSD, 'VES')}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#b45309', fontWeight: 600 }}>
                Ref. {fmtMonto(montoPendienteProyectoUSD, 'USD')}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Desglose de Cuotas e Hitos Vinculados */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
            Desglose de Cuotas Pagadas e Hitos PMO del Proyecto
          </h4>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Cuota / Factura</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Hito PMO & Avance</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Monto Cuota</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {cuotasProyecto.map((c) => {
                  const hito = entregablesProyecto.find((e) => e.id === c.entregableId);
                  const esCuotaActual = c.id === cuota.id;
                  const badgeCuota = getBadgeEstatusCuota(c.estatus);
                  const badgeHito = hito ? getBadgeEntregable(hito.estatus) : null;
                  const pctCuota =
                    montoTotalProyectoUSD > 0
                      ? Math.round((c.montoUSD / montoTotalProyectoUSD) * 100)
                      : 100;

                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: esCuotaActual ? '#f0fdf4' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>
                            {c.totalCuotas === 1
                              ? 'Pago al Contado (1/1)'
                              : `Cuota #${c.numeroCuota} de ${c.totalCuotas}`}
                          </span>
                          <span
                            style={{
                              fontSize: '0.73rem',
                              fontWeight: 800,
                              color: '#0369a1',
                              backgroundColor: '#e0f2fe',
                              padding: '1px 7px',
                              borderRadius: '999px',
                              fontFamily: "'JetBrains Mono', monospace"
                            }}
                          >
                            {pctCuota}%
                          </span>
                          {esCuotaActual && !proyectoCompletamentePagado && (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                backgroundColor: '#166534',
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              Actual
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>{c.descripcion}</div>
                        <div style={{ fontSize: '0.76rem', color: '#2563eb', fontWeight: 600, marginTop: '2px' }}>
                          {c.numeroFactura ? `N° ${c.numeroFactura}` : 'Sin factura emitida'} • Vence: {formatearFechaVE(c.fechaVencimiento)}
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        {hito ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>
                              {hito.codigoHito}: {hito.descripcion}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              {badgeHito && <Badge label={badgeHito.label} variant={badgeHito.variant} />}
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>
                                Avance: {hito.porcentajeAvance}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>Hito no asignado</span>
                        )}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0f172a' }}>
                          {fmtMonto(c.montoUSD, 'VES')}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                          Ref. {fmtMonto(c.montoUSD, 'USD')}
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <Badge label={badgeCuota.label} variant={badgeCuota.variant} />
                        {c.estatus === 'Cobrado' && c.fechaCobroEfectivo && (
                          <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                            Pagado: {formatearFechaVE(c.fechaCobroEfectivo)}
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

        {/* Pie del Modal con opciones para Guardar en PDF, Imprimir y Cerrar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            paddingTop: '14px',
            borderTop: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleExportarOImprimir('pdf')}
              title="Generar documento con membrete TCS listo para Guardar como PDF"
              style={{
                borderColor: '#0284c7',
                color: '#0369a1',
                backgroundColor: '#f0f9ff'
              }}
            >
              Guardar en PDF
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => handleExportarOImprimir('print')}
              title="Enviar resumen directamente a la impresora"
            >
              Imprimir Resumen
            </Button>
          </div>

          <Button variant="primary" size="md" onClick={onClose}>
            Cerrar Resumen
          </Button>
        </div>
      </div>
    </div>
  );
};
