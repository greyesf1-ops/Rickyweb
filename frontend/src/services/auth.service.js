import api from './api';

export function login(credenciales) {
  return api.post('/auth/login', credenciales);
}

export function perfil() {
  return api.get('/auth/perfil');
}

export function cambiarContrasena(payload) {
  return api.post('/auth/cambiar-contrasena', payload);
}
