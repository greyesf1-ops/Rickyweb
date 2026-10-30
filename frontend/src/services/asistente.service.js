import api from './api.js';

export function consultarAsistente(datos) {
  return api.post('/asistente', datos);
}
