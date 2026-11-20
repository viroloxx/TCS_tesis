/**
 * Utilidades de Formato para TCS - GECOP
 * Estricta aplicación del estándar venezolano (es-VE) y visualización senior.
 */

/**
 * Formatea un número al estándar monetario venezolano:
 * Separador de miles: "." (punto)
 * Separador decimal: "," (coma)
 * Ejemplos: $1.250.000,50  |  Bs. 425,50
 */
export const formatearMonedaVE = (
  monto: number,
  moneda: 'USD' | 'VES' = 'USD',
  incluirSimbolo: boolean = true
): string => {
  if (isNaN(monto) || monto === null || monto === undefined) {
    monto = 0;
  }

  // Descomponer en parte entera y decimal
  const partes = Math.abs(monto).toFixed(2).split('.');
  const parteEntera = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const parteDecimal = partes[1];
  const signo = monto < 0 ? '-' : '';

  const valorFormateado = `${signo}${parteEntera},${parteDecimal}`;

  if (!incluirSimbolo) return valorFormateado;

  const prefijo = moneda === 'USD' ? '$' : 'Bs. ';
  return `${prefijo}${valorFormateado}`;
};

/**
 * Formatea una fecha ISO (YYYY-MM-DD) al formato DD/MM/YYYY
 */
export const formatearFechaVE = (fechaIso: string): string => {
  if (!fechaIso) return '-';
  const partes = fechaIso.split('-');
  if (partes.length !== 3) return fechaIso;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
};

/**
 * Convierte monto de USD a Bolívares (VES) según tasa BCV
 */
export const convertirUsdAves = (montoUSD: number, tasaBCV: number): number => {
  return Number((montoUSD * tasaBCV).toFixed(2));
};

/**
 * Genera el texto enmascarado si el modo confidencial está activo
 */
export const enmascararMonto = (
  valor: string,
  enmascarado: boolean
): string => {
  if (!enmascarado) return valor;
  return '••••••••';
};
