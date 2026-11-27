import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from './Button';
import { formatearMonedaVE } from '../../utils/formatters';
import { BANCOS_VENEZOLANOS } from '../../data/mockData';
import { ModoCobroProyecto, simularReajusteCuotasProyecto } from '../../utils/calculations';

interface ModalNuevoCobroProps {
  isOpen: boolean;
  onClose: () => void;
  cuotaInicialId?: string;
  onCobroExitoso?: (cuotaDesc: string) => void;
}

export const ModalNuevoCobro: React.FC<ModalNuevoCobroProps> = ({
  isOpen,
  onClose,
  cuotaInicialId,
  onCobroExitoso
}) => {
  const { cuotasCXC, proyectos, tasaBCV, marcarCuotaCobrada } = useData();
  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState<string>('');

  // Estado para sección opcional de pago mayor al porcentaje establecido, monto exacto o liquidación total
  const [usarPagoPersonalizado, setUsarPagoPersonalizado] = useState<boolean>(false);
  const [modoCobro, setModoCobro] = useState<ModoCobroProyecto>('cuota_normal');
  const [porcentajeDeseado, setPorcentajeDeseado] = useState<number>(50);
  const [montoAdicionalInput, setMontoAdicionalInput] = useState<string>('');

  // Obtener fecha actual en formato local YYYY-MM-DD
  const getFechaHoy = (): string => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fechaHoy = getFechaHoy();
  const [fechaCobro, setFechaCobro] = useState<string>(fechaHoy);
  const [bancoDestino, setBancoDestino] = useState<string>(BANCOS_VENEZOLANOS[0].etiquetaCta);
  const [referencia, setReferencia] = useState<string>('');

  // Determina si una cuota es la única habilitada en turno dentro de su proyecto
  const esCuotaHabilitada = (cuotaId: string): boolean => {
    const cuota = cuotasCXC.find((c) => c.id === cuotaId);
    if (!cuota || cuota.estatus === 'Cobrado') return false;
    return !cuotasCXC.some(
      (c) =>
        c.proyectoId === cuota.proyectoId &&
        c.numeroCuota < cuota.numeroCuota &&
        c.estatus !== 'Cobrado'
    );
  };

  // Sincronizar cuota preseleccionada y reiniciar opciones al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (cuotaInicialId && esCuotaHabilitada(cuotaInicialId)) {
        setCuotaSeleccionadaId(cuotaInicialId);
      } else {
        const primeraHabilitada = cuotasCXC.find((c) => esCuotaHabilitada(c.id));
        setCuotaSeleccionadaId(primeraHabilitada ? primeraHabilitada.id : '');
      }
      setUsarPagoPersonalizado(false);
      setModoCobro('cuota_normal');
      setMontoAdicionalInput('');
      setFechaCobro(fechaHoy);
      setReferencia('');
    }
  }, [isOpen, cuotaInicialId, cuotasCXC, fechaHoy]);

  const cuotaSeleccionada = cuotasCXC.find((c) => c.id === cuotaSeleccionadaId);
  const proyectoSeleccionado = proyectos.find((p) => p.id === cuotaSeleccionada?.proyectoId);

  const cuotasDelProyecto = useMemo(() => {
    if (!cuotaSeleccionada) return [];
    return cuotasCXC
      .filter((c) => c.proyectoId === cuotaSeleccionada.proyectoId)
      .sort((a, b) => a.numeroCuota - b.numeroCuota);
  }, [cuotasCXC, cuotaSeleccionada]);

  const montoTotalProyectoUSD = useMemo(
    () => cuotasDelProyecto.reduce((acc, c) => acc + c.montoUSD, 0),
    [cuotasDelProyecto]
  );

  const cuotasPosteriores = useMemo(() => {
    if (!cuotaSeleccionada) return [];
    return cuotasDelProyecto.filter(
      (c) => c.numeroCuota > cuotaSeleccionada.numeroCuota && c.estatus !== 'Cobrado'
    );
  }, [cuotasDelProyecto, cuotaSeleccionada]);

  const esPagoAlContado =
    proyectoSeleccionado?.modalidadPago === 'Al Contado' ||
    (cuotaSeleccionada ? cuotaSeleccionada.totalCuotas === 1 : false);

  const saldoPendienteProyectoUSD = useMemo(() => {
    if (!cuotaSeleccionada) return 0;
    return cuotaSeleccionada.montoUSD + cuotasPosteriores.reduce((acc, c) => acc + c.montoUSD, 0);
  }, [cuotaSeleccionada, cuotasPosteriores]);

  const pctCuotaEstablecida =
    montoTotalProyectoUSD > 0 && cuotaSeleccionada
      ? Number(((cuotaSeleccionada.montoUSD / montoTotalProyectoUSD) * 100).toFixed(1))
      : 100;

  const pctMaxRestante =
    montoTotalProyectoUSD > 0
      ? Number(((saldoPendienteProyectoUSD / montoTotalProyectoUSD) * 100).toFixed(1))
      : 100;

  // Base mínima fija de la barra = porcentaje establecido de la cuota (solo se puede mover hacia la derecha, nunca reducir)
  const pctBaseCuota = Math.min(Math.floor(pctMaxRestante), Math.round(pctCuotaEstablecida));
  const pctMaxMayor = Math.max(pctBaseCuota, Math.floor(pctMaxRestante) - 1);
  const puedePagarMayorPorcentaje =
    !esPagoAlContado && cuotasPosteriores.length > 0 && pctMaxMayor > pctBaseCuota;

  // Monto máximo adicional en USD y VES que se puede abonar sin generar saldo negativo
  const montoMaximoAdicionalUSD = useMemo(() => {
    if (!cuotaSeleccionada) return 0;
    return Number(Math.max(0, saldoPendienteProyectoUSD - cuotaSeleccionada.montoUSD).toFixed(2));
  }, [cuotaSeleccionada, saldoPendienteProyectoUSD]);

  const montoMaximoAdicionalVES = useMemo(() => {
    return Number((montoMaximoAdicionalUSD * tasaBCV).toFixed(2));
  }, [montoMaximoAdicionalUSD, tasaBCV]);

  const montoAdicionalNumericoVES = useMemo(() => {
    const parsed = parseFloat(montoAdicionalInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return 0;
    return Math.min(montoMaximoAdicionalVES, Number(parsed.toFixed(2)));
  }, [montoAdicionalInput, montoMaximoAdicionalVES]);

  const montoAdicionalNumericoUSD = useMemo(() => {
    if (montoAdicionalNumericoVES <= 0 || tasaBCV <= 0) return 0;
    const convertido = Number((montoAdicionalNumericoVES / tasaBCV).toFixed(2));
    return Math.min(montoMaximoAdicionalUSD, Math.max(0, convertido));
  }, [montoAdicionalNumericoVES, tasaBCV, montoMaximoAdicionalUSD]);

  // Inicializar la barra en el extremo izquierdo (cuota base) para que solo se desplace hacia la derecha
  useEffect(() => {
    setPorcentajeDeseado(pctBaseCuota);
    setMontoAdicionalInput('');
  }, [cuotaSeleccionadaId, pctBaseCuota]);

  const modoEfectivo: ModoCobroProyecto =
    esPagoAlContado || !usarPagoPersonalizado ? 'cuota_normal' : modoCobro;

  const simulacion = useMemo(() => {
    if (!cuotaSeleccionada) return null;
    return simularReajusteCuotasProyecto(cuotasDelProyecto, cuotaSeleccionada.id, {
      modo: modoEfectivo,
      porcentajeProyectoDeseado:
        modoEfectivo === 'mayor_porcentaje' ? porcentajeDeseado : undefined,
      montoAdicionalUSD:
        modoEfectivo === 'monto_exacto' ? montoAdicionalNumericoUSD : undefined
    });
  }, [cuotasDelProyecto, cuotaSeleccionada, modoEfectivo, porcentajeDeseado, montoAdicionalNumericoUSD]);

  if (!isOpen) return null;

  const cuotasDelSelector = cuotasCXC
    .filter((c) => (proyectoSeleccionado ? c.proyectoId === proyectoSeleccionado.id : true))
    .sort((a, b) => {
      if (a.proyectoId !== b.proyectoId) return a.proyectoId.localeCompare(b.proyectoId);
      return a.numeroCuota - b.numeroCuota;
    });

  const handleToggleOpcional = (activar: boolean) => {
    setUsarPagoPersonalizado(activar);
    if (!activar) {
      setModoCobro('cuota_normal');
      setPorcentajeDeseado(pctBaseCuota);
      setMontoAdicionalInput('');
    } else {
      setPorcentajeDeseado(pctBaseCuota);
      setModoCobro(puedePagarMayorPorcentaje ? 'mayor_porcentaje' : 'monto_exacto');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cuotaSeleccionadaId || !esCuotaHabilitada(cuotaSeleccionadaId)) {
      alert('Esta cuota no está habilitada para cobro o ya fue pagada.');
      return;
    }
    if (!fechaCobro) {
      alert('Por favor seleccione la fecha en que se recibió el cobro');
      return;
    }
    if (fechaCobro > fechaHoy) {
      alert('La fecha del cobro no puede ser posterior al día actual');
      return;
    }

    if (modoEfectivo === 'mayor_porcentaje') {
      if (isNaN(porcentajeDeseado) || porcentajeDeseado <= pctBaseCuota) {
        alert(
          `Mueva la barra hacia la derecha para indicar un porcentaje mayor a la cuota base (${pctBaseCuota}%), o desmarque la opción para cobrar la cuota normal.`
        );
        return;
      }
      if (porcentajeDeseado >= pctMaxRestante) {
        alert(
          `El porcentaje no puede superar el máximo parcial (${pctMaxMayor}%). Si desea cancelar el 100%, seleccione "Pagar totalidad".`
        );
        return;
      }
    }

    if (modoEfectivo === 'monto_exacto') {
      if (montoAdicionalNumericoVES <= 0 || montoAdicionalNumericoUSD <= 0) {
        alert(
          'Ingrese un monto adicional exacto mayor a Bs. 0,00 para agregar a la factura, o desmarque la opción para cobrar la cuota normal.'
        );
        return;
      }
    }

    const cuota = cuotasCXC.find((c) => c.id === cuotaSeleccionadaId);
    marcarCuotaCobrada(cuotaSeleccionadaId, fechaCobro, bancoDestino, referencia, {
      modo: modoEfectivo,
      porcentajeProyectoDeseado:
        modoEfectivo === 'mayor_porcentaje' ? porcentajeDeseado : undefined,
      montoAdicionalUSD:
        modoEfectivo === 'monto_exacto' ? montoAdicionalNumericoUSD : undefined
    });

    if (onCobroExitoso && cuota) {
      if (esPagoAlContado) {
        onCobroExitoso(`Pago al Contado (100%) — ${proyectoSeleccionado?.nombre || cuota.descripcion}`);
      } else if (modoEfectivo === 'totalidad' || simulacion?.liquidaTotalidad) {
        onCobroExitoso(`Liquidación Total (100%) — ${proyectoSeleccionado?.nombre || cuota.descripcion}`);
      } else if (modoEfectivo === 'monto_exacto' && simulacion) {
        onCobroExitoso(
          `Cuota #${cuota.numeroCuota} + abono exacto de ${formatearMonedaVE(simulacion.montoAdicionalAplicadoUSD * tasaBCV, 'VES')} (${simulacion.porcentajeEstePago}% del contrato) — cuotas restantes reajustadas`
        );
      } else if (modoEfectivo === 'mayor_porcentaje') {
        onCobroExitoso(
          `Cuota #${cuota.numeroCuota} con abono mayor (${porcentajeDeseado}% del contrato) — cuotas restantes reajustadas`
        );
      } else {
        onCobroExitoso(cuota.descripcion);
      }
    }
    onClose();
  };

  const montoMostrarUSD = simulacion ? simulacion.montoAPagarAhoraUSD : cuotaSeleccionada?.montoUSD || 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '30px 34px',
          maxWidth: '780px',
          width: '94%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid #cbd5e1'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Registrar Cobro Recibido
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. Selector de cuota con opciones ya pagadas o fuera de turno bloqueadas (disabled) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              1. Cuota a Cobrar (las cuotas ya pagadas están bloqueadas):
            </label>
            <select
              value={cuotaSeleccionadaId}
              onChange={(e) => {
                setCuotaSeleccionadaId(e.target.value);
                setUsarPagoPersonalizado(false);
                setModoCobro('cuota_normal');
              }}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.90rem',
                backgroundColor: '#f8fafc',
                color: '#0f172a',
                fontWeight: 600
              }}
            >
              {cuotasDelSelector.map((c) => {
                const prj = proyectos.find((p) => p.id === c.proyectoId);
                const yaPagada = c.estatus === 'Cobrado';
                const habilitada = esCuotaHabilitada(c.id);
                const bloqueadaPorPrelacion = !yaPagada && !habilitada;
                const pctCuota =
                  montoTotalProyectoUSD > 0
                    ? Math.round((c.montoUSD / montoTotalProyectoUSD) * 100)
                    : 100;

                const etiquetaModalidad =
                  c.totalCuotas === 1
                    ? 'Pago al Contado (100%)'
                    : `Cuota #${c.numeroCuota} de ${c.totalCuotas} (${pctCuota}%)`;

                let sufijoEstado = '';
                if (yaPagada) {
                  sufijoEstado = ' — [YA PAGADA - BLOQUEADA]';
                } else if (bloqueadaPorPrelacion) {
                  sufijoEstado = ` — [BLOQUEADA: Pagar primero Cuota #${c.numeroCuota - 1}]`;
                } else {
                  sufijoEstado = ' — [EN TURNO PARA COBRO]';
                }

                return (
                  <option
                    key={c.id}
                    value={c.id}
                    disabled={yaPagada || bloqueadaPorPrelacion}
                    style={{
                      color: yaPagada || bloqueadaPorPrelacion ? '#94a3b8' : '#0f172a',
                      fontWeight: habilitada ? 700 : 400
                    }}
                  >
                    {prj?.codigo} | {etiquetaModalidad}: {c.descripcion} (${c.montoUSD.toLocaleString('es-VE')}){sufijoEstado}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Resumen del monto efectivo a cobrar ahora */}
          {cuotaSeleccionada && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                {esPagoAlContado
                  ? `Pago al Contado (${proyectoSeleccionado?.nombre} — 100% del contrato):`
                  : modoEfectivo === 'totalidad' || simulacion?.liquidaTotalidad
                    ? `Monto Total a Liquidar (${proyectoSeleccionado?.nombre} — 100% del contrato):`
                    : modoEfectivo === 'monto_exacto' && simulacion && simulacion.montoAdicionalAplicadoUSD > 0
                      ? `Factura + Abono Exacto (${proyectoSeleccionado?.nombre} — ${simulacion.porcentajeEstePago}% del contrato):`
                      : modoEfectivo === 'mayor_porcentaje' && porcentajeDeseado > pctBaseCuota
                        ? `Monto Ajustado a Cobrar (${proyectoSeleccionado?.nombre} — ${porcentajeDeseado}% del contrato):`
                        : `Detalles del Cobro (${proyectoSeleccionado?.nombre} — Cuota #${cuotaSeleccionada.numeroCuota} de ${cuotaSeleccionada.totalCuotas} • ${Math.round(pctCuotaEstablecida)}%):`}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#15803d',
                  marginTop: '4px'
                }}
              >
                {formatearMonedaVE(montoMostrarUSD * tasaBCV, 'VES')} (Tasa BCV {formatearMonedaVE(tasaBCV, 'VES')})
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.88rem',
                  color: '#475569',
                  marginTop: '2px',
                  fontWeight: 600
                }}
              >
                Referencia en Dólares: {formatearMonedaVE(montoMostrarUSD, 'USD')} USD
              </div>
            </div>
          )}

          {/* Aviso Pago al Contado (1/1) */}
          {cuotaSeleccionada && esPagoAlContado && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1.5px solid #93c5fd',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px',
                fontSize: '0.86rem',
                color: '#1e3a8a',
                fontWeight: 600
              }}
            >
              <strong>Modalidad Pago al Contado (100%):</strong> Al confirmar este cobro el proyecto quedará liquidado y pasará directamente a estatus <strong>Cobrado</strong>.
            </div>
          )}

          {/* Aviso si es la última cuota restante de un proyecto fraccionado */}
          {cuotaSeleccionada && !esPagoAlContado && cuotasPosteriores.length === 0 && (
            <div
              style={{
                backgroundColor: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                borderRadius: '10px',
                padding: '11px 14px',
                marginBottom: '16px',
                fontSize: '0.85rem',
                color: '#1e40af',
                fontWeight: 600
              }}
            >
              <strong>Última cuota pendiente ({Math.round(pctCuotaEstablecida)}% restante):</strong> Al confirmar este cobro se completará el 100% del proyecto y quedará directamente como <strong>Cobrado</strong>.
            </div>
          )}

          {/* SECCIÓN OPCIONAL: Pagar más del porcentaje establecido o totalidad (cuando hay cuotas posteriores) */}
          {cuotaSeleccionada && !esPagoAlContado && cuotasPosteriores.length > 0 && (
            <div
              style={{
                backgroundColor: usarPagoPersonalizado ? '#f0f9ff' : '#f8fafc',
                border: `1.5px solid ${usarPagoPersonalizado ? '#38bdf8' : '#cbd5e1'}`,
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '18px',
                transition: 'all 0.2s ease'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.90rem',
                  color: '#0f172a',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={usarPagoPersonalizado}
                  onChange={(e) => handleToggleOpcional(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284c7' }}
                />
                <span>
                  En caso de que el cliente quisiera abonar extra de las cuotas
                </span>
              </label>

              {usarPagoPersonalizado && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #bae6fd' }}>
                  {/* Selector de modalidad opcional (3 opciones claras) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: puedePagarMayorPorcentaje ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                      gap: '10px',
                      marginBottom: '14px'
                    }}
                  >
                    {puedePagarMayorPorcentaje && (
                      <button
                        type="button"
                        onClick={() => {
                          setModoCobro('mayor_porcentaje');
                          setPorcentajeDeseado((prev) => Math.max(pctBaseCuota, Math.min(pctMaxMayor, prev)));
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `2px solid ${modoCobro === 'mayor_porcentaje' ? '#0284c7' : '#cbd5e1'}`,
                          backgroundColor: modoCobro === 'mayor_porcentaje' ? '#e0f2fe' : '#ffffff',
                          color: modoCobro === 'mayor_porcentaje' ? '#0369a1' : '#334155',
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>Pagar mayor %</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '2px', color: '#475569' }}>

                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setModoCobro('monto_exacto')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `2px solid ${modoCobro === 'monto_exacto' ? '#7c3aed' : '#cbd5e1'}`,
                        backgroundColor: modoCobro === 'monto_exacto' ? '#f5f3ff' : '#ffffff',
                        color: modoCobro === 'monto_exacto' ? '#5b21b6' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>Abonar monto exacto (Bs.)</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '2px', color: '#475569' }}>
                        Escribir monto manual a factura
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoCobro('totalidad')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: `2px solid ${modoCobro === 'totalidad' ? '#059669' : '#cbd5e1'}`,
                        backgroundColor: modoCobro === 'totalidad' ? '#ecfdf5' : '#ffffff',
                        color: modoCobro === 'totalidad' ? '#065f46' : '#334155',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>Pagar totalidad (100%)</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, marginTop: '2px', color: '#475569' }}>
                        Liquida todo y queda Cobrado
                      </div>
                    </button>
                  </div>

                  {/* OPCIÓN 1: Control de porcentaje (base fija a la izquierda, solo se mueve hacia la derecha, cero negativos) */}
                  {modoCobro === 'mayor_porcentaje' && puedePagarMayorPorcentaje && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                        <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                          Porcentaje del contrato a pagar en esta cuota:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min={pctBaseCuota}
                            max={pctMaxMayor}
                            step={1}
                            value={porcentajeDeseado}
                            onKeyDown={(e) => {
                              if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val)) {
                                // Nunca permite bajar de la cuota establecida ni superar el máximo parcial
                                setPorcentajeDeseado(Math.min(pctMaxMayor, Math.max(pctBaseCuota, Math.round(val))));
                              }
                            }}
                            style={{
                              width: '74px',
                              padding: '5px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #0284c7',
                              fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              color: '#0369a1',
                              textAlign: 'center'
                            }}
                          />
                          <span style={{ fontWeight: 800, color: '#0369a1' }}>%</span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={pctBaseCuota}
                        max={pctMaxMayor}
                        step={1}
                        value={porcentajeDeseado}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPorcentajeDeseado(Math.min(pctMaxMayor, Math.max(pctBaseCuota, val)));
                        }}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#0284c7' }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#475569', marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                        <span>Base fija: {pctBaseCuota}% (no se puede reducir)</span>
                        <span>Máx. parcial: {pctMaxMayor}% →</span>
                      </div>

                      {/* Vista previa del reajuste de cuotas y restante */}
                      {simulacion && (
                        <div
                          style={{
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #cbd5e1',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                            Ajuste automático de porcentajes y saldo restante:
                          </div>
                          {simulacion.montoAdicionalAplicadoUSD > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1', fontWeight: 700, marginBottom: '4px', gap: '8px', flexWrap: 'wrap' }}>
                              <span>Abono adicional sobre la cuota base:</span>
                              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                +{formatearMonedaVE(simulacion.montoAdicionalAplicadoUSD * tasaBCV, 'VES')} (Ref. +{formatearMonedaVE(simulacion.montoAdicionalAplicadoUSD, 'USD')})
                              </span>
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 700, marginBottom: '4px' }}>
                            <span>Avance total tras este cobro:</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {simulacion.porcentajeAcumuladoDespues}% Cobrado
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontWeight: 700, marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                            <span>Restante del proyecto ({simulacion.porcentajeRestanteDespues}%):</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {formatearMonedaVE(simulacion.saldoRestanteDespuesUSD * tasaBCV, 'VES')} (Ref. {formatearMonedaVE(simulacion.saldoRestanteDespuesUSD, 'USD')})
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                            {simulacion.cuotasReajustadas
                              .filter((r) => !r.seraCobrada)
                              .map((r) => (
                                <div
                                  key={r.cuotaId}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: '8px',
                                    flexWrap: 'wrap',
                                    backgroundColor: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    borderRadius: '6px',
                                    padding: '5px 8px',
                                    fontSize: '0.78rem',
                                    color: '#92400e',
                                    fontWeight: 600
                                  }}
                                >
                                  <span>
                                    Cuota #{r.numeroCuota} de {r.totalCuotas} (Nuevo: {r.porcentajeNuevo}%)
                                  </span>
                                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {formatearMonedaVE(r.montoNuevoUSD * tasaBCV, 'VES')} / Ref. {formatearMonedaVE(r.montoNuevoUSD, 'USD')}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPCIÓN 2: Abono manual por monto exacto en Bolívares agregado directamente a la factura */}
                  {modoCobro === 'monto_exacto' && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #ddd6fe',
                        borderRadius: '10px',
                        padding: '14px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          Monto exacto adicional a agregar a esta factura (Bs.):
                        </label>
                        <span style={{ fontSize: '0.76rem', color: '#64748b', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                          Máx. permitido: {formatearMonedaVE(montoMaximoAdicionalVES, 'VES')}
                        </span>
                      </div>

                      <div style={{ position: 'relative', width: '100%' }}>
                        <span
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 800,
                            color: '#5b21b6',
                            fontSize: '0.96rem'
                          }}
                        >
                          +Bs.
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={montoMaximoAdicionalVES}
                          step="0.01"
                          placeholder="Escriba el monto adicional en Bolívares"
                          value={montoAdicionalInput}
                          onKeyDown={(e) => {
                            if (['-', '+', 'e', 'E'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '') {
                              setMontoAdicionalInput('');
                              return;
                            }
                            const num = parseFloat(raw);
                            if (isNaN(num) || num < 0) return;
                            if (num > montoMaximoAdicionalVES) {
                              setMontoAdicionalInput(String(montoMaximoAdicionalVES));
                            } else {
                              setMontoAdicionalInput(raw);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px 10px 58px',
                            borderRadius: '8px',
                            border: '1.5px solid #7c3aed',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: '#4c1d95',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Vista previa de ajuste de factura, porcentaje equivalente y restante */}
                      {simulacion && (
                        <div
                          style={{
                            marginTop: '12px',
                            paddingTop: '10px',
                            borderTop: '1px dashed #ddd6fe',
                            fontSize: '0.82rem'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 600, marginBottom: '4px', gap: '8px', flexWrap: 'wrap' }}>
                            <span>Cuota base de factura ({Math.round(pctCuotaEstablecida)}%):</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {formatearMonedaVE(cuotaSeleccionada.montoUSD * tasaBCV, 'VES')} / Ref. {formatearMonedaVE(cuotaSeleccionada.montoUSD, 'USD')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6d28d9', fontWeight: 700, marginBottom: '4px', gap: '8px', flexWrap: 'wrap' }}>
                            <span>+ Abono exacto agregado a factura:</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              +{formatearMonedaVE(simulacion.montoAdicionalAplicadoUSD * tasaBCV, 'VES')} / Ref. +{formatearMonedaVE(simulacion.montoAdicionalAplicadoUSD, 'USD')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 800, marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                            <span>Nuevo porcentaje de esta factura ({simulacion.porcentajeEstePago}% del contrato):</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              {simulacion.porcentajeAcumuladoDespues}% Cobrado total
                            </span>
                          </div>

                          {simulacion.liquidaTotalidad ? (
                            <div
                              style={{
                                backgroundColor: '#ecfdf5',
                                border: '1px solid #86efac',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                color: '#065f46',
                                fontWeight: 700,
                                marginTop: '6px'
                              }}
                            >
                              ✓ Este abono cubre el 100% del saldo pendiente. El restante queda en Bs. 0,00 (Ref. $0,00) y el proyecto pasará directamente a Cobrado.
                            </div>
                          ) : (
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309', fontWeight: 700, marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
                                <span>Restante del proyecto ({simulacion.porcentajeRestanteDespues}%):</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {formatearMonedaVE(simulacion.saldoRestanteDespuesUSD * tasaBCV, 'VES')} (Ref. {formatearMonedaVE(simulacion.saldoRestanteDespuesUSD, 'USD')})
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                {simulacion.cuotasReajustadas
                                  .filter((r) => !r.seraCobrada)
                                  .map((r) => (
                                    <div
                                      key={r.cuotaId}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                        backgroundColor: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        borderRadius: '6px',
                                        padding: '5px 8px',
                                        fontSize: '0.78rem',
                                        color: '#92400e',
                                        fontWeight: 600
                                      }}
                                    >
                                      <span>
                                        Cuota #{r.numeroCuota} de {r.totalCuotas} (Nuevo: {r.porcentajeNuevo}%)
                                      </span>
                                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                        {formatearMonedaVE(r.montoNuevoUSD * tasaBCV, 'VES')} / Ref. {formatearMonedaVE(r.montoNuevoUSD, 'USD')}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* OPCIÓN 3: Vista previa si eligió Liquidar Totalidad */}
                  {modoCobro === 'totalidad' && simulacion && (
                    <div
                      style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #86efac',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        fontSize: '0.84rem',
                        color: '#065f46'
                      }}
                    >
                      <strong>Liquidación Total (100%):</strong> Se cobrará el saldo completo pendiente del proyecto (<strong>{cuotasPosteriores.length + 1} cuotas</strong>), el restante pasará a <strong>Bs. 0,00 (Ref. $0,00)</strong> y el proyecto quedará directamente en estatus <strong>Cobrado</strong>.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2. Fecha del Cobro */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              2. Fecha en que se recibió el cobro:
            </label>
            <input
              type="date"
              value={fechaCobro}
              max={fechaHoy}
              onChange={(e) => setFechaCobro(e.target.value)}
              onClick={(e) => {
                try {
                  if ('showPicker' in e.currentTarget) {
                    e.currentTarget.showPicker();
                  }
                } catch {
                  // Fallback si no está disponible
                }
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Tab') {
                  e.preventDefault();
                }
              }}
              title="Haga clic para seleccionar la fecha en el calendario"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.90rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            />
          </div>

          {/* 3. Banco Destino */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              3. Cuenta Bancaria Receptora:
            </label>
            <select
              value={bancoDestino}
              onChange={(e) => setBancoDestino(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.90rem',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: 600
              }}
            >
              {BANCOS_VENEZOLANOS.map((banco) => (
                <option key={banco.codigo} value={banco.etiquetaCta}>
                  {banco.etiquetaCta}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Referencia Bancaria */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              4. Número de Referencia o Comprobante:
            </label>
            <input
              type="text"
              placeholder="Ej: REF-984210 / TRANSF-BNC-44"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.90rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="md" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="success" size="lg" type="submit">
              {modoEfectivo === 'totalidad' || esPagoAlContado || simulacion?.liquidaTotalidad
                ? 'Confirmar Liquidación Total (100%)'
                : modoEfectivo === 'monto_exacto'
                  ? 'Agregar Abono a Factura y Reajustar'
                  : modoEfectivo === 'mayor_porcentaje'
                    ? 'Confirmar Abono y Reajustar Cuotas'
                    : 'Confirmar y Liberar Candado CXP'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
