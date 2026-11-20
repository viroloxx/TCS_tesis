import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MaskingProvider } from './context/MaskingContext';
import { DataProvider } from './context/DataContext';
import { LoginView } from './components/auth/LoginView';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { MonthlyProjection } from './components/dashboard/MonthlyProjection';
import { CxcTable } from './components/cxc/CxcTable';
import { CxpTable } from './components/cxp/CxpTable';
import { PmoSync } from './components/pmo/PmoSync';
import { ModalNuevoCobro } from './components/common/ModalNuevoCobro';
import { ModalNuevoPago } from './components/common/ModalNuevoPago';

export const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [modalCobroOpen, setModalCobroOpen] = useState(false);
  const [modalPagoOpen, setModalPagoOpen] = useState(false);

  // Si no está autenticado, muestra la pantalla de inicio de sesión institucional
  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <>
      <MainLayout>
        {(activeTab, setActiveTab) => {
          switch (activeTab) {
            case 'dashboard':
              return (
                <DashboardView
                  onNavigate={setActiveTab}
                  onOpenNuevoCobro={() => setModalCobroOpen(true)}
                  onOpenNuevoPago={() => setModalPagoOpen(true)}
                />
              );
            case 'proyeccion':
              return (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.4rem', color: '#0f172a' }}>
                      Reporte de Proyección Mensual Consolidada
                    </h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.90rem' }}>
                      Vista proyectada de ingresos (CXC) vs egresos (CXP) distribuidos mensualmente.
                    </p>
                  </div>
                  <MonthlyProjection />
                </div>
              );
            case 'cxc':
              return <CxcTable />;
            case 'cxp':
              return <CxpTable />;
            case 'pmo':
              return <PmoSync />;
            default:
              return (
                <DashboardView
                  onNavigate={setActiveTab}
                  onOpenNuevoCobro={() => setModalCobroOpen(true)}
                  onOpenNuevoPago={() => setModalPagoOpen(true)}
                />
              );
          }
        }}
      </MainLayout>

      {/* Modales guiados para usuario senior */}
      <ModalNuevoCobro
        isOpen={modalCobroOpen}
        onClose={() => setModalCobroOpen(false)}
      />
      <ModalNuevoPago
        isOpen={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MaskingProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </MaskingProvider>
    </AuthProvider>
  );
};

export default App;
