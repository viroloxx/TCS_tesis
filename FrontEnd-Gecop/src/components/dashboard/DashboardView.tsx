import React from 'react';
import { KpiGrid } from './KpiGrid';
import { DashboardCharts } from './DashboardCharts';
import { MonthlyProjection } from './MonthlyProjection';
import { TabActiva } from '../layout/Sidebar';

interface DashboardViewProps {
  onNavigate?: (tab: TabActiva) => void;
  onOpenNuevoCobro?: () => void;
  onOpenNuevoPago?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = () => {
  return (
    <div>
      {/* Cuadrícula de KPIs Financieros */}
      <KpiGrid />

      {/* Motor de Proyección Consolidada Mensual */}
      <MonthlyProjection />

      {/* Gráficos de Lectura Directa: Lo Pagado vs. Lo que Falta */}
      <div style={{ marginTop: '28px' }}>
        <DashboardCharts />
      </div>
    </div>
  );
};
