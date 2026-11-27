import React, { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { HoverEyeTrigger } from '../common/HoverEyeTrigger';
import { formatearFechaVE, formatearMonedaVE, enmascararMonto } from '../../utils/formatters';

interface MovimientoCaja {
  id: string;
  mesKey: string;
  mesLabel: string;
  fecha: string;
  tipo: 'ENTRADA_CXC' | 'SALIDA_CXP';
  proyectoCodigo: string;
  proyectoNombre: string;
  contraparte: string;
  detalle: string;
  montoUSD: number;
  estatus: string;
}

interface MesProyeccionCaja {
  mesKey: string;
  mesLabel: string;
  etiquetaPosicion: string;
  esMesActual: boolean;
  capitalInicialUSD: number;
  entradasPendientesUSD: number;
  salidasPendientesUSD: number;
  flujoNetoMesUSD: number;
  capitalFinalUSD: number;
  cantidadMovimientos: number;
}

const ETIQUETAS_POSICION_MES = [
  'Mes Actual',
  'Mes Siguiente',
  'Mes Subsiguiente',
  '4to Mes'
];

const NOMBRES_MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

export const FlujoCajaView: React.FC = () => {
  const { cuotasCXC, compromisosCXP, proyectos, clientes, tasaBCV } = useData();
  const [mostrarMontos, setMostrarMontos] = useState<boolean>(false);
  const [horizonteMeses, setHorizonteMeses] = useState<1 | 2 | 3 | 4>(3);
  const [filtroMesKey, setFiltroMesKey] = useState<string>('TODOS');

  const fmtMonto = (montoUSD: number, moneda: 'VES' | 'USD'): string => {
    const val = moneda === 'VES' ? montoUSD * tasaBCV : montoUSD;
    return enmascararMonto(formatearMonedaVE(val, moneda), !mostrarMontos);
  };

  const handleCambioHorizonte = (nuevoHorizonte: 1 | 2 | 3 | 4) => {
    setHorizonteMeses(nuevoHorizonte);
    setFiltroMesKey('TODOS');
  };

  // Opciones dinámicas de la barra seleccionadora desde el mes actual hacia adelante (tope: 4 meses)
  const opcionesBarraMeses = useMemo(() => {
    const hoy = new Date();
    const baseYear = hoy.getFullYear();
    const baseMonth = hoy.getMonth();

    const mesInicioNombre = NOMBRES_MESES_ES[baseMonth];

    return ([1, 2, 3, 4] as const).map((cantidad) => {
      const fechaFin = new Date(baseYear, baseMonth + cantidad - 1, 1);
      const finMesNombre = NOMBRES_MESES_ES[fechaFin.getMonth()];
      const finYear = fechaFin.getFullYear();

      if (cantidad === 1) {
        return {
          valor: cantidad,
          label: `${mesInicioNombre} ${baseYear} (Mes actual)`
        };
      }

      const rangoTexto =
        finYear === baseYear
          ? `${mesInicioNombre} – ${finMesNombre} ${finYear}`
          : `${mesInicioNombre} ${baseYear} – ${finMesNombre} ${finYear}`;

      return {
        valor: cantidad,
        label:
          cantidad === 4
            ? `${rangoTexto} (Tope: 4 meses)`
            : `${rangoTexto} (${cantidad} meses)`
      };
    });
  }, []);

  // 1. Capital real actual en caja proveniente EXCLUSIVAMENTE de proyectos activos (Cobrado CXC - Pagado CXP)
  const {
    capitalActualProyectosUSD,
    totalCobradoProyectosUSD,
    totalPagadoProyectosUSD,
    montoMoraTotalUSD,
    cantidadCuotasMora,
    mesesProyectados,
    movimientosProyectados
  } = useMemo(() => {
    const cobradoReal = cuotasCXC
      .filter((c) => c.estatus === 'Cobrado')
      .reduce((acc, c) => acc + c.montoUSD, 0);

    const pagadoReal = compromisosCXP
      .filter((c) => c.estatus === 'Pagado')
      .reduce((acc, c) => acc + c.montoUSD, 0);

    const capitalBase = Number((cobradoReal - pagadoReal).toFixed(2));

    // Generar los meses consecutivos a partir del mes actual según el horizonte elegido (1 a 4 meses)
    const hoy = new Date();
    const baseYear = hoy.getFullYear();
    const baseMonth = hoy.getMonth();

    const horizonteDinamico = Array.from({ length: horizonteMeses }, (_, offset) => {
      const fechaMes = new Date(baseYear, baseMonth + offset, 1);
      const y = fechaMes.getFullYear();
      const m = fechaMes.getMonth();
      const mesKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const mesLabel = `${NOMBRES_MESES_ES[m]} ${y}`;
      return {
        mesKey,
        mesLabel,
        etiquetaPosicion: ETIQUETAS_POSICION_MES[offset] || `Mes +${offset}`,
        esMesActual: offset === 0
      };
    });

    const setMeses = new Set(horizonteDinamico.map((m) => m.mesKey));

    // Cuotas en mora / atraso (para recordatorio concreto en Bolívares)
    const cuotasEnMora = cuotasCXC.filter((c) => c.estatus === 'Vencido');
    const totalMoraUSD = cuotasEnMora.reduce((acc, c) => acc + c.montoUSD, 0);

    // Recopilar movimientos proyectados (pendientes por cobrar y pendientes por pagar) dentro del horizonte
    const listaMovimientos: MovimientoCaja[] = [];

    cuotasCXC.forEach((cuota) => {
      if (cuota.estatus === 'Cobrado') return;
      const mesKey = cuota.fechaVencimiento.substring(0, 7);
      if (!setMeses.has(mesKey)) return;

      const prj = proyectos.find((p) => p.id === cuota.proyectoId);
      const cli = clientes.find((c) => c.id === prj?.clienteId);
      const mesObj = horizonteDinamico.find((m) => m.mesKey === mesKey);

      listaMovimientos.push({
        id: `cxc-${cuota.id}`,
        mesKey,
        mesLabel: mesObj?.mesLabel || mesKey,
        fecha: cuota.fechaVencimiento,
        tipo: 'ENTRADA_CXC',
        proyectoCodigo: prj?.codigo || 'PRJ',
        proyectoNombre: prj?.nombre || 'Proyecto Odoo',
        contraparte: cli?.razonSocial || 'Cliente Corporativo',
        detalle:
          cuota.totalCuotas === 1
            ? 'Pago Único al Contado'
            : `Cuota ${cuota.numeroCuota} de ${cuota.totalCuotas}${cuota.numeroFactura ? ` • ${cuota.numeroFactura}` : ''}`,
        montoUSD: cuota.montoUSD,
        estatus: cuota.estatus
      });
    });

    compromisosCXP.forEach((comp) => {
      if (comp.estatus === 'Pagado') return;
      const mesKey = comp.fechaVencimientoCalculada.substring(0, 7);
      if (!setMeses.has(mesKey)) return;

      const prj = proyectos.find((p) => p.id === comp.proyectoId);
      const mesObj = horizonteDinamico.find((m) => m.mesKey === mesKey);

      listaMovimientos.push({
        id: `cxp-${comp.id}`,
        mesKey,
        mesLabel: mesObj?.mesLabel || mesKey,
        fecha: comp.fechaVencimientoCalculada,
        tipo: 'SALIDA_CXP',
        proyectoCodigo: prj?.codigo || 'PRJ',
        proyectoNombre: prj?.nombre || 'Proyecto Odoo',
        contraparte: comp.proveedor,
        detalle: comp.concepto,
        montoUSD: comp.montoUSD,
        estatus: comp.estatus
      });
    });

    listaMovimientos.sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Calcular proyección acumulada mes a mes
    let capitalCorriente = capitalBase;
    const mesesCalculados: MesProyeccionCaja[] = horizonteDinamico.map(
      ({ mesKey, mesLabel, etiquetaPosicion, esMesActual }) => {
        const movsMes = listaMovimientos.filter((m) => m.mesKey === mesKey);
        const entradas = movsMes
          .filter((m) => m.tipo === 'ENTRADA_CXC')
          .reduce((acc, m) => acc + m.montoUSD, 0);
        const salidas = movsMes
          .filter((m) => m.tipo === 'SALIDA_CXP')
          .reduce((acc, m) => acc + m.montoUSD, 0);
        const flujoNeto = Number((entradas - salidas).toFixed(2));
        const capitalInicial = capitalCorriente;
        const capitalFinal = Number((capitalInicial + flujoNeto).toFixed(2));
        capitalCorriente = capitalFinal;

        return {
          mesKey,
          mesLabel,
          etiquetaPosicion,
          esMesActual,
          capitalInicialUSD: capitalInicial,
          entradasPendientesUSD: entradas,
          salidasPendientesUSD: salidas,
          flujoNetoMesUSD: flujoNeto,
          capitalFinalUSD: capitalFinal,
          cantidadMovimientos: movsMes.length
        };
      }
    );

    return {
      capitalActualProyectosUSD: capitalBase,
      totalCobradoProyectosUSD: cobradoReal,
      totalPagadoProyectosUSD: pagadoReal,
      montoMoraTotalUSD: totalMoraUSD,
      cantidadCuotasMora: cuotasEnMora.length,
      mesesProyectados: mesesCalculados,
      movimientosProyectados: listaMovimientos
    };
  }, [cuotasCXC, compromisosCXP, proyectos, clientes, horizonteMeses]);

  const flujoNeto3MesesUSD = mesesProyectados.reduce((acc, m) => acc + m.flujoNetoMesUSD, 0);
  const capitalFinal3MesesUSD =
    mesesProyectados.length > 0
      ? mesesProyectados[mesesProyectados.length - 1].capitalFinalUSD
      : capitalActualProyectosUSD;

  // Escala máxima para el gráfico de barras agrupadas
  const maxValorGraficoUSD = Math.max(
    1,
    ...mesesProyectados.flatMap((m) => [
      m.entradasPendientesUSD,
      m.salidasPendientesUSD,
      Math.max(0, m.capitalFinalUSD)
    ])
  );

  const movimientosFiltrados =
    filtroMesKey === 'TODOS'
      ? movimientosProyectados
      : movimientosProyectados.filter((m) => m.mesKey === filtroMesKey);

  return (
    <div>
      {/* Encabezado Principal: Flujo de Caja */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '22px'
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>
            Flujo de Caja
          </h2>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.94rem', fontWeight: 500 }}>
            Proyección del capital disponible proveniente únicamente de los proyectos registrados desde Odoo.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Barra seleccionadora dinámica de proyección desde el mes actual hacia adelante (tope: 4 meses) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              htmlFor="selector-proyeccion-caja"
              style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}
            >
              Proyectar:
            </label>
            <select
              id="selector-proyeccion-caja"
              value={horizonteMeses}
              onChange={(e) => handleCambioHorizonte(Number(e.target.value) as 1 | 2 | 3 | 4)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1.5px solid #0284c7',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.90rem',
                cursor: 'pointer',
                minWidth: '280px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)'
              }}
            >
              {opcionesBarraMeses.map((op) => (
                <option key={op.valor} value={op.valor}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          <HoverEyeTrigger
            active={mostrarMontos}
            onHoverChange={setMostrarMontos}
            label="Ver montos"
            mode="click"
          />
        </div>
      </div>

      {/* Aviso transparente de alcance + Recordatorio concreto de mora en Bolívares */}
      <div
        style={{
          backgroundColor: '#f0f9ff',
          border: '1.5px solid #bae6fd',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '0.88rem',
          color: '#0c4a6e'
        }}
      >
        <div>
          <strong>Alcance de esta proyección:</strong> Refleja exclusivamente el capital generado por los{' '}
          <strong>proyectos activos de Odoo</strong> (cobros CXC menos compromisos CXP), sin incluir reservas o saldos bancarios generales de la empresa.
        </div>
        {montoMoraTotalUSD > 0 && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fecaca',
              color: '#991b1b',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <span>
              ● Recordar que hay{' '}
              <strong style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.94rem' }}>
                {fmtMonto(montoMoraTotalUSD, 'VES')}
              </strong>{' '}
              en mora ({cantidadCuotasMora === 1 ? '1 cuota atrasada por cobrar' : `${cantidadCuotasMora} cuotas atrasadas por cobrar`}).
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: '#b91c1c' }}>
              Ref. {fmtMonto(montoMoraTotalUSD, 'USD')}
            </span>
          </div>
        )}
      </div>

      {/* 3 Tarjetas de Capital y Proyección a 3 Meses */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}
      >
        {/* 1. Capital Actual en Caja (Proyectos) */}
        <Card style={{ borderLeft: '5px solid #0284c7', marginBottom: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Capital Actual en Caja (Proyectos)
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: '1.45rem',
              color: '#0f172a',
              marginTop: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {fmtMonto(capitalActualProyectosUSD, 'VES')}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.86rem',
              color: '#475569',
              fontWeight: 600,
              marginTop: '2px'
            }}
          >
            Ref. {fmtMonto(capitalActualProyectosUSD, 'USD')}
          </div>
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.80rem',
              color: '#475569',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <span>Cobrado: {fmtMonto(totalCobradoProyectosUSD, 'USD')}</span>
            <span>Pagado CXP: {fmtMonto(totalPagadoProyectosUSD, 'USD')}</span>
          </div>
        </Card>

        {/* 2. Flujo Neto Proyectado */}
        <Card style={{ borderLeft: '5px solid #059669', marginBottom: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Flujo Neto Proyectado
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: '1.45rem',
              color: flujoNeto3MesesUSD >= 0 ? '#059669' : '#dc2626',
              marginTop: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {flujoNeto3MesesUSD >= 0 ? '+' : ''}
            {fmtMonto(flujoNeto3MesesUSD, 'VES')}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.86rem',
              color: '#475569',
              fontWeight: 600,
              marginTop: '2px'
            }}
          >
            Ref. {flujoNeto3MesesUSD >= 0 ? '+' : ''}
            {fmtMonto(flujoNeto3MesesUSD, 'USD')}
          </div>
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.80rem',
              color: '#475569'
            }}
          >
            Diferencia entre cobros y pagos programados en {mesesProyectados.map((m) => m.mesLabel.split(' ')[0]).join(', ')}.
          </div>
        </Card>

        {/* 3. Capital Acumulado Estimado al Cierre */}
        <Card style={{ borderLeft: '5px solid #1d4ed8', marginBottom: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Capital Estimado al Cierre
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 800,
              fontSize: '1.45rem',
              color: capitalFinal3MesesUSD >= 0 ? '#1d4ed8' : '#dc2626',
              marginTop: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {fmtMonto(capitalFinal3MesesUSD, 'VES')}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.86rem',
              color: '#475569',
              fontWeight: 600,
              marginTop: '2px'
            }}
          >
            Ref. {fmtMonto(capitalFinal3MesesUSD, 'USD')}
          </div>
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.80rem',
              color: '#1e3a8a',
              fontWeight: 600
            }}
          >
            Capital proyectado disponible para decisiones operativas.
          </div>
        </Card>
      </div>

      {/* GRÁFICO: Proyección Mensual de Dinero y Capital Disponible */}
      <Card
        title="Proyección Mensual de Caja y Capital"
        subtitle="Comparativa mensual de cobros esperados, compromisos de pago y capital acumulado disponible"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.80rem', fontWeight: 700 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#065f46' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#059669' }} />
              Entradas (CXC)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#92400e' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#d97706' }} />
              Salidas (CXP)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1e3a8a' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#2563eb' }} />
              Capital Acumulado
            </span>
          </div>
        }
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '18px',
            alignItems: 'stretch',
            paddingTop: '10px'
          }}
        >
          {mesesProyectados.map((mes) => {
            const pctEntradas = Math.max(
              mes.entradasPendientesUSD > 0 ? 12 : 2,
              Math.round((mes.entradasPendientesUSD / maxValorGraficoUSD) * 100)
            );
            const pctSalidas = Math.max(
              mes.salidasPendientesUSD > 0 ? 12 : 2,
              Math.round((mes.salidasPendientesUSD / maxValorGraficoUSD) * 100)
            );
            const pctCapital = Math.max(
              mes.capitalFinalUSD > 0 ? 14 : 2,
              Math.round((Math.max(0, mes.capitalFinalUSD) / maxValorGraficoUSD) * 100)
            );

            return (
              <div
                key={mes.mesKey}
                style={{
                  backgroundColor: mes.esMesActual ? '#f0f9ff' : '#f8fafc',
                  border: `1.5px solid ${mes.esMesActual ? '#7dd3fc' : '#e2e8f0'}`,
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Etiqueta clara de posición (Mes Actual / Mes Siguiente / Mes Subsiguiente / 4to Mes) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        backgroundColor: mes.esMesActual ? '#0284c7' : '#e2e8f0',
                        color: mes.esMesActual ? '#ffffff' : '#334155'
                      }}
                    >
                      {mes.etiquetaPosicion}
                    </span>
                    <Badge
                      label={
                        mes.flujoNetoMesUSD > 0
                          ? 'Superávit'
                          : mes.flujoNetoMesUSD < 0
                          ? 'Déficit'
                          : 'Estable'
                      }
                      variant={
                        mes.flujoNetoMesUSD > 0
                          ? 'success'
                          : mes.flujoNetoMesUSD < 0
                          ? 'danger'
                          : 'neutral'
                      }
                      size="sm"
                    />
                  </div>

                  {/* Nombre del mes */}
                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ fontSize: '1.12rem', color: '#0f172a' }}>{mes.mesLabel}</strong>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      {mes.cantidadMovimientos} movimiento(s) programados
                    </div>
                  </div>

                  {/* Área de barras verticales */}
                  <div
                    style={{
                      height: '175px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '10px',
                      alignItems: 'end',
                      padding: '12px 10px 0 10px',
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '14px'
                    }}
                  >
                    {/* Barra Entradas */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        title={`Entradas proyectadas: ${fmtMonto(mes.entradasPendientesUSD, 'VES')}`}
                        style={{
                          width: '100%',
                          maxWidth: '44px',
                          height: `${pctEntradas}%`,
                          backgroundColor: '#059669',
                          borderRadius: '8px 8px 0 0',
                          transition: 'height 0.35s ease'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46', marginTop: '6px', marginBottom: '6px' }}>
                        Entradas
                      </span>
                    </div>

                    {/* Barra Salidas */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        title={`Salidas proyectadas: ${fmtMonto(mes.salidasPendientesUSD, 'VES')}`}
                        style={{
                          width: '100%',
                          maxWidth: '44px',
                          height: `${pctSalidas}%`,
                          backgroundColor: '#d97706',
                          borderRadius: '8px 8px 0 0',
                          transition: 'height 0.35s ease'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginTop: '6px', marginBottom: '6px' }}>
                        Salidas
                      </span>
                    </div>

                    {/* Barra Capital Acumulado */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        title={`Capital acumulado al cierre: ${fmtMonto(mes.capitalFinalUSD, 'VES')}`}
                        style={{
                          width: '100%',
                          maxWidth: '44px',
                          height: `${pctCapital}%`,
                          background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)',
                          borderRadius: '8px 8px 0 0',
                          transition: 'height 0.35s ease'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e3a8a', marginTop: '6px', marginBottom: '6px' }}>
                        Capital
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cifras exactas y ordenadas del mes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: 600 }}>
                    <span>Saldo inicial:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtMonto(mes.capitalInicialUSD, 'VES')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 700 }}>
                    <span>+ Entradas CXC:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtMonto(mes.entradasPendientesUSD, 'VES')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontWeight: 700 }}>
                    <span>− Salidas CXP:</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {fmtMonto(mes.salidasPendientesUSD, 'VES')}
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1d4ed8', fontWeight: 800 }}>
                      <span>= Capital cierre:</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {fmtMonto(mes.capitalFinalUSD, 'VES')}
                      </span>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        fontSize: '0.74rem',
                        color: '#1e40af',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 600,
                        marginTop: '2px'
                      }}
                    >
                      Ref. {fmtMonto(mes.capitalFinalUSD, 'USD')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* TABLA 1: Resumen Mensual Consolidado de Caja y Capital */}
      <Card
        title="Resumen Mensual de Capital Proyectado"
        subtitle="Evolución mes a mes del saldo inicial, entradas, salidas y capital final disponible"
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '1040px',
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <colgroup>
              <col style={{ width: '15%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '17%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Mes
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Capital Inicial
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#059669', fontWeight: 700 }}>
                  + Entradas (CXC)
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#d97706', fontWeight: 700 }}>
                  − Salidas (CXP)
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#0f172a', fontWeight: 700 }}>
                  Flujo Neto Mes
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#1d4ed8', fontWeight: 700 }}>
                  Capital Final
                </th>
              </tr>
            </thead>
            <tbody>
              {mesesProyectados.map((mes) => (
                <tr key={mes.mesKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px', fontWeight: 800, color: '#0f172a', fontSize: '0.96rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '0.70rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: '999px',
                        backgroundColor: mes.esMesActual ? '#e0f2fe' : '#f1f5f9',
                        color: mes.esMesActual ? '#0369a1' : '#475569',
                        marginBottom: '4px'
                      }}
                    >
                      {mes.etiquetaPosicion}
                    </span>
                    <div>{mes.mesLabel}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                      {mes.cantidadMovimientos} movimiento(s)
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: '#334155' }}>{fmtMonto(mes.capitalInicialUSD, 'VES')}</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>Ref. {fmtMonto(mes.capitalInicialUSD, 'USD')}</div>
                  </td>
                  <td style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: '#059669' }}>{fmtMonto(mes.entradasPendientesUSD, 'VES')}</div>
                    <div style={{ fontSize: '0.76rem', color: '#047857' }}>Ref. {fmtMonto(mes.entradasPendientesUSD, 'USD')}</div>
                  </td>
                  <td style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: '#d97706' }}>{fmtMonto(mes.salidasPendientesUSD, 'VES')}</div>
                    <div style={{ fontSize: '0.76rem', color: '#b45309' }}>Ref. {fmtMonto(mes.salidasPendientesUSD, 'USD')}</div>
                  </td>
                  <td style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 800, color: mes.flujoNetoMesUSD >= 0 ? '#059669' : '#dc2626' }}>
                      {mes.flujoNetoMesUSD >= 0 ? '+' : ''}
                      {fmtMonto(mes.flujoNetoMesUSD, 'VES')}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      Ref. {mes.flujoNetoMesUSD >= 0 ? '+' : ''}
                      {fmtMonto(mes.flujoNetoMesUSD, 'USD')}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                    <div
                      style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '6px 10px'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#1d4ed8' }}>{fmtMonto(mes.capitalFinalUSD, 'VES')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>Ref. {fmtMonto(mes.capitalFinalUSD, 'USD')}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* TABLA 2: Desglose Detallado por Proyecto y Movimiento Mensual */}
      <Card
        title="Desglose Detallado de Movimientos por Proyecto"
        subtitle="Detalle exacto de cada cobro esperado (entrada) y pago a terceros (salida) en el horizonte proyectado"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#475569' }}>Filtrar mes:</span>
            <select
              value={filtroMesKey}
              onChange={(e) => setFiltroMesKey(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                backgroundColor: '#ffffff',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer'
              }}
            >
              <option value="TODOS">Todos los meses</option>
              {mesesProyectados.map((m) => (
                <option key={m.mesKey} value={m.mesKey}>
                  {m.mesLabel} ({m.cantidadMovimientos})
                </option>
              ))}
            </select>
          </div>
        }
        style={{ marginBottom: 0 }}
      >
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table
            style={{
              width: '100%',
              minWidth: '1040px',
              tableLayout: 'fixed',
              borderCollapse: 'collapse',
              textAlign: 'left'
            }}
          >
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '24%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Fecha / Mes
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Proyecto (Odoo)
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Cliente / Proveedor & Concepto
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Tipo de Movimiento
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Monto VES / Ref. USD
                </th>
                <th style={{ padding: '14px 16px', fontSize: '0.90rem', color: '#475569', fontWeight: 700 }}>
                  Estatus
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '26px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                    No existen movimientos proyectados para el mes seleccionado.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((mov) => {
                  const esEntrada = mov.tipo === 'ENTRADA_CXC';
                  return (
                    <tr
                      key={mov.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: esEntrada ? '#f0fdf422' : '#fffbeb33'
                      }}
                    >
                      <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.96rem', color: '#0f172a' }}>
                          {formatearFechaVE(mov.fecha)}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                          {mov.mesLabel}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.94rem' }}>
                          {mov.proyectoNombre}
                        </div>
                        <div style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                          {mov.proyectoCodigo}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.90rem' }}>
                          {mov.contraparte}
                        </div>
                        <div style={{ fontSize: '0.80rem', color: '#64748b', marginTop: '2px' }}>
                          {mov.detalle}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <Badge
                          label={esEntrada ? '+ Entrada CXC' : '− Salida CXP'}
                          variant={esEntrada ? 'success' : 'warning'}
                          size="sm"
                        />
                      </td>

                      <td style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, color: esEntrada ? '#059669' : '#b45309', fontSize: '0.96rem' }}>
                          {esEntrada ? '+' : '−'}
                          {fmtMonto(mov.montoUSD, 'VES')}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
                          Ref. {esEntrada ? '+' : '−'}
                          {fmtMonto(mov.montoUSD, 'USD')}
                        </div>
                      </td>

                      <td style={{ padding: '16px' }}>
                        <Badge
                          label={mov.estatus}
                          variant={
                            mov.estatus === 'Facturado'
                              ? 'info'
                              : mov.estatus === 'Bloqueado por Cobro' || mov.estatus === 'Vencido'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
