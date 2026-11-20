import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UsuarioAuth {
  nombre: string;
  correo: string;
  rol: string;
  iniciales: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: UsuarioAuth | null;
  login: (correo: string, contrasena: string) => { success: boolean; error?: string };
  logout: () => void;
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

  const login = (correo: string, contrasena: string) => {
    const emailLimpio = correo.trim().toLowerCase();
    const passLimpia = contrasena.trim();

    if (!emailLimpio || !passLimpia) {
      return {
        success: false,
        error: 'Por favor complete tanto el correo electrónico como la contraseña.'
      };
    }

    // Permitir acceso con credenciales corporativas o demo
    setIsAuthenticated(true);
    setUsuario({
      ...USUARIO_PREDETERMINADO,
      correo: emailLimpio,
      nombre: emailLimpio.includes('admin') ? 'Administrador GECOP' : 'Usuario Corporativo',
      iniciales: emailLimpio.includes('admin') ? 'AD' : 'TC'
    });

    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        usuario,
        login,
        logout
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
