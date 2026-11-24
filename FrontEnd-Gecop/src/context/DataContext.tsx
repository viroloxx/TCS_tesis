import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, ReactNode } from 'react';
import {
  Cliente,
  Proyecto,
  EntregablePMO,
  CuotaCXC,
  CompromisoCXP,
  KpisFinancieros,
  ProyeccionMes
} from '../types';
import {
  INITIAL_CLIENTES,
  INITIAL_PROYECTOS,
  INITIAL_ENTREGABLES,
  INITIAL_CUOTAS_CXC,
  INITIAL_COMPROMISOS_CXP,
  TASA_BCV_INICIAL
} from '../data/mockData';
import {
  validarCandadoFinanciero,
  sincronizarFechaConEntregable,
  calcularProyeccionMensual,
  calcularKpis,
  simularReajusteCuotasProyecto,
  OpcionesCobroExtra
} from '../utils/calculations';

interface DataContextType {
  clientes: Cliente[];
  proyectos: Proyecto[];
  entregables: EntregablePMO[];
  cuotasCXC: CuotaCXC[];
  compromisosCXP: CompromisoCXP[];
  tasaBCV: number;
  cargandoTasaBCV: boolean;
  fechaActualizacionBCV: string | null;
  fuenteTasaBCV: 'BCV Oficial (En Vivo)' | 'Manual / Referencia';
  kpis: KpisFinancieros;
  proyecciones: ProyeccionMes[];
  marcarCuotaCobrada: (
    cuotaId: string,
    fechaCobro?: string,
    bancoReceptor?: string,
    referenciaCobro?: string,
    opcionesExtra?: OpcionesCobroExtra
  ) => void;
  marcarCompromisoPagado: (compromisoId: string, soporte?: string, fechaPago?: string) => void;
  actualizarFechaEntregable: (entregableId: string, nuevaFecha: string) => void;
  actualizarTasaBCV: (nuevaTasa: number) => void;
  sincronizarTasaBCV: () => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [proyectos] = useState<Proyecto[]>(INITIAL_PROYECTOS);
  const [entregables, setEntregables] = useState<EntregablePMO[]>(INITIAL_ENTREGABLES);
  const [cuotasCXC, setCuotasCXC] = useState<CuotaCXC[]>(INITIAL_CUOTAS_CXC);
  const [compromisosCXP, setCompromisosCXP] = useState<CompromisoCXP[]>(INITIAL_COMPROMISOS_CXP);
  const [tasaBCV, setTasaBCV] = useState<number>(TASA_BCV_INICIAL);
  const [cargandoTasaBCV, setCargandoTasaBCV] = useState<boolean>(false);
  const [fechaActualizacionBCV, setFechaActualizacionBCV] = useState<string | null>(null);
  const [fuenteTasaBCV, setFuenteTasaBCV] = useState<'BCV Oficial (En Vivo)' | 'Manual / Referencia'>(
    'Manual / Referencia'
  );

