/**
 * Datos Iniciales Mock para TCS - GECOP
 * Integración conceptual: Odoo Ventas + El Cotizador + PMO Propia
 */

import { Cliente, Proyecto, EntregablePMO, CuotaCXC, CompromisoCXP } from '../types';

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-01',
    rif: 'J-00012345-6',
    razonSocial: 'BANCO MERCANTIL C.A.',
    contactoNombre: 'Ing. Carlos Mendoza',
    contactoEmail: 'cmendoza@bancomercantil.com',
    contactoTelefono: '+58 212 503-1111',
    activo: true
  },
  {
    id: 'cli-02',
    rif: 'J-00098765-4',
    razonSocial: 'FARMATODO VENEZUELA S.A.',
    contactoNombre: 'Lic. Elena Salcedo',
    contactoEmail: 'esalcedo@farmatodo.com',
    contactoTelefono: '+58 212 949-8800',
    activo: true
  },
  {
    id: 'cli-03',
    rif: 'J-30456789-1',
    razonSocial: 'EMPRESAS POLAR C.A.',
    contactoNombre: 'Ing. Roberto Silva',
    contactoEmail: 'rsilva@empresaspolar.com',
    contactoTelefono: '+58 212 202-3333',
    activo: true
  },
  {
    id: 'cli-04',
    rif: 'J-31298450-8',
    razonSocial: 'CORPORACION DIGITEL C.A.',
    contactoNombre: 'Ing. Mariana Gomez',
    contactoEmail: 'mgomez@digitel.com.ve',
    contactoTelefono: '+58 412 999-0000',
    activo: true
  }
];

export const INITIAL_PROYECTOS: Proyecto[] = [
  {
    id: 'prj-01',
    codigo: 'PRJ-2026-001',
    codigoOdoo: 'SO-2026-0142',
    codigoCotizador: 'COT-TCS-0881',
    modalidadPago: 'En Cuotas',
    nombre: 'Migración Core Bancario Cloud AWS',
    clienteId: 'cli-01',
    cotizacionId: 'cot-01',
    responsablePMO: 'PMP Argenis Méndez',
    fechaInicio: '2026-09-01',
    fechaFinEstimada: '2027-02-28',
    estado: 'Activo'
  },
  {
    id: 'prj-02',
    codigo: 'PRJ-2026-002',
    codigoOdoo: 'SO-2026-0179',
    codigoCotizador: 'COT-TCS-0914',
    modalidadPago: 'En Cuotas',
    nombre: 'Implementación Omnicanalidad POS',
    clienteId: 'cli-02',
    cotizacionId: 'cot-02',
    responsablePMO: 'PMP Laura Briceño',
    fechaInicio: '2026-10-15',
    fechaFinEstimada: '2027-03-31',
    estado: 'Activo'
  },
  {
    id: 'prj-03',
    codigo: 'PRJ-2026-003',
    codigoOdoo: 'SO-2026-0115',
    codigoCotizador: 'COT-TCS-0840',
    modalidadPago: 'En Cuotas',
    nombre: 'Modernización Data Lake Snowflake',
    clienteId: 'cli-03',
    cotizacionId: 'cot-03',
    responsablePMO: 'PMP Daniel Quintero',
    fechaInicio: '2026-08-01',
    fechaFinEstimada: '2026-12-15',
    estado: 'Activo'
  },
  {
    id: 'prj-04',
    codigo: 'PRJ-2026-004',
    codigoOdoo: 'SO-2026-0204',
    codigoCotizador: 'COT-TCS-0952',
    modalidadPago: 'Al Contado',
    nombre: 'Auditoría Ciberseguridad Red 5G',
    clienteId: 'cli-04',
    cotizacionId: 'cot-04',
    responsablePMO: 'PMP Argenis Méndez',
    fechaInicio: '2026-11-05',
    fechaFinEstimada: '2026-12-10',
    estado: 'Activo'
  }
];

