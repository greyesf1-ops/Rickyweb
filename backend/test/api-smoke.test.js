const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');

test('salud de la API identifica el sistema', async () => {
  const response = await request(app).get('/api/salud');
  assert.equal(response.status, 200);
  assert.equal(response.body.estado, 'ok');
  assert.equal(response.body.sistema, 'RickySafe Maintenance');
});

test('una ruta protegida rechaza solicitudes sin token', async () => {
  const response = await request(app).get('/api/mantenimientos');
  assert.equal(response.status, 401);
});

test('una ruta inexistente devuelve un error JSON estable', async () => {
  const response = await request(app).get('/api/no-existe');
  assert.equal(response.status, 404);
  assert.equal(response.body.mensaje, 'Ruta no encontrada');
});
