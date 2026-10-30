const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const tokenTecnico = jwt.sign(
  { id_usuario: 3, nombre: 'Tecnico de Mantenimiento', correo: 'tecnico@rickysafe.local', rol: 'Tecnico' },
  process.env.JWT_SECRET || 'rickysafe_dev_secret'
);
const tokenSupervisor = jwt.sign(
  { id_usuario: 2, nombre: 'Supervisor de Seguridad', correo: 'supervisor@rickysafe.local', rol: 'Supervisor' },
  process.env.JWT_SECRET || 'rickysafe_dev_secret'
);

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

test('no permite verificar EPP completo sin evidencia', async () => {
  const response = await request(app)
    .put('/api/mantenimientos/1/epp')
    .set('Authorization', `Bearer ${tokenTecnico}`)
    .send({ verificado: true, observaciones: 'Revisión realizada' });
  assert.equal(response.status, 400);
  assert.equal(response.body.mensaje, 'La evidencia del EPP es obligatoria');
});

test('no permite rechazar un mantenimiento sin observaciones', async () => {
  const response = await request(app)
    .post('/api/mantenimientos/1/rechazar')
    .set('Authorization', `Bearer ${tokenSupervisor}`)
    .send({});
  assert.equal(response.status, 400);
  assert.equal(response.body.mensaje, 'Todo rechazo debe incluir observaciones');
});

test('rechaza evidencia multipart sin archivo', async () => {
  const response = await request(app)
    .post('/api/mantenimientos/1/evidencias')
    .set('Authorization', `Bearer ${tokenTecnico}`)
    .field('descripcion', 'Sin archivo');
  assert.equal(response.status, 400);
  assert.equal(response.body.mensaje, 'Debes adjuntar un archivo de evidencia');
});
