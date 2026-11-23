/**
 * Motor de Cálculos y Reglas de Negocio Financieras (TCS - GECOP)
 */

import { CuotaCXC, CompromisoCXP, EntregablePMO, ProyeccionMes, KpisFinancieros } from '../types';

/**
 * REGLA 1: Candado Financiero de Sustento (CXP)
 * Un compromiso de pago solo pasa a 'Por Pagar' cuando su cuota de cobro asociada es 'Cobrado'.
 * De lo contrario, permanece o se bloquea como 'Bloqueado por Cobro'.
 */
export const validarCandadoFinanciero = (
  compromiso: CompromisoCXP,
  cuotaAsociada?: CuotaCXC
): CompromisoCXP => {
  // Si ya fue pagado, se preserva su estatus
  if (compromiso.estatus === 'Pagado') {
    return compromiso;
  }

  if (!cuotaAsociada || cuotaAsociada.estatus !== 'Cobrado') {
    return {
      ...compromiso,
      estatus: 'Bloqueado por Cobro'
    };
  }

  // Si la cuota ya está cobrada y estaba bloqueado, pasa a 'Por Pagar'
  return {
    ...compromiso,
    estatus: 'Por Pagar'
  };
};

/**
 * REGLA 2: Sincronización PMO
 * Si la fecha del entregable cambia, actualiza la fecha de vencimiento de la cuota de cobro.
 */
export const sincronizarFechaConEntregable = (
  cuota: CuotaCXC,
  entregable: EntregablePMO
): CuotaCXC => {
  return {
    ...cuota,
    fechaVencimiento: entregable.fechaProgramada
  };
};

/**
 * REGLA 3: Motor de Proyección Mensual Consolidada
 * Agrupa y consolida ingresos proyectados (CXC) y egresos (CXP) por mes.
 */
export const calcularProyeccionMensual = (
  cuotas: CuotaCXC[],
  compromisos: CompromisoCXP[]
): ProyeccionMes[] => {
  const mapaMeses = new Map<string, {
    cxcEstimado: number;
    cxcCobrado: number;
    cxpEstimado: number;
    cxpPagado: number;
  }>();

  // Mapear meses de nombres en español
  const nombresMeses: Record<string, string> = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
    '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
    '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };

  // Pre-inicializar meses históricos (Diciembre 2025 - Septiembre 2026)
  // para habilitar cortes de 3 meses, 6 meses y 1 año hacia atrás desde la fecha actual
  const historicoMensual: Record<string, { cxcCobrado: number; cxpPagado: number }> = {
    '2025-12': { cxcCobrado: 35600, cxpPagado: 16200 },
    '2026-01': { cxcCobrado: 32000, cxpPagado: 14500 },
    '2026-02': { cxcCobrado: 28500, cxpPagado: 12000 },
    '2026-03': { cxcCobrado: 41000, cxpPagado: 19800 },
    '2026-04': { cxcCobrado: 24000, cxpPagado: 26500 },
    '2026-05': { cxcCobrado: 38200, cxpPagado: 15400 },
    '2026-06': { cxcCobrado: 46500, cxpPagado: 21000 },
    '2026-07': { cxcCobrado: 29800, cxpPagado: 13200 },
    '2026-08': { cxcCobrado: 52000, cxpPagado: 24600 },
    '2026-09': { cxcCobrado: 39400, cxpPagado: 16900 }
  };

  Object.entries(historicoMensual).forEach(([mesAno, valores]) => {
    mapaMeses.set(mesAno, {
      cxcEstimado: 0,
      cxcCobrado: valores.cxcCobrado,
      cxpEstimado: 0,
      cxpPagado: valores.cxpPagado
    });
  });

  // Procesar Cuotas CXC
  cuotas.forEach((cuota) => {
    const mesAno = cuota.fechaVencimiento.substring(0, 7); // "YYYY-MM"
    if (!mesAno) return;

    if (!mapaMeses.has(mesAno)) {
      mapaMeses.set(mesAno, { cxcEstimado: 0, cxcCobrado: 0, cxpEstimado: 0, cxpPagado: 0 });
    }

    const entrada = mapaMeses.get(mesAno)!;
    if (cuota.estatus === 'Cobrado') {
      entrada.cxcCobrado += cuota.montoUSD;
    } else {
      entrada.cxcEstimado += cuota.montoUSD;
    }
  });

  // Procesar Compromisos CXP
  compromisos.forEach((comp) => {
    const mesAno = comp.fechaVencimientoCalculada.substring(0, 7); // "YYYY-MM"
    if (!mesAno) return;

    if (!mapaMeses.has(mesAno)) {
      mapaMeses.set(mesAno, { cxcEstimado: 0, cxcCobrado: 0, cxpEstimado: 0, cxpPagado: 0 });
    }

    const entrada = mapaMeses.get(mesAno)!;
    if (comp.estatus === 'Pagado') {
      entrada.cxpPagado += comp.montoUSD;
    } else {
      entrada.cxpEstimado += comp.montoUSD;
    }
  });

  // Convertir mapa a lista ordenada cronológicamente
  const mesesOrdenados = Array.from(mapaMeses.keys()).sort();

  return mesesOrdenados.map((mesAno) => {
    const data = mapaMeses.get(mesAno)!;
    const [ano, mes] = mesAno.split('-');
    const nombreMes = `${nombresMeses[mes] || mes} ${ano}`;
    const totalIngresos = data.cxcCobrado + data.cxcEstimado;
    const totalEgresos = data.cxpPagado + data.cxpEstimado;

    return {
      mesAno,
      nombreMes,
      totalCXCEstimadoUSD: data.cxcEstimado,
      totalCXCCobradoUSD: data.cxcCobrado,
      totalCXPEstimadoUSD: data.cxpEstimado,
      totalCXPPagadoUSD: data.cxpPagado,
      flujoNetoProyectadoUSD: totalIngresos - totalEgresos
    };
  });
};