export const INITIAL_ENTREGABLES: EntregablePMO[] = [
  // PRJ-01
  {
    id: 'ent-01',
    proyectoId: 'prj-01',
    codigoHito: 'HITO-01',
    descripcion: 'Diseño de Arquitectura y Landing Zone AWS',
    fechaProgramada: '2026-10-15',
    fechaEntregaReal: '2026-10-14',
    estatus: 'Completado',
    porcentajeAvance: 100
  },
  {
    id: 'ent-02',
    proyectoId: 'prj-01',
    codigoHito: 'HITO-02',
    descripcion: 'Migración Piloto Base de Datos Transaccional',
    fechaProgramada: '2026-11-20',
    estatus: 'En Proceso',
    porcentajeAvance: 85
  },
  {
    id: 'ent-03',
    proyectoId: 'prj-01',
    codigoHito: 'HITO-03',
    descripcion: 'Pase a Producción y Pruebas de Carga',
    fechaProgramada: '2026-12-18',
    estatus: 'En Proceso',
    porcentajeAvance: 20
  },
  // PRJ-02
  {
    id: 'ent-04',
    proyectoId: 'prj-02',
    codigoHito: 'HITO-01',
    descripcion: 'Levantamiento e Integración API Pasarelas',
    fechaProgramada: '2026-11-10',
    fechaEntregaReal: '2026-11-09',
    estatus: 'Completado',
    porcentajeAvance: 100
  },
  {
    id: 'ent-05',
    proyectoId: 'prj-02',
    codigoHito: 'HITO-02',
    descripcion: 'Despliegue Piloto en 15 Sucursales Gran Caracas',
    fechaProgramada: '2026-12-05',
    estatus: 'En Proceso',
    porcentajeAvance: 40
  },
  // PRJ-03
  {
    id: 'ent-06',
    proyectoId: 'prj-03',
    codigoHito: 'HITO-01',
    descripcion: 'Ingesta de Fuentes Legadas y Limpieza ETL',
    fechaProgramada: '2026-10-01',
    fechaEntregaReal: '2026-10-05',
    estatus: 'Completado',
    porcentajeAvance: 100
  },
  {
    id: 'ent-07',
    proyectoId: 'prj-03',
    codigoHito: 'HITO-02',
    descripcion: 'Modelado Dimensional y Reportes Ejecutivos',
    fechaProgramada: '2026-11-30',
    estatus: 'En Proceso',
    porcentajeAvance: 70
  },
  // PRJ-04 (Pago al Contado)
  {
    id: 'ent-08',
    proyectoId: 'prj-04',
    codigoHito: 'HITO-01',
    descripcion: 'Certificación Integral de Seguridad y Pentesting 5G',
    fechaProgramada: '2026-11-25',
    estatus: 'En Proceso',
    porcentajeAvance: 90
  }
];

export const INITIAL_CUOTAS_CXC: CuotaCXC[] = [
  // PRJ-01 Cuotas
  {
    id: 'cxc-01',
    proyectoId: 'prj-01',
    entregableId: 'ent-01',
    numeroCuota: 1,
    totalCuotas: 3,
    descripcion: 'Anticipo y Aprobación de Arquitectura Cloud',
    montoUSD: 24500.00,
    fechaVencimiento: '2026-10-15',
    estatus: 'Cobrado',
    numeroFactura: 'FAC-2026-0842',
    fechaFacturacion: '2026-10-16',
    fechaCobroEfectivo: '2026-10-28',
    bancoReceptor: 'Banco Mercantil - Cta Cte',
    referenciaCobro: 'REF-884120-BM',
    comentarios: 'Pago recibido por transferencia internacional'
  },
  {
    id: 'cxc-02',
    proyectoId: 'prj-01',
    entregableId: 'ent-02',
    numeroCuota: 2,
    totalCuotas: 3,
    descripcion: 'Hito 2: Validación Piloto BD Transaccional',
    montoUSD: 36750.00,
    fechaVencimiento: '2026-11-20',
    estatus: 'Facturado',
    numeroFactura: 'FAC-2026-0899',
    fechaFacturacion: '2026-11-12',
    comentarios: 'Factura entregada a administración del cliente'
  },
  {
    id: 'cxc-03',
    proyectoId: 'prj-01',
    entregableId: 'ent-03',
    numeroCuota: 3,
    totalCuotas: 3,
    descripcion: 'Hito 3: Pase Final a Producción y Cierre',
    montoUSD: 24500.00,
    fechaVencimiento: '2026-12-18',
    estatus: 'Pendiente',
    comentarios: 'Sujeto a culminación de pruebas de estrés'
  },
  // PRJ-02 Cuotas
  {
    id: 'cxc-04',
    proyectoId: 'prj-02',
    entregableId: 'ent-04',
    numeroCuota: 1,
    totalCuotas: 2,
    descripcion: 'Fase 1: API de Pasarelas e Integración',
    montoUSD: 18200.00,
    fechaVencimiento: '2026-11-10',
    estatus: 'Cobrado',
    numeroFactura: 'FAC-2026-0870',
    fechaFacturacion: '2026-11-10',
    fechaCobroEfectivo: '2026-11-15',
    bancoReceptor: 'Banco Nacional de Crédito (BNC)',
    referenciaCobro: 'TRANSF-BNC-772104',
    comentarios: 'Cobro verificado en cuenta BNC'
  },
  {
    id: 'cxc-05',
    proyectoId: 'prj-02',
    entregableId: 'ent-05',
    numeroCuota: 2,
    totalCuotas: 2,
    descripcion: 'Fase 2: Despliegue en 15 Sucursales',
    montoUSD: 27300.00,
    fechaVencimiento: '2026-12-05',
    estatus: 'Por Facturar',
    comentarios: 'Pendiente acta de entrega de hardware en tiendas'
  },
  // PRJ-03 Cuotas
  {
    id: 'cxc-06',
    proyectoId: 'prj-03',
    entregableId: 'ent-06',
    numeroCuota: 1,
    totalCuotas: 2,
    descripcion: 'Entregable 1: Ingesta ETL y Data Lake Base',
    montoUSD: 31000.00,
    fechaVencimiento: '2026-10-25',
    estatus: 'Vencido',
    numeroFactura: 'FAC-2026-0815',
    fechaFacturacion: '2026-10-02',
    comentarios: 'Alerta: 24 días de retraso en pago. En gestión de cobro'
  },
  {
    id: 'cxc-07',
    proyectoId: 'prj-03',
    entregableId: 'ent-07',
    numeroCuota: 2,
    totalCuotas: 2,
    descripcion: 'Entregable 2: Tableros BI y Entrega Final',
    montoUSD: 15500.00,
    fechaVencimiento: '2026-11-30',
    estatus: 'Pendiente',
    comentarios: 'Programado según cronograma PMO'
  },
  // PRJ-04 Cuota Única (Pago al Contado)
  {
    id: 'cxc-08',
    proyectoId: 'prj-04',
    entregableId: 'ent-08',
    numeroCuota: 1,
    totalCuotas: 1,
    descripcion: 'Pago Único al Contado (100%): Auditoría Ciberseguridad 5G',
    montoUSD: 22000.00,
    fechaVencimiento: '2026-11-25',
    estatus: 'Facturado',
    numeroFactura: 'FAC-2026-0912',
    fechaFacturacion: '2026-11-08',
    comentarios: 'Modalidad Pago al Contado — Liquidación total en una sola cuota'
  }
];

