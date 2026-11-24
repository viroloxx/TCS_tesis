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

  // Estado para sección opcional de pago mayor al porcentaje establecido o liquidación total
  const [usarPagoPersonalizado, setUsarPagoPersonalizado] = useState<boolean>(false);
  const [modoCobro, setModoCobro] = useState<ModoCobroProyecto>('cuota_normal');
  const [porcentajeDeseado, setPorcentajeDeseado] = useState<number>(50);

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

  const pctMinMayor = Math.min(
    Math.floor(pctMaxRestante),
    Math.max(Math.floor(pctCuotaEstablecida) + 1, Math.round(pctCuotaEstablecida) + 1)
  );
  const pctMaxMayor = Math.max(pctMinMayor, Math.floor(pctMaxRestante) - 1);
  const puedePagarMayorPorcentaje =
    !esPagoAlContado && cuotasPosteriores.length > 0 && pctMaxMayor >= pctMinMayor && pctMinMayor < pctMaxRestante;

  // Ajustar porcentaje inicial válido cuando cambia la cuota o se activa el modo mayor porcentaje
  useEffect(() => {
    if (puedePagarMayorPorcentaje) {
      const sugerido = Math.min(
        pctMaxMayor,
        Math.max(pctMinMayor, Math.round((pctMinMayor + pctMaxMayor) / 2))
      );
      setPorcentajeDeseado(sugerido);
    }
  }, [cuotaSeleccionadaId, puedePagarMayorPorcentaje, pctMinMayor, pctMaxMayor]);

  const modoEfectivo: ModoCobroProyecto =
    esPagoAlContado || !usarPagoPersonalizado ? 'cuota_normal' : modoCobro;

  const simulacion = useMemo(() => {
    if (!cuotaSeleccionada) return null;
    return simularReajusteCuotasProyecto(cuotasDelProyecto, cuotaSeleccionada.id, {
      modo: modoEfectivo,
      porcentajeProyectoDeseado:
        modoEfectivo === 'mayor_porcentaje' ? porcentajeDeseado : undefined
    });
  }, [cuotasDelProyecto, cuotaSeleccionada, modoEfectivo, porcentajeDeseado]);

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
    } else {
      setModoCobro(puedePagarMayorPorcentaje ? 'mayor_porcentaje' : 'totalidad');
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
      if (
        isNaN(porcentajeDeseado) ||
        porcentajeDeseado <= pctCuotaEstablecida ||
        porcentajeDeseado >= pctMaxRestante
      ) {
        alert(
          `El porcentaje debe ser mayor al establecido (${pctCuotaEstablecida}%) y menor al saldo restante (${pctMaxRestante}%). Si desea cancelar el 100%, seleccione "Pagar Totalidad".`
        );
        return;
      }
    }

    const cuota = cuotasCXC.find((c) => c.id === cuotaSeleccionadaId);
    marcarCuotaCobrada(cuotaSeleccionadaId, fechaCobro, bancoDestino, referencia, {
      modo: modoEfectivo,
      porcentajeProyectoDeseado:
        modoEfectivo === 'mayor_porcentaje' ? porcentajeDeseado : undefined
    });

    if (onCobroExitoso && cuota) {
      if (esPagoAlContado) {
        onCobroExitoso(`Pago al Contado (100%) — ${proyectoSeleccionado?.nombre || cuota.descripcion}`);
      } else if (modoEfectivo === 'totalidad') {
        onCobroExitoso(`Liquidación Total (100%) — ${proyectoSeleccionado?.nombre || cuota.descripcion}`);
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
          padding: '28px',
          maxWidth: '610px',
          width: '100%',
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
                  : modoEfectivo === 'totalidad'
                  ? `Monto Total a Liquidar (${proyectoSeleccionado?.nombre} — 100% del contrato):`
                  : modoEfectivo === 'mayor_porcentaje'
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
                  Opcional: El cliente pagará más del porcentaje establecido ({Math.round(pctCuotaEstablecida)}%) o la totalidad
                </span>
              </label>

              {usarPagoPersonalizado && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #bae6fd' }}>
                  {/* Selector de modalidad opcional */}
                  <div style={{ display: 'grid', gridTemplateColumns: puedePagarMayorPorcentaje ? '1fr 1fr' : '1fr', gap: '10px', marginBottom: '14px' }}>
                    {puedePagarMayorPorcentaje && (
                      <button
                        type="button"
                        onClick={() => setModoCobro('mayor_porcentaje')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `2px solid ${modoCobro === 'mayor_porcentaje' ? '#0284c7' : '#cbd5e1'}`,
                          backgroundColor: modoCobro === 'mayor_porcentaje' ? '#e0f2fe' : '#ffffff',
                          color: modoCobro === 'mayor_porcentaje' ? '#0369a1' : '#334155',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>Pagar mayor porcentaje</div>
                        <div style={{ fontSize: '0.76rem', fontWeight: 500, marginTop: '2px', color: '#475569' }}>
                          Reacomoda cuotas restantes
                        </div>
                      </button>
                    )}

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
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>Pagar totalidad (100%)</div>
                      <div style={{ fontSize: '0.76rem', fontWeight: 500, marginTop: '2px', color: '#475569' }}>
                        Liquida todo y queda Cobrado
                      </div>
                    </button>
                  </div>

                  {/* Control de porcentaje si eligió mayor porcentaje */}
                  {modoCobro === 'mayor_porcentaje' && puedePagarMayorPorcentaje && (
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '10px' }}>
                        <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b' }}>
                          Porcentaje del contrato a pagar en esta cuota:
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min={pctMinMayor}
                            max={pctMaxMayor}
                            step={1}
                            value={porcentajeDeseado}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              if (!isNaN(val)) {
                                setPorcentajeDeseado(Math.min(pctMaxMayor, Math.max(pctMinMayor, val)));
                              }
                            }}
                            style={{
                              width: '72px',
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
                        min={pctMinMayor}
                        max={pctMaxMayor}
                        step={1}
                        value={porcentajeDeseado}
                        onChange={(e) => setPorcentajeDeseado(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer', accentColor: '#0284c7' }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
                        <span>Mín: {pctMinMayor}% (Cuota actual: {Math.round(pctCuotaEstablecida)}%)</span>
                        <span>Máx parcial: {pctMaxMayor}%</span>
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

                  {/* Vista previa si eligió Liquidar Totalidad */}
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
              {modoEfectivo === 'totalidad' || esPagoAlContado
                ? 'Confirmar Liquidación Total (100%)'
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
