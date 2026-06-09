import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('rickysafe_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });

  const value = useMemo(() => ({
    usuario,
    iniciarSesion(payload) {
      localStorage.setItem('rickysafe_token', payload.token);
      localStorage.setItem('rickysafe_usuario', JSON.stringify(payload.usuario));
      setUsuario(payload.usuario);
    },
    actualizarUsuario(data) {
      const actualizado = { ...usuario, ...data };
      localStorage.setItem('rickysafe_usuario', JSON.stringify(actualizado));
      setUsuario(actualizado);
    },
    cerrarSesion() {
      localStorage.removeItem('rickysafe_token');
      localStorage.removeItem('rickysafe_usuario');
      setUsuario(null);
    }
  }), [usuario]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