/**
 * REGLA 4: Cálculo de KPIs del Tablero Principal
 */
export const calcularKpis = (
  cuotas: CuotaCXC[],
  compromisos: CompromisoCXP[],
  tasaBCV: number
): KpisFinancieros => {
  const mesActual = new Date().toISOString().substring(0, 7); // "YYYY-MM"

  let totalPorCobrarUSD = 0;
  let totalCobradoMesUSD = 0;
  let cuotasVencidasCount = 0;
  let cuotasVencidasMontoUSD = 0;

  cuotas.forEach((c) => {
    if (c.estatus === 'Cobrado') {
      const mesCobro = (c.fechaCobroEfectivo || c.fechaVencimiento).substring(0, 7);
      if (mesCobro === mesActual) {
        totalCobradoMesUSD += c.montoUSD;
      }
    } else {
      totalPorCobrarUSD += c.montoUSD;
      if (c.estatus === 'Vencido') {
        cuotasVencidasCount += 1;
        cuotasVencidasMontoUSD += c.montoUSD;
      }
    }
  });

  let totalPorPagarUSD = 0;
  let totalPagadoMesUSD = 0;
  let compromisosBloqueadosCount = 0;
  let compromisosBloqueadosMontoUSD = 0;

  compromisos.forEach((comp) => {
    if (comp.estatus === 'Pagado') {
      const mesPago = (comp.fechaPagoEfectivo || comp.fechaVencimientoCalculada).substring(0, 7);
      if (mesPago === mesActual) {
        totalPagadoMesUSD += comp.montoUSD;
      }
    } else {
      if (comp.estatus === 'Por Pagar') {
        totalPorPagarUSD += comp.montoUSD;
      } else if (comp.estatus === 'Bloqueado por Cobro') {
        compromisosBloqueadosCount += 1;
        compromisosBloqueadosMontoUSD += comp.montoUSD;
      }
    }
  });

  return {
    totalPorCobrarUSD,
    totalCobradoMesUSD,
    totalPorPagarUSD,
    totalPagadoMesUSD,
    compromisosBloqueadosCount,
    compromisosBloqueadosMontoUSD,
    cuotasVencidasCount,
    cuotasVencidasMontoUSD,
    tasaBCVActual: tasaBCV
  };
};
