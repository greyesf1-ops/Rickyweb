import api from './api';

export function listarInventario() {
  return api.get('/inventario');
}

export function crearRepuesto(payload) {
  return api.post('/inventario', payload);
}

export function listarMovimientosInventario() {
  return api.get('/inventario/movimientos');
}

export function registrarRepuestoUsado(idMantenimiento, payload) {
  return api.post(`/mantenimientos/${idMantenimiento}/repuestos`, payload);
}

