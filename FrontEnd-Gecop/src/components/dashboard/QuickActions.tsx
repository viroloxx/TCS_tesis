import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TabActiva } from '../layout/Sidebar';

interface QuickActionsProps {
  onNavigate: (tab: TabActiva) => void;
  onOpenNuevoCobro: () => void;
  onOpenNuevoPago: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNavigate,
  onOpenNuevoCobro,
  onOpenNuevoPago
}) => {
  return (
    <Card
      title="⚡ Acciones Administrativas Rápidas"
      subtitle="Accesos directos guiados con botones de alta visibilidad"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <Button
          variant="success"
          size="lg"
          emoji="📥"
          onClick={onOpenNuevoCobro}
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          Registrar Cobro Recibido
        </Button>

        <Button
          variant="primary"
          size="lg"
          emoji="💳"
          onClick={onOpenNuevoPago}
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          Autorizar Pago a Proveedor
        </Button>

        <Button
          variant="secondary"
          size="lg"
          emoji="⏱️"
          onClick={() => onNavigate('pmo')}
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          Sincronizar Cronograma PMO
        </Button>

        <Button
          variant="secondary"
          size="lg"
          emoji="📈"
          onClick={() => onNavigate('proyeccion')}
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          Ver Proyección Consolidada
        </Button>
      </div>
    </Card>
  );
};