export const INITIAL_COMPROMISOS_CXP: CompromisoCXP[] = [
  // Vinculado a cxc-01 (Cobrado -> DEBE estar 'Por Pagar' o 'Pagado')
  {
    id: 'cxp-01',
    proyectoId: 'prj-01',
    cuotaCxcAsociadaId: 'cxc-01',
    proveedor: 'Cloud Tech Consulting LLC',
    rifProveedor: 'J-50123999-0',
    concepto: 'Honorarios Especialista Senior en AWS Landing Zone',
    montoUSD: 7500.00,
    fechaVencimientoCalculada: '2026-11-05',
    estatus: 'Pagado',
    fechaPagoEfectivo: '2026-11-04',
    soporteComprobante: 'TRANSF-W-9921'
  },
  {
    id: 'cxp-02',
    proyectoId: 'prj-01',
    cuotaCxcAsociadaId: 'cxc-01',
    proveedor: 'Licenciamiento & Software Latam',
    rifProveedor: 'J-40998877-1',
    concepto: 'Suscripción Herramientas Terraform Cloud Enterprise',
    montoUSD: 3200.00,
    fechaVencimientoCalculada: '2026-11-15',
    estatus: 'Por Pagar', // LIBERADO porque cxc-01 es 'Cobrado'
    soporteComprobante: 'ORD-PAGO-0441'
  },
  // Vinculado a cxc-02 (Facturado -> Candado Financiero: DEBE estar 'Bloqueado por Cobro')
  {
    id: 'cxp-03',
    proyectoId: 'prj-01',
    cuotaCxcAsociadaId: 'cxc-02',
    proveedor: 'Database Solutions Andina',
    rifProveedor: 'J-31998811-2',
    concepto: 'Servicios de Replicación de Base de Datos Oracle a Aurora',
    montoUSD: 12500.00,
    fechaVencimientoCalculada: '2026-11-28',
    estatus: 'Bloqueado por Cobro' // CANDADO: Esperando cobro de cxc-02
  },
  // Vinculado a cxc-04 (Cobrado -> LIBERADO para pagar)
  {
    id: 'cxp-04',
    proyectoId: 'prj-02',
    cuotaCxcAsociadaId: 'cxc-04',
    proveedor: 'SmartPOS Hardware C.A.',
    rifProveedor: 'J-29881234-5',
    concepto: 'Lote de Dispositivos POS de Prueba y Encriptación',
    montoUSD: 5400.00,
    fechaVencimientoCalculada: '2026-11-22',
    estatus: 'Por Pagar' // LIBERADO porque cxc-04 es 'Cobrado'
  },
  // Vinculado a cxc-05 (Por Facturar -> Bloqueado)
  {
    id: 'cxp-05',
    proyectoId: 'prj-02',
    cuotaCxcAsociadaId: 'cxc-05',
    proveedor: 'Servicios Logísticos Nacionales',
    rifProveedor: 'J-30441122-3',
    concepto: 'Transporte Blindado y Distribución de Equipos en Tiendas',
    montoUSD: 4100.00,
    fechaVencimientoCalculada: '2026-12-10',
    estatus: 'Bloqueado por Cobro' // CANDADO
  },
  // Vinculado a cxc-06 (Vencido -> Bloqueado)
  {
    id: 'cxp-06',
    proyectoId: 'prj-03',
    cuotaCxcAsociadaId: 'cxc-06',
    proveedor: 'Data Quality Partners',
    rifProveedor: 'J-41009988-7',
    concepto: 'Consultoría Especializada en Limpieza de Datos Snowflake',
    montoUSD: 9800.00,
    fechaVencimientoCalculada: '2026-11-12',
    estatus: 'Bloqueado por Cobro' // CANDADO: Retenido porque el cliente debe la cuota
  }
];

