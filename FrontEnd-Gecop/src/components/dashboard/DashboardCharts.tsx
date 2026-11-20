import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { HoverEyeTrigger } from '../common/HoverEyeTrigger';
import { formatearMonedaVE, enmascararMonto } from '../../utils/formatters';

export const DashboardCharts: React.FC = () => {
  const { cuotasCXC, compromisosCXP, proyectos, clientes, tasaBCV } = useData();
  const [mostrarBalance, setMostrarBalance] = useState<boolean>(false);
  const [mostrarProyectos, setMostrarProyectos] = useState<boolean>(false);

  const fmtMonto = (montoUSD: number, moneda: 'VES' | 'USD', revelar: boolean): string => {
    const valor = moneda === 'VES' ? montoUSD * tasaBCV : montoUSD;
    return enmascararMonto(formatearMonedaVE(valor, moneda), !revelar);
  };

  // ================= 1. CÁLCULOS DE RECAUDACIÓN (CXC): COBRADO VS LO QUE FALTA =================
  const cxcCobradoUSD = cuotasCXC
    .filter((c) => c.estatus === 'Cobrado')
    .reduce((acc, c) => acc + c.montoUSD, 0);

  const cxcFacturadoPorCobrarUSD = cuotasCXC
    .filter((c) => c.estatus === 'Facturado' || c.estatus === 'Por Facturar' || c.estatus === 'Pendiente')
    .reduce((acc, c) => acc + c.montoUSD, 0);

  const cxcVencidoUSD = cuotasCXC
    .filter((c) => c.estatus === 'Vencido')
    .reduce((acc, c) => acc + c.montoUSD, 0);

  const cxcFaltaTotalUSD = cxcFacturadoPorCobrarUSD + cxcVencidoUSD;
  const cxcMetaTotalUSD = cxcCobradoUSD + cxcFaltaTotalUSD;

  const pctCxcCobrado = cxcMetaTotalUSD > 0 ? Math.round((cxcCobradoUSD / cxcMetaTotalUSD) * 100) : 0;
  const pctCxcPorCobrar = cxcMetaTotalUSD > 0 ? Math.round((cxcFacturadoPorCobrarUSD / cxcMetaTotalUSD) * 100) : 0;
  const pctCxcVencido = Math.max(0, 100 - pctCxcCobrado - pctCxcPorCobrar);

  // ================= 2. CÁLCULOS DE DESEMBOLSOS (CXP): PAGADO VS LO QUE FALTA =================
  const cxpPagadoUSD = compromisosCXP
    .filter((c) => c.estatus === 'Pagado')
    .reduce((acc, c) => acc + c.montoUSD, 0);

  const cxpLiberadoPorPagarUSD = compromisosCXP
    .filter((c) => c.estatus === 'Por Pagar')
    .reduce((acc, c) => acc + c.montoUSD, 0);

  const cxpBloqueadoUSD = compromisosCXP
    .filter((c) => c.estatus === 'Bloqueado por Cobro')
    .reduce((acc, c) => acc + c.montoUSD, 0);

  const cxpFaltaTotalUSD = cxpLiberadoPorPagarUSD + cxpBloqueadoUSD;
  const cxpMetaTotalUSD = cxpPagadoUSD + cxpFaltaTotalUSD;

  const pctCxpPagado = cxpMetaTotalUSD > 0 ? Math.round((cxpPagadoUSD / cxpMetaTotalUSD) * 100) : 0;
  const pctCxpLiberado = cxpMetaTotalUSD > 0 ? Math.round((cxpLiberadoPorPagarUSD / cxpMetaTotalUSD) * 100) : 0;
  const pctCxpBloqueado = Math.max(0, 100 - pctCxpPagado - pctCxpLiberado);

  // ================= 3. CÁLCULOS POR PROYECTO (GRÁFICO 2) =================
  const resumenPorProyecto = proyectos.map((prj) => {
    const cliente = clientes.find((cli) => cli.id === prj.clienteId);
    const cuotasPrj = cuotasCXC.filter((c) => c.proyectoId === prj.id);
    const totalPrjUSD = cuotasPrj.reduce((acc, c) => acc + c.montoUSD, 0);
    const cobradoPrjUSD = cuotasPrj
      .filter((c) => c.estatus === 'Cobrado')
      .reduce((acc, c) => acc + c.montoUSD, 0);
    const faltaPrjUSD = Math.max(0, totalPrjUSD - cobradoPrjUSD);
    const porcentajeCobrado = totalPrjUSD > 0 ? Math.round((cobradoPrjUSD / totalPrjUSD) * 100) : 0;
    const tieneVencido = cuotasPrj.some((c) => c.estatus === 'Vencido');

    return {
      id: prj.id,
      codigo: prj.codigo,
      nombre: prj.nombre,
      clienteNombre: cliente?.razonSocial || 'Cliente Corporativo',
      totalPrjUSD,
      cobradoPrjUSD,
      faltaPrjUSD,
      porcentajeCobrado,
      tieneVencido,
      cuotasTotales: cuotasPrj.length,
      cuotasPagadas: cuotasPrj.filter((c) => c.estatus === 'Cobrado').length
    };
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}
    >
      {/* ================= GRÁFICO: TERMÓMETRO DE PAGOS Y SALDOS FALTANTES ================= */}
      <Card
        title="Balance General: Lo Pagado vs. Lo que Falta"
        subtitle="Lectura directa del avance real de cobros a clientes y pagos a proveedores"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HoverEyeTrigger
              active={mostrarBalance}
              onHoverChange={setMostrarBalance}
              label="Ver montos"
            />
            <Badge label="Lectura Directa" variant="info" />
          </div>
        }
        style={{ marginBottom: 0 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* BLOQUE: COBROS A CLIENTES (CXC) */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Cobros de Clientes (CXC)
                </div>
                <div style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                  Total Contratado: <strong>{fmtMonto(cxcMetaTotalUSD, 'VES', mostrarBalance)}</strong>{' '}
                  <span style={{ color: '#64748b' }}>(Ref. {fmtMonto(cxcMetaTotalUSD, 'USD', mostrarBalance)})</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxcCobrado}% Cobrado
                </span>
              </div>
            </div>

            {/* Barra apilada de 3 segmentos con alto contraste */}
            <div
              style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid #cbd5e1',
                marginBottom: '14px'
              }}
            >
              {pctCxcCobrado > 0 && (
                <div
                  style={{
                    width: `${pctCxcCobrado}%`,
                    backgroundColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxcCobrado >= 12 ? `${pctCxcCobrado}%` : ''}
                </div>
              )}
              {pctCxcPorCobrar > 0 && (
                <div
                  style={{
                    width: `${pctCxcPorCobrar}%`,
                    backgroundColor: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxcPorCobrar >= 12 ? `${pctCxcPorCobrar}%` : ''}
                </div>
              )}
              {pctCxcVencido > 0 && (
                <div
                  style={{
                    width: `${pctCxcVencido}%`,
                    backgroundColor: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxcVencido >= 12 ? `${pctCxcVencido}%` : ''}
                </div>
              )}
            </div>

            {/* Tarjetas de lectura clara: Ya Cobrado vs Lo que Falta (Bolívares primero, USD abajo) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
                  ● Ya Cobrado
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#059669', marginTop: '2px' }}>
                  {fmtMonto(cxcCobradoUSD, 'VES', mostrarBalance)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                  Ref. {fmtMonto(cxcCobradoUSD, 'USD', mostrarBalance)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>
                  ● Falta (En Fecha)
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#2563eb', marginTop: '2px' }}>
                  {fmtMonto(cxcFacturadoPorCobrarUSD, 'VES', mostrarBalance)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600 }}>
                  Ref. {fmtMonto(cxcFacturadoPorCobrarUSD, 'USD', mostrarBalance)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
                  ● Falta (Vencido)
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#dc2626', marginTop: '2px' }}>
                  {fmtMonto(cxcVencidoUSD, 'VES', mostrarBalance)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600 }}>
                  Ref. {fmtMonto(cxcVencidoUSD, 'USD', mostrarBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE: PAGOS A PROVEEDORES Y COMISIONES (CXP) */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  Pagos a Terceros y Proveedores (CXP)
                </div>
                <div style={{ fontSize: '0.86rem', color: '#475569', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                  Total Comprometido: <strong>{fmtMonto(cxpMetaTotalUSD, 'VES', mostrarBalance)}</strong>{' '}
                  <span style={{ color: '#64748b' }}>(Ref. {fmtMonto(cxpMetaTotalUSD, 'USD', mostrarBalance)})</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxpPagado}% Pagado
                </span>
              </div>
            </div>

            {/* Barra apilada CXP */}
            <div
              style={{
                width: '100%',
                height: '24px',
                backgroundColor: '#e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                border: '1px solid #cbd5e1',
                marginBottom: '14px'
              }}
            >
              {pctCxpPagado > 0 && (
                <div
                  style={{
                    width: `${pctCxpPagado}%`,
                    backgroundColor: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxpPagado >= 12 ? `${pctCxpPagado}%` : ''}
                </div>
              )}
              {pctCxpLiberado > 0 && (
                <div
                  style={{
                    width: `${pctCxpLiberado}%`,
                    backgroundColor: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxpLiberado >= 12 ? `${pctCxpLiberado}%` : ''}
                </div>
              )}
              {pctCxpBloqueado > 0 && (
                <div
                  style={{
                    width: `${pctCxpBloqueado}%`,
                    backgroundColor: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace"
                  }}
                >
                  {pctCxpBloqueado >= 12 ? `${pctCxpBloqueado}%` : ''}
                </div>
              )}
            </div>

            {/* Tarjetas de lectura clara CXP (Bolívares primero, USD abajo) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div
                style={{
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>
                  ● Ya Pagado
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#059669', marginTop: '2px' }}>
                  {fmtMonto(cxpPagadoUSD, 'VES', mostrarBalance)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                  Ref. {fmtMonto(cxpPagadoUSD, 'USD', mostrarBalance)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                  ● Falta (Liberado)
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#d97706', marginTop: '2px' }}>
                  {fmtMonto(cxpLiberadoPorPagarUSD, 'VES', mostrarBalance)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#b45309', fontWeight: 600 }}>
                  Ref. {fmtMonto(cxpLiberadoPorPagarUSD, 'USD', mostrarBalance)}
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '10px'
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>
                  ● Falta (Bloqueado)
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1rem', color: '#dc2626', marginTop: '2px' }}>
                  {fmtMonto(cxpBloqueadoUSD, 'VES', mostrarBalance)}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600 }}>
                  Ref. {fmtMonto(cxpBloqueadoUSD, 'USD', mostrarBalance)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ================= GRÁFICO: AVANCE Y SALDO FALTANTE POR PROYECTO ================= */}
      <Card
        title="Cuánto se ha Pagado y Cuánto Falta por Proyecto"
        subtitle="Comparativa visual por cliente para identificar de inmediato dónde falta cobrar"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HoverEyeTrigger
              active={mostrarProyectos}
              onHoverChange={setMostrarProyectos}
              label="Ver montos"
            />
            <Badge label={`${resumenPorProyecto.length} Proyectos Activos`} variant="neutral" />
          </div>
        }
        style={{ marginBottom: 0 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resumenPorProyecto.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: item.tieneVencido ? '#fffbfb' : '#f8fafc',
                border: `1.5px solid ${item.tieneVencido ? '#fecaca' : '#e2e8f0'}`,
                borderRadius: '12px',
                padding: '16px'
              }}
            >
              {/* Encabezado del proyecto */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                    {item.nombre}
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                    {item.clienteNombre} • <span style={{ color: '#64748b' }}>{item.codigo}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {item.tieneVencido && (
                    <Badge label="Cuota Vencida" variant="danger" size="sm" />
                  )}
                  <span
                    style={{
                      backgroundColor: item.porcentajeCobrado >= 50 ? '#ecfdf5' : '#fffbeb',
                      border: `1px solid ${item.porcentajeCobrado >= 50 ? '#a7f3d0' : '#fde68a'}`,
                      color: item.porcentajeCobrado >= 50 ? '#065f46' : '#92400e',
                      fontWeight: 800,
                      fontSize: '0.86rem',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      fontFamily: "'JetBrains Mono', monospace"
                    }}
                  >
                    {item.cuotasPagadas}/{item.cuotasTotales} cuotas ({item.porcentajeCobrado}%)
                  </span>
                </div>
              </div>

              {/* Barra comparativa: Verde (Pagado) vs Gris/Rojo (Lo que falta) */}
              <div
                style={{
                  width: '100%',
                  height: '18px',
                  backgroundColor: item.tieneVencido ? '#fee2e2' : '#e2e8f0',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  display: 'flex',
                  border: '1px solid #cbd5e1',
                  marginBottom: '12px'
                }}
              >
                <div
                  style={{
                    width: `${item.porcentajeCobrado}%`,
                    height: '100%',
                    backgroundColor: '#059669',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              {/* Cifras lado a lado para lectura inmediata (Bolívares primero, USD abajo) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  fontSize: '0.86rem',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    Total Proyecto
                  </span>
                  <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#0f172a', fontSize: '0.96rem', display: 'block' }}>
                    {fmtMonto(item.totalPrjUSD, 'VES', mostrarProyectos)}
                  </strong>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>
                    Ref. {fmtMonto(item.totalPrjUSD, 'USD', mostrarProyectos)}
                  </span>
                </div>

                <div>
                  <span style={{ color: '#059669', fontSize: '0.76rem', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                    ✓ Ya Pagado
                  </span>
                  <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#059669', fontSize: '0.96rem', display: 'block' }}>
                    {fmtMonto(item.cobradoPrjUSD, 'VES', mostrarProyectos)}
                  </strong>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#047857', fontSize: '0.78rem', fontWeight: 600 }}>
                    Ref. {fmtMonto(item.cobradoPrjUSD, 'USD', mostrarProyectos)}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      color: item.tieneVencido ? '#dc2626' : '#d97706',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      display: 'block',
                      textTransform: 'uppercase'
                    }}
                  >
                    • Falta por Cobrar
                  </span>
                  <strong
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: item.tieneVencido ? '#dc2626' : '#d97706',
                      fontSize: '0.96rem',
                      display: 'block'
                    }}
                  >
                    {fmtMonto(item.faltaPrjUSD, 'VES', mostrarProyectos)}
                  </strong>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      color: item.tieneVencido ? '#b91c1c' : '#b45309',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    Ref. {fmtMonto(item.faltaPrjUSD, 'USD', mostrarProyectos)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
