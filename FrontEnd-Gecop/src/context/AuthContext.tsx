import React, { createContext, useContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { VortexTransitionType } from '../components/common/TcsVortexLoader';

export interface UsuarioAuth {
  nombre: string;
  correo: string;
  rol: string;
  iniciales: string;
}

export interface TransitionConfig {
  titulo: string;
  subtitulo: string;
  tipo: VortexTransitionType;
}

export interface EjecutarTransicionParams {
  titulo: string;
  subtitulo: string;
  tipo?: VortexTransitionType;
  duracionMs?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: UsuarioAuth | null;
  isTransitioning: boolean;
  transitionConfig: TransitionConfig | null;
  login: (correo: string, contrasena: string) => { success: boolean; error?: string };
  logout: () => void;
  ejecutarTransicion: (config: EjecutarTransicionParams, onComplete?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USUARIO_PREDETERMINADO: UsuarioAuth = {
  nombre: 'Administrador GECOP',
  correo: 'admin@tcs.com.ve',
  rol: 'Finanzas & Cobros',
  iniciales: 'AD'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionConfig, setTransitionConfig] = useState<TransitionConfig | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const limpiarTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => limpiarTimers();
  }, [limpiarTimers]);

  const ejecutarTransicion = useCallback(
    (
      { titulo, subtitulo, tipo = 'crm', duracionMs = 1200 }: EjecutarTransicionParams,
      onComplete?: () => void
    ) => {
      limpiarTimers();
      setTransitionConfig({ titulo, subtitulo, tipo });
      setIsTransitioning(true);

      const timerCambio = setTimeout(() => {
        onComplete?.();
      }, duracionMs);

      const timerCierre = setTimeout(() => {
        setIsTransitioning(false);
      }, duracionMs + 160);

      timersRef.current = [timerCambio, timerCierre];
    },
    [limpiarTimers]
  );

  const login = (correo: string, contrasena: string) => {
    const emailLimpio = correo.trim().toLowerCase();
    const passLimpia = contrasena.trim();

    if (!emailLimpio || !passLimpia) {
      return {
        success: false,
        error: 'Por favor complete tanto el correo electrónico como la contraseña.'
      };
    }

    const nuevoUsuario: UsuarioAuth = {
      ...USUARIO_PREDETERMINADO,
      correo: emailLimpio,
      nombre: emailLimpio.includes('admin') ? 'Administrador GECOP' : 'Usuario Corporativo',
      iniciales: emailLimpio.includes('admin') ? 'AD' : 'TC'
    };

    ejecutarTransicion(
      {
        titulo: 'Iniciando Portal de Gestión (GECOP)',
        subtitulo: 'Sincronizando módulos financieros, Candado CXP y Tasa Oficial BCV...',
        tipo: 'login',
        duracionMs: 1350
      },
      () => {
        setUsuario(nuevoUsuario);
        setIsAuthenticated(true);
      }
    );

    return { success: true };
  };

  const logout = () => {
    ejecutarTransicion(
      {
        titulo: 'Cerrando Sesión Corporativa',
        subtitulo: 'Resguardando estado y finalizando conexión segura con GECOP...',
        tipo: 'logout',
        duracionMs: 1200
      },
      () => {
        setIsAuthenticated(false);
        setUsuario(null);
      }
    );
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        usuario,
        isTransitioning,
        transitionConfig,
        login,
        logout,
        ejecutarTransicion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
