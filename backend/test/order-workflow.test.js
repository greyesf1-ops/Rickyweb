const test = require('node:test');
const assert = require('node:assert/strict');
const { ESTADOS, transicionValida, paginacion } = require('../src/services/order-workflow.service');

test('solo permite transiciones válidas y bloquea cambios desde estados terminales', () => {
  assert.equal(transicionValida(ESTADOS.PENDIENTE, ESTADOS.PROCESO), true);
  assert.equal(transicionValida(ESTADOS.PENDIENTE, ESTADOS.CANCELADA), true);
  assert.equal(transicionValida(ESTADOS.PROCESO, ESTADOS.FINALIZADA), true);
  assert.equal(transicionValida(ESTADOS.PROCESO, ESTADOS.PENDIENTE), false);
  assert.equal(transicionValida(ESTADOS.FINALIZADA, ESTADOS.CANCELADA), false);
  assert.equal(transicionValida(ESTADOS.CANCELADA, ESTADOS.PROCESO), false);
});

test('paginación normaliza valores y limita el tamaño máximo de página', () => {
  assert.deepEqual(paginacion({ page: '-2', pageSize: '0' }), { page: 1, pageSize: 20, offset: 0 });
  assert.deepEqual(paginacion({ page: '3', pageSize: '500' }), { page: 3, pageSize: 100, offset: 200 });
});
