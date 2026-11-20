import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from './Button';
import { formatearMonedaVE } from '../../utils/formatters';
import { BANCOS_VENEZOLANOS } from '../../data/mockData';

export interface OpcionPagoCXP {
  id: string;
  nombre: string;
  porcentaje: number;
  montoUSD: number;
}

export const OPCIONES_PAGO_CXP: OpcionPagoCXP[] = [
  { id: 'preventa', nombre: 'Preventa', porcentaje: 5, montoUSD: 3200 },
  { id: 'ventas', nombre: 'Ventas', porcentaje: 10, montoUSD: 6400 },
  { id: 'alianzas', nombre: 'Alianzas Estratégicas', porcentaje: 7, montoUSD: 4480 },
  { id: 'directores', nombre: 'Directores', porcentaje: 15, montoUSD: 9600 }
];

interface ModalNuevoPagoProps {
  isOpen: boolean;
  onClose: () => void;
  compromisoInicialId?: string;
  onPagoExitoso?: (proveedor: string, concepto: string) => void;
}

export const ModalNuevoPago: React.FC<ModalNuevoPagoProps> = ({
  isOpen,
  onClose,
  compromisoInicialId,
  onPagoExitoso
}) => {
  const { compromisosCXP, tasaBCV, marcarCompromisoPagado } = useData();
  const [compromisoSeleccionadoId, setCompromisoSeleccionadoId] = useState<string>('');
  const [opcionSeleccionadaId, setOpcionSeleccionadaId] = useState<string>('preventa');

  // Obtener fecha actual en formato local YYYY-MM-DD
  const getFechaHoy = (): string => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fechaHoy = getFechaHoy();
  const [fechaPago, setFechaPago] = useState<string>(fechaHoy);
  const [bancoOrigen, setBancoOrigen] = useState<string>(BANCOS_VENEZOLANOS[0].etiquetaCta);
  const [referencia, setReferencia] = useState<string>('');

  // Sincronizar compromiso y opción al abrir el modal
  useEffect(() => {
    if (isOpen) {
      if (compromisoInicialId) {
        setCompromisoSeleccionadoId(compromisoInicialId);
      } else {
        const primeroLiberado = compromisosCXP.find((c) => c.estatus === 'Por Pagar');
        setCompromisoSeleccionadoId(primeroLiberado ? primeroLiberado.id : '');
      }
      setOpcionSeleccionadaId('preventa');
      setFechaPago(fechaHoy);
      setReferencia('');
    }
  }, [isOpen, compromisoInicialId, compromisosCXP, fechaHoy]);

  if (!isOpen) return null;

  // Filtrar solo los compromisos que el Candado Financiero ha liberado ('Por Pagar')
  const compromisosLiberados = compromisosCXP.filter(
    (c) => c.estatus === 'Por Pagar' || c.id === compromisoSeleccionadoId
  );
  const opcionSeleccionada =
    OPCIONES_PAGO_CXP.find((opc) => opc.id === opcionSeleccionadaId) || OPCIONES_PAGO_CXP[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opcionSeleccionada) {
      alert('Por favor seleccione una opción de pago');
      return;
    }
    if (!fechaPago) {
      alert('Por favor seleccione la fecha en que se realizó el pago');
      return;
    }
    if (fechaPago > fechaHoy) {
      alert('La fecha seleccionada no puede ser posterior a la fecha actual');
      return;
    }
    const idParaMarcar = compromisoSeleccionadoId || compromisosLiberados[0]?.id;
    if (idParaMarcar) {
      marcarCompromisoPagado(idParaMarcar, referencia, fechaPago);
    }
    if (onPagoExitoso) {
      onPagoExitoso(opcionSeleccionada.nombre, `${opcionSeleccionada.porcentaje}%`);
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
            Autorizar Pago a Proveedor (CXP)
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
          {/* Selector de lista de opciones CXP */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              1. Seleccione Compromiso Habilitado por Candado Financiero:
            </label>
            {compromisosLiberados.length === 0 && !compromisoInicialId ? (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '0.90rem'
                }}
              >
                No hay compromisos en estatus <strong>"Por Pagar"</strong> disponibles. Los compromisos existentes están retenidos por el candado financiero hasta que los clientes abonen sus respectivas cuotas.
              </div>
            ) : (
              <select
                value={opcionSeleccionadaId}
                onChange={(e) => setOpcionSeleccionadaId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.92rem',
                  backgroundColor: '#f8fafc',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                {OPCIONES_PAGO_CXP.map((opc) => (
                  <option key={opc.id} value={opc.id}>
                    {opc.nombre} | {opc.porcentaje}% | ${opc.montoUSD.toLocaleString('es-VE')}
                  </option>
                ))}
              </select>
            )}
          </div>

          {opcionSeleccionada && (
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '18px'
              }}
            >
              <div style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                Compromiso Validado ({opcionSeleccionada.porcentaje}% a pagar):
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  color: '#b45309',
                  marginTop: '4px'
                }}
              >
                {formatearMonedaVE(opcionSeleccionada.montoUSD * tasaBCV, 'VES')} (Tasa BCV {formatearMonedaVE(tasaBCV, 'VES')})
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
                Referencia en Dólares: {formatearMonedaVE(opcionSeleccionada.montoUSD, 'USD')} USD
              </div>
            </div>
          )}

          {/* 2. Fecha del Pago */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              2. Fecha en que se realizó el pago:
            </label>
            <input
              type="date"
              value={fechaPago}
              max={fechaHoy}
              onChange={(e) => setFechaPago(e.target.value)}
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
                // Campo no editable mediante teclado; solo seleccionable con el calendario
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

          {/* Banco Emisor */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              3. Banco Emisor del Desembolso:
            </label>
            <select
              value={bancoOrigen}
              onChange={(e) => setBancoOrigen(e.target.value)}
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

          {/* Referencia Operación */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.90rem', color: '#1e293b', marginBottom: '6px' }}>
              4. Referencia de Transferencia / Orden de Pago:
            </label>
            <input
              type="text"
              placeholder="Ej: TRANSF-PROV-7712"
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

          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="md" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={compromisosLiberados.length === 0 && !compromisoInicialId}
            >
              Confirmar Desembolso
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
