import api from './api';

export function listarMantenimientos(params) {
  return api.get('/mantenimientos', { params });
}

export function crearMantenimiento(payload) {
  return api.post('/mantenimientos', payload);
}

export function enviarARevision(id) {
  return api.post(`/mantenimientos/${id}/enviar-revision`);
}

export function verificarEpp(id, payload) {
  return api.put(`/mantenimientos/${id}/epp`, payload);
}
