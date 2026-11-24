/**
 * Utilidad de Impresión y Exportación a PDF con Membrete Corporativo de TCS (GECOP)
 * Genera un documento ejecutivo A4/Carta limpio en ventana dedicada con soporte para:
 * - Guardar como PDF (asignando automáticamente el nombre del archivo PDF)
 * - Imprimir directamente en impresora física o virtual
 */

import { Cliente, Proyecto, CuotaCXC, EntregablePMO } from '../types';
import { formatearMonedaVE, formatearFechaVE } from './formatters';

export interface DatosExportacionResumen {
  proyecto?: Proyecto;
  cliente?: Cliente;
  cuotaActual: CuotaCXC;
  cuotasProyecto: CuotaCXC[];
  entregablesProyecto: EntregablePMO[];
  compromisosLiberadosCount: number;
  tasaBCV: number;
  modo: 'pdf' | 'print';
}

export const exportarOImprimirResumenProyecto = ({
  proyecto,
  cliente,
  cuotaActual,
  cuotasProyecto,
  entregablesProyecto,
  compromisosLiberadosCount,
  tasaBCV,
  modo
}: DatosExportacionResumen): void => {
  const montoTotalProyectoUSD = cuotasProyecto.reduce((acc, c) => acc + c.montoUSD, 0);
  const montoCobradoProyectoUSD = cuotasProyecto
    .filter((c) => c.estatus === 'Cobrado')
    .reduce((acc, c) => acc + c.montoUSD, 0);
  const montoPendienteProyectoUSD = Math.max(0, montoTotalProyectoUSD - montoCobradoProyectoUSD);
  const porcentajePagado =
    montoTotalProyectoUSD > 0
      ? Math.round((montoCobradoProyectoUSD / montoTotalProyectoUSD) * 100)
      : 0;
  const cuotasCobradasCount = cuotasProyecto.filter((c) => c.estatus === 'Cobrado').length;

  const fechaEmision = new Date().toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const codigoPrj = proyecto?.codigo || 'PRJ-TCS';
  const tituloArchivo = `Resumen_GECOP_${codigoPrj}_${proyecto?.codigoOdoo || 'Odoo'}`;

  const filasCuotasHtml = cuotasProyecto
    .map((c) => {
      const hito = entregablesProyecto.find((e) => e.id === c.entregableId);
      const esCobrada = c.estatus === 'Cobrado';
      const esActual = c.id === cuotaActual.id;
      const pctCuota =
        montoTotalProyectoUSD > 0 ? Math.round((c.montoUSD / montoTotalProyectoUSD) * 100) : 0;

      return `
        <tr style="${esActual ? 'background-color: #f0fdf4;' : ''}">
          <td>
            <div style="font-weight: 700; color: #0f172a;">
              Cuota #${c.numeroCuota} de ${c.totalCuotas}
              <span style="font-size: 10.5px; color: #0369a1; font-weight: 700; margin-left: 4px;">(${pctCuota}%)</span>
              ${esActual ? '<span class="tag-actual">En Vista</span>' : ''}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">${c.descripcion}</div>
            <div style="font-size: 11px; color: #1d4ed8; font-weight: 600; margin-top: 2px;">
              ${c.numeroFactura ? `N° ${c.numeroFactura}` : 'Sin factura emitida'} • Vence: ${formatearFechaVE(c.fechaVencimiento)}
            </div>
          </td>
          <td>
            ${
              hito
                ? `<div style="font-weight: 700; color: #1e293b;">${hito.codigoHito}: ${hito.descripcion}</div>
                   <div style="font-size: 11px; color: #475569; margin-top: 3px;">
                     Estatus PMO: <strong>${hito.estatus}</strong> • Avance: <strong>${hito.porcentajeAvance}%</strong>
                   </div>`
                : '<span style="color: #94a3b8;">Hito no asignado</span>'
            }
          </td>
          <td class="mono">
            <div style="font-weight: 700; color: #0f172a; font-size: 12.5px;">
              ${formatearMonedaVE(c.montoUSD * tasaBCV, 'VES')}
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">
              Ref. ${formatearMonedaVE(c.montoUSD, 'USD')}
            </div>
          </td>
          <td>
            <span class="badge ${esCobrada ? 'badge-success' : c.estatus === 'Vencido' ? 'badge-danger' : 'badge-warn'}">
              ${c.estatus}
            </span>
            ${
              esCobrada && c.fechaCobroEfectivo
                ? `<div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 4px;">
                     Pagado: ${formatearFechaVE(c.fechaCobroEfectivo)}
                   </div>`
                : ''
            }
          </td>
        </tr>
      `;
    })
    .join('');

  const htmlDocumento = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>${tituloArchivo}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 14mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: 'Segoe UI', Inter, -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #0f172a;
          background-color: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 12.5px;
          line-height: 1.45;
        }
        .mono {
          font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #0f172a;
          color: #ffffff;
          padding: 16px 22px;
          border-radius: 10px;
          margin-bottom: 18px;
        }
        .header-brand {
          display: flex;
          flex-direction: column;
        }
        .header-brand .company {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .header-brand .portal {
          font-size: 11.5px;
          color: #38bdf8;
          font-weight: 600;
          margin-top: 2px;
        }
        .header-meta {
          text-align: right;
          font-size: 11px;
          color: #cbd5e1;
        }
        .header-meta strong {
          color: #ffffff;
        }
        .title-block {
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
          margin-bottom: 16px;
        }
        .title-block h1 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }
        .title-block p {
          margin: 4px 0 0 0;
          font-size: 12.5px;
          color: #475569;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }
        .box {
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 14px;
          background-color: #f8fafc;
        }
        .box-success {
          border-color: #86efac;
          background-color: #f0fdf4;
        }
        .box-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #1e293b;
          margin-bottom: 10px;
          letter-spacing: 0.03em;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .label {
          font-size: 10.5px;
          color: #64748b;
          display: block;
        }
        .val {
          font-weight: 700;
          color: #0f172a;
          font-size: 12px;
        }
        .progress-card {
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 18px;
          background-color: #ffffff;
        }
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .progress-bar-bg {
          width: 100%;
          height: 11px;
          background-color: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .progress-bar-fill {
          height: 100%;
          background-color: #059669;
          width: ${porcentajePagado}%;
        }
        .totals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background-color: #f8fafc;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #cbd5e1;
          font-size: 12px;
        }
        th {
          background-color: #f1f5f9;
          color: #334155;
          font-weight: 700;
          text-align: left;
          padding: 9px 10px;
          border-bottom: 1.5px solid #cbd5e1;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: top;
        }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
        }
        .badge-success {
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #86efac;
        }
        .badge-warn {
          background-color: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        .badge-danger {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }
        .tag-actual {
          font-size: 10px;
          background-color: #166534;
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 4px;
          margin-left: 4px;
        }
        .footer {
          margin-top: 22px;
          padding-top: 10px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 10.5px;
          color: #64748b;
        }
        .hint-banner {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1e40af;
          padding: 8px 14px;
          border-radius: 8px;
          margin-bottom: 14px;
          font-size: 12px;
          font-weight: 600;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      ${
        modo === 'pdf'
          ? `<div class="hint-banner no-print">
               Para guardar el archivo PDF: En la ventana que se abrirá a continuación, seleccione como Destino <strong>"Guardar como PDF"</strong> y presione Guardar.
             </div>`
          : ''
      }

      <!-- Membrete Corporativo TCS -->
      <div class="header">
        <div class="header-brand">
          <span class="company">Technology Consulting Solutions (TCS), C.A.</span>
          <span class="portal">Portal de Gestión de Cobros y Pagos (GECOP) • Reporte Oficial</span>
        </div>
        <div class="header-meta">
          <div>Fecha de Emisión: <strong>${fechaEmision}</strong></div>
          <div class="mono">Tasa Oficial BCV Aplicada: <strong>${formatearMonedaVE(tasaBCV, 'VES')} / $</strong></div>
        </div>
      </div>

      <!-- Título del Proyecto -->
      <div class="title-block">
        <h1>Resumen de Factura, Cuotas e Hitos del Proyecto</h1>
        <p>
          Código: <strong>${proyecto?.codigo || 'N/A'}</strong>
          ${proyecto?.codigoOdoo ? ` • Orden Odoo: <strong>${proyecto.codigoOdoo}</strong>` : ''}
          — Proyecto: <strong>${proyecto?.nombre || 'N/A'}</strong>
        </p>
      </div>

      <!-- Bloques Superiores: Factura y Cliente -->
      <div class="grid-2">
        <div class="box ${cuotaActual.estatus === 'Cobrado' ? 'box-success' : ''}">
          <div class="box-title">
            ${
              cuotaActual.estatus === 'Cobrado'
                ? '✓ Detalle de Factura Verificada'
                : `Cuota en Turno (#${cuotaActual.numeroCuota} de ${cuotaActual.totalCuotas})`
            }
          </div>
          <div class="info-grid">
            <div>
              <span class="label">N° de Factura:</span>
              <span class="val mono">${cuotaActual.numeroFactura || 'Pendiente por emitir'}</span>
            </div>
            <div>
              <span class="label">Fecha Facturación / Venc.:</span>
              <span class="val">${formatearFechaVE(cuotaActual.fechaFacturacion || cuotaActual.fechaVencimiento)}</span>
            </div>
            <div>
              <span class="label">${cuotaActual.estatus === 'Cobrado' ? 'Fecha Cobro Efectivo:' : 'Estatus del Cobro:'}</span>
              <span class="val">${
                cuotaActual.estatus === 'Cobrado'
                  ? formatearFechaVE(cuotaActual.fechaCobroEfectivo || cuotaActual.fechaVencimiento)
                  : `Por cobrar (${cuotaActual.estatus})`
              }</span>
            </div>
            <div>
              <span class="label">Referencia / Comprobante:</span>
              <span class="val mono">${
                cuotaActual.estatus === 'Cobrado'
                  ? cuotaActual.referenciaCobro || 'REF-VERIFICADA'
                  : 'En espera de abono'
              }</span>
            </div>
          </div>
          <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #94a3b8;">
            <span class="label">Monto de la Cuota (#${cuotaActual.numeroCuota} de ${cuotaActual.totalCuotas}):</span>
            <div class="mono" style="font-size: 15px; font-weight: 800; color: #059669; margin-top: 2px;">
              ${formatearMonedaVE(cuotaActual.montoUSD * tasaBCV, 'VES')}
            </div>
            <div class="mono" style="font-size: 11.5px; color: #475569; font-weight: 600;">
              Ref. ${formatearMonedaVE(cuotaActual.montoUSD, 'USD')}
            </div>
            ${
              cuotaActual.bancoReceptor
                ? `<div style="font-size: 11px; color: #166534; margin-top: 3px; font-weight: 600;">
                     Cuenta Receptora: ${cuotaActual.bancoReceptor}
                   </div>`
                : ''
            }
          </div>
        </div>

        <div class="box">
          <div class="box-title">Información Importante del Cliente y PMO</div>
          <div style="display: flex; flex-direction: column; gap: 7px;">
            <div>
              <span class="label">Razón Social & RIF:</span>
              <span class="val">${cliente?.razonSocial || 'N/A'} (${cliente?.rif || 'N/A'})</span>
            </div>
            <div>
              <span class="label">Contacto Autorizado:</span>
              <span class="val">${cliente?.contactoNombre || 'N/A'} • ${cliente?.contactoEmail || ''}</span>
            </div>
            <div class="info-grid">
              <div>
                <span class="label">Responsable PMO:</span>
                <span class="val">${proyecto?.responsablePMO || 'N/A'}</span>
              </div>
              <div>
                <span class="label">Candado CXP Liberado:</span>
                <span class="val" style="color: #059669;">${compromisosLiberadosCount} compromiso(s)</span>
              </div>
            </div>
            ${
              cuotaActual.comentarios
                ? `<div style="font-size: 11px; color: #334155; background: #ffffff; padding: 6px 8px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 2px;">
                     <strong>Observación:</strong> ${cuotaActual.comentarios}
                   </div>`
                : ''
            }
          </div>
        </div>
      </div>

      <!-- Estado General de Recaudación -->
      <div class="progress-card">
        <div class="progress-header">
          <div>
            <strong style="font-size: 13px;">Estado General de Recaudación del Proyecto</strong>
            <span style="color: #64748b; font-size: 11.5px; margin-left: 6px;">
              (${cuotasCobradasCount} de ${cuotasProyecto.length} cuotas pagadas)
            </span>
          </div>
          <span class="badge badge-success mono">${porcentajePagado}% Pagado</span>
        </div>

        <div class="progress-bar-bg">
          <div class="progress-bar-fill"></div>
        </div>

        <div class="totals-grid">
          <div>
            <span class="label" style="font-weight: 700; text-transform: uppercase;">Total Contrato</span>
            <div class="mono" style="font-weight: 800; font-size: 13.5px; color: #0f172a;">
              ${formatearMonedaVE(montoTotalProyectoUSD * tasaBCV, 'VES')}
            </div>
            <div class="mono" style="font-size: 11px; color: #64748b; font-weight: 600;">
              Ref. ${formatearMonedaVE(montoTotalProyectoUSD, 'USD')}
            </div>
          </div>

          <div>
            <span class="label" style="font-weight: 700; text-transform: uppercase; color: #059669;">Total Pagado / Cobrado</span>
            <div class="mono" style="font-weight: 800; font-size: 13.5px; color: #059669;">
              ${formatearMonedaVE(montoCobradoProyectoUSD * tasaBCV, 'VES')}
            </div>
            <div class="mono" style="font-size: 11px; color: #047857; font-weight: 600;">
              Ref. ${formatearMonedaVE(montoCobradoProyectoUSD, 'USD')}
            </div>
          </div>

          <div>
            <span class="label" style="font-weight: 700; text-transform: uppercase; color: #d97706;">Por Entrar desde Odoo (Faltante)</span>
            <div class="mono" style="font-weight: 800; font-size: 13.5px; color: #d97706;">
              ${formatearMonedaVE(montoPendienteProyectoUSD * tasaBCV, 'VES')}
            </div>
            <div class="mono" style="font-size: 11px; color: #b45309; font-weight: 600;">
              Ref. ${formatearMonedaVE(montoPendienteProyectoUSD, 'USD')}
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Desglose de Cuotas e Hitos -->
      <h3 style="margin: 0 0 8px 0; font-size: 13.5px; font-weight: 800; color: #0f172a;">
        Desglose de Cuotas Pagadas e Hitos PMO del Proyecto
      </h3>
      <table>
        <thead>
          <tr>
            <th>Cuota / Factura</th>
            <th>Hito PMO & Avance</th>
            <th>Monto Cuota (VES / Ref. USD)</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          ${filasCuotasHtml}
        </tbody>
      </table>

      <!-- Pie de página institucional -->
      <div class="footer">
        <span>Technology Consulting Solutions (TCS), C.A. • Ecosistema GECOP (Odoo + El Cotizador + PMO)</span>
        <span>Documento generado el ${fechaEmision}</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 250);
        };
      </script>
    </body>
    </html>
  `;

  const ventanaImpresion = window.open('', '_blank', 'width=920,height=780');
  if (!ventanaImpresion) {
    alert('Por favor permita las ventanas emergentes en su navegador para generar el PDF o imprimir.');
    return;
  }

  ventanaImpresion.document.open();
  ventanaImpresion.document.write(htmlDocumento);
  ventanaImpresion.document.close();
};
