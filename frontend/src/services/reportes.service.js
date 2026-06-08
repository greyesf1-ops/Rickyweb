import api from './api';

export function reportePersonalizado(params) {
  return api.get('/reportes/personalizado', { params });
}

export function exportarCsv(params) {
  return api.get('/reportes/exportar/csv', {
    params,
    responseType: 'blob'
  });
}

export function exportarExcel(params) {
  return api.get('/reportes/exportar/excel', {
    params,
    responseType: 'blob'
  });
}

export function exportarPdf(params) {
  return api.get('/reportes/exportar/pdf', {
    params,
    responseType: 'blob'
  });
}
