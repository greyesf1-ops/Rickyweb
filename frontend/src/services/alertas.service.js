import api from './api';

export function listarAlertasSeguridad() {
  return api.get('/alertas-seguridad');
}

export function atenderAlertaSeguridad(id) {
  return api.put(`/alertas-seguridad/${id}/atender`);
}

