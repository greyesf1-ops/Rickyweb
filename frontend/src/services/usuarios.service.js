import api from './api';

export function listarUsuarios() {
  return api.get('/usuarios');
}

export function crearUsuario(payload) {
  return api.post('/usuarios', payload);
}

export function cambiarEstadoUsuario(id, estado) {
  return api.put(`/usuarios/${id}/estado`, { estado });
}
