import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  icon
}) => {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: '#ecfdf5',
          text: '#065f46',
          border: '#a7f3d0',
          dot: '#059669'
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          text: '#92400e',
          border: '#fde68a',
          dot: '#d97706'
        };
      case 'danger':
        return {
          bg: '#fef2f2',
          text: '#991b1b',
          border: '#fecaca',
          dot: '#ef4444'
        };
      case 'info':
        return {
          bg: '#eff6ff',
          text: '#1e40af',
          border: '#bfdbfe',
          dot: '#2563eb'
        };
      default:
        return {
          bg: '#f1f5f9',
          text: '#334155',
          border: '#cbd5e1',
          dot: '#64748b'
        };
    }
  };

  const colors = getColors();

  const sizeStyles = {
    sm: { padding: '3px 8px', fontSize: '0.80rem' },
    md: { padding: '5px 12px', fontSize: '0.88rem' },
    lg: { padding: '7px 16px', fontSize: '0.95rem' }
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '9999px',
        fontWeight: 600,
        lineHeight: 1.2,
        ...sizeStyles
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: colors.dot,
          flexShrink: 0
        }}
      />
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </span>
  );
};
