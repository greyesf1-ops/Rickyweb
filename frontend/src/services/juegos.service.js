import api from './api';

export function listarJuegos() {
  return api.get('/juegos');
}

export function crearJuego(payload) {
  return api.post('/juegos', payload);
}

