import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { perfil } from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('rickysafe_usuario');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      localStorage.removeItem('rickysafe_usuario');
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('rickysafe_token');
    if (!token) {
      setCargando(false);
      return;
    }
    perfil()
      .then(({ data }) => {
        const next = { ...data.usuario, debe_cambiar_contrasena: usuario?.debe_cambiar_contrasena || false };
        localStorage.setItem('rickysafe_usuario', JSON.stringify(next));
        setUsuario(next);
      })
      .catch(() => {
        localStorage.removeItem('rickysafe_token');
        localStorage.removeItem('rickysafe_usuario');
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const value = useMemo(() => ({
    usuario,
    cargando,
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
  }), [usuario, cargando]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
