/**
 * GECOP - Tipos y Modelos de Datos del Dominio
 * Módulo Administrativo de Control de Cobros, Facturación y Pagos (TCS C.A.)
 */

export type EstatusCXC = 'Pendiente' | 'Por Facturar' | 'Facturado' | 'Cobrado' | 'Vencido';

export type EstatusCXP = 'Bloqueado por Cobro' | 'Por Pagar' | 'Pagado' | 'Vencido';

export type EstatusEntregable = 'En Proceso' | 'Completado' | 'Retrasado' | 'Pendiente Aprobación';

export type Moneda = 'USD' | 'VES';

export interface Cliente {
  id: string;
  rif: string;
  razonSocial: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono: string;
  activo: boolean;
}

export interface Oportunidad {
  id: string;
  clienteId: string;
  codigoOdoo: string; // Referencia de Odoo Ventas
  titulo: string;
  etapa: 'Calificación' | 'Propuesta' | 'Negociación' | 'Ganada';
  montoEstimadoUSD: number;
}

export interface Cotizacion {
  id: string;
  oportunidadId: string;
  codigoCotizador: string; // Referencia del Cotizador TCS
  fechaEmision: string;
  montoTotalUSD: number;
  costoTercerosEstimadoUSD: number;
  margenEstimadoPorcentaje: number;
}

export interface Proyecto {
  id: string;
  codigo: string; // Ej: PRJ-2026-001
  codigoOdoo?: string; // Referencia Orden de Venta / Oportunidad Odoo (Ej: SO-2026-0142)
  codigoCotizador?: string; // Referencia El Cotizador TCS (Ej: COT-TCS-881)
  modalidadPago?: 'En Cuotas' | 'Al Contado'; // Modalidad financiera acordada en Odoo
  nombre: string;
  clienteId: string;
  cotizacionId: string;
  responsablePMO: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  estado: 'Activo' | 'En Pausa' | 'Completado' | 'Cancelado';
}

export interface EntregablePMO {
  id: string;
  proyectoId: string;
  codigoHito: string; // Ej: HITO-01
  descripcion: string;
  fechaProgramada: string; // ISO date YYYY-MM-DD (Sincronizado con PMO)
  fechaEntregaReal?: string;
  estatus: EstatusEntregable;
  porcentajeAvance: number;
}

export interface CuotaCXC {
  id: string;
  proyectoId: string;
  entregableId: string; // Vinculación PMO estricta
  numeroCuota: number;
  totalCuotas: number;
  descripcion: string;
  montoUSD: number;
  fechaVencimiento: string; // Calculada o derivada de fechaProgramada del entregable
  estatus: EstatusCXC;
  numeroFactura?: string;
  fechaFacturacion?: string;
  fechaCobroEfectivo?: string;
  bancoReceptor?: string;
  referenciaCobro?: string;
  comentarios?: string;
}

export interface CompromisoCXP {
  id: string;
  proyectoId: string;
  cuotaCxcAsociadaId: string; // Candado Financiero: Cuota de cobro que sustenta este pago
  proveedor: string;
  rifProveedor: string;
  concepto: string;
  montoUSD: number;
  fechaVencimientoCalculada: string;
  estatus: EstatusCXP;
  fechaPagoEfectivo?: string;
  soporteComprobante?: string;
}

export interface RegistroPago {
  id: string;
  tipo: 'CXC_COBRO' | 'CXP_PAGO';
  referenciaOperacion: string;
  referenciaDocumentoId: string; // ID de CuotaCXC o CompromisoCXP
  fechaPago: string;
  montoUSD: number;
  montoVES: number;
  tasaBCVAplicada: number;
  bancoOrigen: string;
  bancoDestino: string;
  comprobanteUrl?: string;
}

// Interfaz para el Motor de Proyección Mensual Consolidada
export interface ProyeccionMes {
  mesAno: string; // Formato YYYY-MM (Ej: "2026-11")
  nombreMes: string; // Ej: "Noviembre 2026"
  totalCXCEstimadoUSD: number; // Por cobrar proyectado
  totalCXCCobradoUSD: number;  // Ya cobrado
  totalCXPEstimadoUSD: number; // Por pagar proyectado
  totalCXPPagadoUSD: number;   // Ya pagado
  flujoNetoProyectadoUSD: number; // CXC Total - CXP Total
}

// KPIs Consolidados para el Tablero
export interface KpisFinancieros {
  totalPorCobrarUSD: number;
  totalCobradoMesUSD: number;
  totalPorPagarUSD: number;
  totalPagadoMesUSD: number;
  compromisosBloqueadosCount: number;
  compromisosBloqueadosMontoUSD: number;
  cuotasVencidasCount: number;
  cuotasVencidasMontoUSD: number;
  tasaBCVActual: number;
}
