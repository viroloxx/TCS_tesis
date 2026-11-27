import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { HoverEyeTrigger } from '../common/HoverEyeTrigger';
import { formatearMonedaVE, enmascararMonto } from '../../utils/formatters';

type VistaProyectos =
  | 'mayor_mora'
  | 'mas_abonados'
  | 'menos_abonados'
  | 'mayor_saldo_pendiente'
  | 'mayor_valor_contrato'
  | 'solo_en_mora'
  | 'solo_pendientes'
  | 'solo_completos';

const PROYECTOS_POR_PAGINA = 5;

export const DashboardCharts: React.FC = () => {
  const { cuotasCXC, compromisosCXP, proyectos, clientes, tasaBCV } = useData();
  const [mostrarBalance, setMostrarBalance] = useState<boolean>(false);
  const [mostrarProyectos, setMostrarProyectos] = useState<boolean>(false);
  const [vistaProyectos, setVistaProyectos] = useState<VistaProyectos>('mayor_mora');
  const [paginaProyectos, setPaginaProyectos] = useState<number>(1);

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
  const resumenPorProyecto = useMemo(() => {
    const hoyMs = Date.now();
    return proyectos.map((prj) => {
      const cliente = clientes.find((cli) => cli.id === prj.clienteId);
      const cuotasPrj = cuotasCXC.filter((c) => c.proyectoId === prj.id);
      const totalPrjUSD = cuotasPrj.reduce((acc, c) => acc + c.montoUSD, 0);
      const cobradoPrjUSD = cuotasPrj
        .filter((c) => c.estatus === 'Cobrado')
        .reduce((acc, c) => acc + c.montoUSD, 0);
      const faltaPrjUSD = Math.max(0, totalPrjUSD - cobradoPrjUSD);
      const porcentajeCobrado = totalPrjUSD > 0 ? Math.round((cobradoPrjUSD / totalPrjUSD) * 100) : 0;

      const cuotasVencidas = cuotasPrj.filter((c) => c.estatus === 'Vencido');
      const tieneVencido = cuotasVencidas.length > 0;
      const montoVencidoUSD = cuotasVencidas.reduce((acc, c) => acc + c.montoUSD, 0);
      const diasMoraMax = cuotasVencidas.reduce((maxDias, c) => {
        const vencMs = new Date(`${c.fechaVencimiento}T00:00:00`).getTime();
        const dias = isNaN(vencMs) ? 0 : Math.max(1, Math.floor((hoyMs - vencMs) / (1000 * 60 * 60 * 24)));
        return Math.max(maxDias, dias);
      }, 0);

      const cuotasPagadas = cuotasPrj.filter((c) => c.estatus === 'Cobrado').length;
      const estaCompleto = cuotasPrj.length > 0 && cuotasPagadas === cuotasPrj.length;

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
        montoVencidoUSD,
        diasMoraMax,
        estaCompleto,
        cuotasTotales: cuotasPrj.length,
        cuotasPagadas
      };
    });
  }, [proyectos, clientes, cuotasCXC]);

  const proyectosFiltradosYOrdenados = useMemo(() => {
    const lista = [...resumenPorProyecto];

    switch (vistaProyectos) {
      case 'mas_abonados':
        return lista.sort(
          (a, b) => b.porcentajeCobrado - a.porcentajeCobrado || b.cobradoPrjUSD - a.cobradoPrjUSD
        );
      case 'menos_abonados':
        return lista.sort(
          (a, b) => a.porcentajeCobrado - b.porcentajeCobrado || b.faltaPrjUSD - a.faltaPrjUSD
        );
      case 'mayor_mora':
        return lista.sort(
          (a, b) =>
            Number(b.tieneVencido) - Number(a.tieneVencido) ||
            b.montoVencidoUSD - a.montoVencidoUSD ||
            b.diasMoraMax - a.diasMoraMax ||
            b.faltaPrjUSD - a.faltaPrjUSD
        );
      case 'mayor_saldo_pendiente':
        return lista.sort((a, b) => b.faltaPrjUSD - a.faltaPrjUSD);
      case 'mayor_valor_contrato':
        return lista.sort((a, b) => b.totalPrjUSD - a.totalPrjUSD);
      case 'solo_en_mora':
        return lista
          .filter((item) => item.tieneVencido)
          .sort((a, b) => b.montoVencidoUSD - a.montoVencidoUSD || b.diasMoraMax - a.diasMoraMax);
      case 'solo_pendientes':
        return lista
          .filter((item) => !item.estaCompleto)
          .sort((a, b) => b.faltaPrjUSD - a.faltaPrjUSD);
      case 'solo_completos':
        return lista
          .filter((item) => item.estaCompleto)
          .sort((a, b) => b.totalPrjUSD - a.totalPrjUSD);
      default:
        return lista;
    }
  }, [resumenPorProyecto, vistaProyectos]);

  const totalProyectosVista = proyectosFiltradosYOrdenados.length;
  const totalPaginasProyectos = Math.max(1, Math.ceil(totalProyectosVista / PROYECTOS_POR_PAGINA));
  const paginaProyectosSegura = Math.min(paginaProyectos, totalPaginasProyectos);
  const inicioProyectos = (paginaProyectosSegura - 1) * PROYECTOS_POR_PAGINA;
  const finProyectos = Math.min(inicioProyectos + PROYECTOS_POR_PAGINA, totalProyectosVista);
  const proyectosVisibles = proyectosFiltradosYOrdenados.slice(inicioProyectos, finProyectos);

  const handleCambioVistaProyectos = (nuevaVista: VistaProyectos) => {
    setVistaProyectos(nuevaVista);
    setPaginaProyectos(1);
  };

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
                  Cobros de Clientes
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
                  ● Falta
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
                  Pagos a Terceros y Proveedores
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <HoverEyeTrigger
              active={mostrarProyectos}
              onHoverChange={setMostrarProyectos}
              label="Ver montos"
              mode="click"
            />
            <Badge label={`${totalProyectosVista} de ${resumenPorProyecto.length} Proyectos`} variant="neutral" />
          </div>
        }
        style={{ marginBottom: 0 }}
      >
        {/* Barra de controles: Ordenamiento / Filtro (vista fija de 5 proyectos por página) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#334155' }}>
              Ver por:
            </span>
            <select
              value={vistaProyectos}
              onChange={(e) => handleCambioVistaProyectos(e.target.value as VistaProyectos)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.86rem',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="mayor_mora">Mayor mora primero</option>
              <option value="mas_abonados">Más abonados a menos abonados</option>
              <option value="menos_abonados">Menos abonados a más abonados</option>
              <option value="mayor_saldo_pendiente">Mayor saldo faltante por cobrar</option>
              <option value="mayor_valor_contrato">Mayor monto total de contrato</option>
              <option value="solo_en_mora">Solo proyectos en mora (Vencidos)</option>
              <option value="solo_pendientes">Solo pendientes por cobrar</option>
              <option value="solo_completos">Solo completos (100% Cobrados)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {proyectosVisibles.length === 0 ? (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '28px 20px',
                textAlign: 'center',
                color: '#475569'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#0f172a', marginBottom: '6px' }}>
                No hay proyectos que coincidan con esta vista
              </div>
              <div style={{ fontSize: '0.86rem', marginBottom: '12px' }}>
                Seleccione otra opción en <strong>&ldquo;Ver por&rdquo;</strong> para consultar el resto de proyectos activos.
              </div>
              <button
                type="button"
                onClick={() => handleCambioVistaProyectos('mayor_mora')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid #0284c7',
                  backgroundColor: '#f0f9ff',
                  color: '#0369a1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Ver todos los proyectos
              </button>
            </div>
          ) : (
            proyectosVisibles.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: item.tieneVencido ? '#fffbfb' : item.estaCompleto ? '#f0fdf4' : '#f8fafc',
                  border: `1.5px solid ${item.tieneVencido ? '#fecaca' : item.estaCompleto ? '#bbf7d0' : '#e2e8f0'}`,
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
                    gap: '10px',
                    flexWrap: 'wrap'
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                    {item.tieneVencido && (
                      <Badge label="Cuota Vencida" variant="danger" size="sm" />
                    )}
                    {item.estaCompleto && (
                      <Badge label="✓ Completo" variant="success" size="sm" />
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
            ))
          )}
        </div>

        {/* Barra de Paginación Inferior (de 5 en 5) */}
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 500 }}>
            Mostrando{' '}
            <strong style={{ color: '#0f172a' }}>
              {totalProyectosVista === 0 ? 0 : inicioProyectos + 1} - {finProyectos}
            </strong>{' '}
            de <strong style={{ color: '#0f172a' }}>{totalProyectosVista}</strong> proyectos
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setPaginaProyectos((prev) => Math.max(1, prev - 1))}
              disabled={paginaProyectosSegura <= 1}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: paginaProyectosSegura <= 1 ? '#f1f5f9' : '#ffffff',
                color: paginaProyectosSegura <= 1 ? '#94a3b8' : '#0f172a',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: paginaProyectosSegura <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ◀ Anterior
            </button>

            {Array.from({ length: totalPaginasProyectos }, (_, idx) => idx + 1).map((numPag) => {
              const activa = numPag === paginaProyectosSegura;
              return (
                <button
                  key={numPag}
                  type="button"
                  onClick={() => setPaginaProyectos(numPag)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: activa ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                    backgroundColor: activa ? '#0f172a' : '#ffffff',
                    color: activa ? '#ffffff' : '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer'
                  }}
                >
                  {numPag}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPaginaProyectos((prev) => Math.min(totalPaginasProyectos, prev + 1))}
              disabled={paginaProyectosSegura >= totalPaginasProyectos}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: paginaProyectosSegura >= totalPaginasProyectos ? '#f1f5f9' : '#ffffff',
                color: paginaProyectosSegura >= totalPaginasProyectos ? '#94a3b8' : '#0f172a',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: paginaProyectosSegura >= totalPaginasProyectos ? 'not-allowed' : 'pointer'
              }}
            >
              Siguiente ▶
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
