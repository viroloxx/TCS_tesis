import React, { useState, ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar, TabActiva } from './Sidebar';

interface MainLayoutProps {
  children: (activeTab: TabActiva, setActiveTab: (tab: TabActiva) => void) => ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // REQUISITO ESTRICTO: Menú lateral colapsado por defecto
  const [menuColapsado, setMenuColapsado] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabActiva>('dashboard');

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc', // Fondo general TCS
        display: 'flex',
        flexDirection: 'column',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Header fijo superior de 60px */}
      <Header
        sidebarOpen={!menuColapsado}
        onToggleSidebar={() => setMenuColapsado((prev) => !prev)}
        onNavigate={setActiveTab}
      />

      {/* Contenedor Cuerpo: Sidebar + Área de Contenido */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 60px)' }}>
        <Sidebar
          collapsed={menuColapsado}
          onToggle={() => setMenuColapsado((prev) => !prev)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        <main
          style={{
            flex: 1,
            padding: '30px 36px',
            maxWidth: '1600px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box',
            overflowY: 'auto'
          }}
        >
          {children(activeTab, setActiveTab)}
        </main>
      </div>
    </div>
  );
};
