import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from './Button';
import { formatearMonedaVE } from '../../utils/formatters';
import { BANCOS_VENEZOLANOS } from '../../data/mockData';

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

  // Determina si una cuota es la única habilitada en turno dentro de su proyecto (no cobrada y sin cuotas previas pendientes)
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

  // Sincronizar cuota preseleccionada y fecha al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (cuotaInicialId && esCuotaHabilitada(cuotaInicialId)) {
        setCuotaSeleccionadaId(cuotaInicialId);
      } else {
        const primeraHabilitada = cuotasCXC.find((c) => esCuotaHabilitada(c.id));
        setCuotaSeleccionadaId(primeraHabilitada ? primeraHabilitada.id : '');
      }
      setFechaCobro(fechaHoy);
      setReferencia('');
    }
  }, [isOpen, cuotaInicialId, cuotasCXC, fechaHoy]);

  if (!isOpen) return null;

  const cuotaSeleccionada = cuotasCXC.find((c) => c.id === cuotaSeleccionadaId);
  const proyectoSeleccionado = proyectos.find((p) => p.id === cuotaSeleccionada?.proyectoId);

  // Si se abrió desde una fila específica, mostrar las cuotas de ese proyecto (o todas) bloqueando las ya pagadas y las que aún no están en turno
  const cuotasDelSelector = cuotasCXC
    .filter((c) => (proyectoSeleccionado ? c.proyectoId === proyectoSeleccionado.id : true))
    .sort((a, b) => {
      if (a.proyectoId !== b.proyectoId) return a.proyectoId.localeCompare(b.proyectoId);
      return a.numeroCuota - b.numeroCuota;
    });

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
    const cuota = cuotasCXC.find((c) => c.id === cuotaSeleccionadaId);
    marcarCuotaCobrada(cuotaSeleccionadaId, fechaCobro, bancoDestino, referencia);
    if (onCobroExitoso && cuota) {
      onCobroExitoso(cuota.descripcion);
    }
    onClose();
  };

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
          maxWidth: '560px',
          width: '100%',
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
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              1. Cuota a Cobrar (las cuotas ya pagadas están bloqueadas):
            </label>
            <select
              value={cuotaSeleccionadaId}
              onChange={(e) => setCuotaSeleccionadaId(e.target.value)}
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

                const etiquetaModalidad =
                  c.totalCuotas === 1
                    ? 'Pago al Contado (1/1)'
                    : `Cuota #${c.numeroCuota} de ${c.totalCuotas}`;

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

          {cuotaSeleccionada && (
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '18px'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                Detalles del Cobro ({proyectoSeleccionado?.nombre} — Cuota #{cuotaSeleccionada.numeroCuota} de {cuotaSeleccionada.totalCuotas}):
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
                {formatearMonedaVE(cuotaSeleccionada.montoUSD * tasaBCV, 'VES')} (Tasa BCV {formatearMonedaVE(tasaBCV, 'VES')})
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
                Referencia en Dólares: {formatearMonedaVE(cuotaSeleccionada.montoUSD, 'USD')} USD
              </div>
            </div>
          )}

          {/* 2. Fecha del Cobro */}
          <div style={{ marginBottom: '18px' }}>
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

          {/* Banco Destino */}
          <div style={{ marginBottom: '18px' }}>
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

          {/* Referencia Bancaria */}
          <div style={{ marginBottom: '24px' }}>
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
              Confirmar y Liberar Candado CXP
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