// Tasa BCV Oficial de Referencia (Bs./USD)
export const TASA_BCV_INICIAL = 49.85;

// Lista Oficial de Bancos Venezolanos (Mínimo 10 instituciones para selectores bancarios)
export interface BancoVenezolano {
  codigo: string;
  nombre: string;
  etiquetaCta: string;
}

export const BANCOS_VENEZOLANOS: BancoVenezolano[] = [
  {
    codigo: '0105',
    nombre: 'Banco Mercantil C.A.',
    etiquetaCta: '0105 - Banco Mercantil C.A. (Cta. Corriente Corporativa)'
  },
  {
    codigo: '0134',
    nombre: 'Banesco Banco Universal',
    etiquetaCta: '0134 - Banesco Banco Universal (Cta. Custodia USD/VES)'
  },
  {
    codigo: '0108',
    nombre: 'BBVA Provincial',
    etiquetaCta: '0108 - BBVA Provincial (Cta. Corriente Empresarial)'
  },
  {
    codigo: '0191',
    nombre: 'Banco Nacional de Crédito (BNC)',
    etiquetaCta: '0191 - Banco Nacional de Crédito (BNC Cta. Operaciones)'
  },
  {
    codigo: '0102',
    nombre: 'Banco de Venezuela (BDV)',
    etiquetaCta: '0102 - Banco de Venezuela (BDV Cta. Recaudación)'
  },
  {
    codigo: '0114',
    nombre: 'Bancaribe',
    etiquetaCta: '0114 - Bancaribe (Cta. Corriente Corporativa)'
  },
  {
    codigo: '0115',
    nombre: 'Banco Exterior',
    etiquetaCta: '0115 - Banco Exterior (Cta. Empresarial)'
  },
  {
    codigo: '0172',
    nombre: 'Bancamiga Banco Universal',
    etiquetaCta: '0172 - Bancamiga Banco Universal (Cta. Divisas / Bolívar)'
  },
  {
    codigo: '0174',
    nombre: 'Banplus Banco Universal',
    etiquetaCta: '0174 - Banplus Banco Universal (Cta. Tesorería)'
  },
  {
    codigo: '0151',
    nombre: 'BFC Banco Fondo Común',
    etiquetaCta: '0151 - BFC Banco Fondo Común (Cta. Corriente)'
  },
  {
    codigo: '0138',
    nombre: 'Banco Plaza',
    etiquetaCta: '0138 - Banco Plaza (Cta. Corporativa)'
  },
  {
    codigo: '0156',
    nombre: '100% Banco',
    etiquetaCta: '0156 - 100% Banco (Cta. Operaciones)'
  },
  {
    codigo: '0163',
    nombre: 'Banco del Tesoro',
    etiquetaCta: '0163 - Banco del Tesoro (Cta. Recaudadora)'
  },
  {
    codigo: '0128',
    nombre: 'Banco Caroní',
    etiquetaCta: '0128 - Banco Caroní (Cta. Corriente)'
  },
  {
    codigo: '0171',
    nombre: 'Banco Activo',
    etiquetaCta: '0171 - Banco Activo (Cta. Empresarial)'
  }
];