  // Sincronización en vivo con la Tasa Oficial del BCV (Opción 1: DolarApi VE + Respaldo PyDolarVe)
  const sincronizarTasaBCV = useCallback(async (): Promise<boolean> => {
    setCargandoTasaBCV(true);
    try {
      // 1. Endpoint Primario: DolarApi Venezuela (Tasa Oficial BCV)
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const valor = Number(data?.promedio);
        if (!isNaN(valor) && valor > 0) {
          setTasaBCV(Number(valor.toFixed(2)));
          setFuenteTasaBCV('BCV Oficial (En Vivo)');
          setFechaActualizacionBCV(
            data?.fechaActualizacion
              ? new Date(data.fechaActualizacion).toLocaleString('es-VE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : new Date().toLocaleString('es-VE')
          );
          return true;
        }
      }

      // 2. Endpoint de Respaldo (Fallback): PyDolarVe API Oficial BCV
      const fallbackRes = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        const valorFb = Number(fbData?.monitors?.usd?.price);
        if (!isNaN(valorFb) && valorFb > 0) {
          setTasaBCV(Number(valorFb.toFixed(2)));
          setFuenteTasaBCV('BCV Oficial (En Vivo)');
          setFechaActualizacionBCV(new Date().toLocaleString('es-VE'));
          return true;
        }
      }

      return false;
    } catch {
      // Si no hay conexión a internet, conserva la tasa actual sin romper la sesión
      return false;
    } finally {
      setCargandoTasaBCV(false);
    }
  }, []);

  // Consultar automáticamente la tasa oficial del BCV al iniciar la aplicación
  useEffect(() => {
    sincronizarTasaBCV();
  }, [sincronizarTasaBCV]);

  // Recalcular Candado Financiero y KPIs dinámicamente
  const compromisosValidados = useMemo(() => {
    return compromisosCXP.map((comp) => {
      const cuotaAsociada = cuotasCXC.find((c) => c.id === comp.cuotaCxcAsociadaId);
      return validarCandadoFinanciero(comp, cuotaAsociada);
    });
  }, [compromisosCXP, cuotasCXC]);

  const kpis = useMemo(() => {
    return calcularKpis(cuotasCXC, compromisosValidados, tasaBCV);
  }, [cuotasCXC, compromisosValidados, tasaBCV]);

  const proyecciones = useMemo(() => {
    return calcularProyeccionMensual(cuotasCXC, compromisosValidados);
  }, [cuotasCXC, compromisosValidados]);

  // Acción: Marcar Cuota como 'Cobrado' (Soporta cuota normal, pago de mayor porcentaje con reajuste automático y liquidación total / al contado)
  const marcarCuotaCobrada = (
    cuotaId: string,
    fechaCobro?: string,
    bancoReceptor?: string,
    referenciaCobro?: string,
    opcionesExtra?: OpcionesCobroExtra
  ) => {
    const fechaEfectiva = fechaCobro || new Date().toISOString().substring(0, 10);
    const bancoFinal = bancoReceptor || '0105 - Banco Mercantil C.A. (Cta. Corriente Corporativa)';
    const refFinal = referenciaCobro || 'REF-VERIFICADA';

    setCuotasCXC((prev) => {
      const cuotaObjetivo = prev.find((c) => c.id === cuotaId);
      if (!cuotaObjetivo) return prev;

      // Verificar que todas las cuotas previas del mismo proyecto estén cobradas
      const cuotasPreviasSinCobrar = prev.some(
        (c) =>
          c.proyectoId === cuotaObjetivo.proyectoId &&
          c.numeroCuota < cuotaObjetivo.numeroCuota &&
          c.estatus !== 'Cobrado'
      );

      if (cuotasPreviasSinCobrar) {
        return prev;
      }

      const cuotasDelProyecto = prev
        .filter((c) => c.proyectoId === cuotaObjetivo.proyectoId)
        .sort((a, b) => a.numeroCuota - b.numeroCuota);

      const simulacion = simularReajusteCuotasProyecto(cuotasDelProyecto, cuotaId, opcionesExtra);
      const modo = opcionesExtra?.modo || 'cuota_normal';
      const siguienteNumero = cuotaObjetivo.numeroCuota + 1;

      const mapaReajustes = new Map(
        (simulacion?.cuotasReajustadas || []).map((r) => [r.cuotaId, r])
      );

      return prev.map((cuota) => {
        if (cuota.proyectoId !== cuotaObjetivo.proyectoId) {
          return cuota;
        }

        const reajuste = mapaReajustes.get(cuota.id);

        // Cuota actual en turno
        if (cuota.id === cuotaId) {
          let comentarioActual = cuota.comentarios;
          if (simulacion?.liquidaTotalidad && modo === 'totalidad') {
            comentarioActual = 'Liquidación total anticipada del proyecto (100% cobrado).';
          } else if (cuota.totalCuotas === 1) {
            comentarioActual = 'Pago al Contado liquidado en su totalidad (100% cobrado).';
          } else if (modo === 'mayor_porcentaje' && reajuste) {
            comentarioActual = `Pago superior al porcentaje establecido (${simulacion?.porcentajeEstePago}% del contrato). Saldo restante reajustado automáticamente en las cuotas pendientes.`;
          }

          return {
            ...cuota,
            montoUSD: reajuste ? reajuste.montoNuevoUSD : cuota.montoUSD,
            estatus: 'Cobrado',
            fechaCobroEfectivo: fechaEfectiva,
            numeroFactura: cuota.numeroFactura || `FAC-2026-09${cuota.numeroCuota}5`,
            fechaFacturacion: cuota.fechaFacturacion || fechaEfectiva,
            bancoReceptor: bancoFinal,
            referenciaCobro: refFinal,
            comentarios: comentarioActual
          };
        }

        // Cuotas posteriores del mismo proyecto
        if (cuota.numeroCuota > cuotaObjetivo.numeroCuota && cuota.estatus !== 'Cobrado') {
          if (simulacion?.liquidaTotalidad && reajuste?.seraCobrada) {
            return {
              ...cuota,
              estatus: 'Cobrado',
              fechaCobroEfectivo: fechaEfectiva,
              numeroFactura: cuota.numeroFactura || `FAC-2026-09${cuota.numeroCuota}5`,
              fechaFacturacion: cuota.fechaFacturacion || fechaEfectiva,
              bancoReceptor: bancoFinal,
              referenciaCobro: refFinal,
              comentarios: `Cubierta mediante liquidación total anticipada junto con la Cuota #${cuotaObjetivo.numeroCuota}.`
            };
          }

          const nuevoEstatus =
            cuota.numeroCuota === siguienteNumero && cuota.estatus === 'Pendiente'
              ? 'Por Facturar'
              : cuota.estatus;

          if (modo === 'mayor_porcentaje' && reajuste) {
            return {
              ...cuota,
              montoUSD: reajuste.montoNuevoUSD,
              estatus: nuevoEstatus,
              comentarios: `Monto y porcentaje (${reajuste.porcentajeNuevo}%) reajustados automáticamente tras abono mayor en Cuota #${cuotaObjetivo.numeroCuota}.`
            };
          }

          if (nuevoEstatus !== cuota.estatus) {
            return {
              ...cuota,
              estatus: nuevoEstatus
            };
          }
        }

        return cuota;
      });
    });
  };

  // Acción: Marcar Compromiso CXP como 'Pagado'
  const marcarCompromisoPagado = (compromisoId: string, soporte?: string, fechaPago?: string) => {
    const fechaEfectiva = fechaPago || new Date().toISOString().substring(0, 10);
    setCompromisosCXP((prev) =>
      prev.map((comp) =>
        comp.id === compromisoId
          ? {
              ...comp,
              estatus: 'Pagado',
              fechaPagoEfectivo: fechaEfectiva,
              soporteComprobante: soporte || comp.soporteComprobante || 'Confirmado'
            }
          : comp
      )
    );
  };

  // Acción: Sincronización PMO (Cambio de fecha de entregable -> Recalcula fecha y proyección)
  const actualizarFechaEntregable = (entregableId: string, nuevaFecha: string) => {
    // 1. Actualizar entregable
    let entregableActualizado: EntregablePMO | undefined;
    setEntregables((prev) =>
      prev.map((ent) => {
        if (ent.id === entregableId) {
          entregableActualizado = { ...ent, fechaProgramada: nuevaFecha };
          return entregableActualizado;
        }
        return ent;
      })
    );

    // 2. Sincronizar cuotas asociadas al entregable
    setCuotasCXC((prev) =>
      prev.map((cuota) => {
        if (cuota.entregableId === entregableId && entregableActualizado) {
          return sincronizarFechaConEntregable(cuota, entregableActualizado);
        }
        return cuota;
      })
    );
  };

  const actualizarTasaBCV = (nuevaTasa: number) => {
    if (nuevaTasa > 0) {
      setTasaBCV(nuevaTasa);
      setFuenteTasaBCV('Manual / Referencia');
      setFechaActualizacionBCV(new Date().toLocaleString('es-VE'));
    }
  };

  return (
    <DataContext.Provider
      value={{
        clientes,
        proyectos,
        entregables,
        cuotasCXC,
        compromisosCXP: compromisosValidados,
        tasaBCV,
        cargandoTasaBCV,
        fechaActualizacionBCV,
        fuenteTasaBCV,
        kpis,
        proyecciones,
        marcarCuotaCobrada,
        marcarCompromisoPagado,
        actualizarFechaEntregable,
        actualizarTasaBCV,
        sincronizarTasaBCV
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData debe usarse dentro de un DataProvider');
  }
  return context;
};
