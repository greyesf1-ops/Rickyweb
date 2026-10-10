const ESTADOS = Object.freeze({ PENDIENTE: 'Pendiente', PROCESO: 'En proceso', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada' });

function transicionValida(actual, destino) {
  const permitidas = {
    Pendiente: ['En proceso', 'Cancelada'],
    'En proceso': ['Finalizada', 'Cancelada'],
    Finalizada: [],
    Cancelada: []
  };
  return permitidas[actual]?.includes(destino) || false;
}

function paginacion(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

module.exports = { ESTADOS, transicionValida, paginacion };
