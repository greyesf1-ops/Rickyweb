import api from './api';

export function listarProtocolos() {
  return api.get('/protocolos');
}

export function crearProtocolo(payload) {
  return api.post('/protocolos', payload);
}

