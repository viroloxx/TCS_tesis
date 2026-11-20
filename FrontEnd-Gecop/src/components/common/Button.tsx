import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  emoji?: string;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  emoji,
  icon,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    if (disabled) {
      return {
        backgroundColor: '#e2e8f0',
        color: '#94a3b8',
        border: '1px solid #cbd5e1',
        cursor: 'not-allowed'
      };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#0f172a',
          color: '#ffffff',
          border: '1px solid #0f172a',
          cursor: 'pointer'
        };
      case 'success':
        return {
          backgroundColor: '#059669',
          color: '#ffffff',
          border: '1px solid #047857',
          cursor: 'pointer'
        };
      case 'danger':
        return {
          backgroundColor: '#ef4444',
          color: '#ffffff',
          border: '1px solid #dc2626',
          cursor: 'pointer'
        };
      case 'secondary':
        return {
          backgroundColor: '#ffffff',
          color: '#0f172a',
          border: '2px solid #cbd5e1',
          cursor: 'pointer'
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: '#334155',
          border: '1px solid transparent',
          cursor: 'pointer'
        };
      default:
        return {};
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '6px 12px',
          fontSize: '0.85rem',
          borderRadius: '8px'
        };
      case 'lg':
        return {
          padding: '14px 24px',
          fontSize: '1.05rem',
          borderRadius: '12px'
        };
      case 'md':
      default:
        return {
          padding: '10px 18px',
          fontSize: '0.92rem',
          borderRadius: '10px'
        };
    }
  };

  return (
    <button
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        transition: 'all 0.15s ease-in-out',
        outline: 'none',
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style
      }}
      {...props}
    >
      {emoji && <span style={{ fontSize: '1.15em', lineHeight: 1 }}>{emoji}</span>}
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
