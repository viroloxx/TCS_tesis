import React from 'react';
import { useData } from '../../context/DataContext';
import { KpiCard } from './KpiCard';

export const KpiGrid: React.FC = () => {
  const { kpis, tasaBCV } = useData();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}
    >
      {/* 1. Total por Cobrar (CXC Activo) */}
      <KpiCard
        titulo="Total por Cobrar (CXC)"
        montoUSD={kpis.totalPorCobrarUSD}
        tasaBCV={tasaBCV}
        badgeTexto="Activo"
        badgeColor="#2563eb"
        bordeColor="#2563eb"
        detalleTexto="Pendiente y facturado"
      />

      {/* 2. Cobrado en el Mes */}
      <KpiCard
        titulo="Cobrado en el Mes"
        montoUSD={kpis.totalCobradoMesUSD}
        tasaBCV={tasaBCV}
        badgeTexto="Efectivo Recibido"
        badgeColor="#059669"
        bordeColor="#059669"
        detalleTexto="Ingresos validados"
      />

      {/* 3. Total por Pagar (CXP Liberado) */}
      <KpiCard
        titulo="Total por Pagar (CXP)"
        montoUSD={kpis.totalPorPagarUSD}
        tasaBCV={tasaBCV}
        badgeTexto="Compromiso Aprobado"
        badgeColor="#d97706"
        bordeColor="#d97706"
        detalleTexto="Sustentado por cobro"
      />

      {/* 4. Candado Financiero: Bloqueados por Cobro */}
      <KpiCard
        titulo="Bloqueados por Cobro"
        montoUSD={kpis.compromisosBloqueadosMontoUSD}
        tasaBCV={tasaBCV}
        badgeTexto={`${kpis.compromisosBloqueadosCount} retenciones`}
        badgeColor="#ef4444"
        bordeColor="#ef4444"
        esAlerta={kpis.compromisosBloqueadosCount > 0}
        detalleTexto="Candado Financiero TCS"
      />
    </div>
  );
};
