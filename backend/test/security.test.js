const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { crearAutenticador } = require('../src/middlewares/auth.middleware');
const { permitirRoles } = require('../src/middlewares/roles.middleware');
const { crearLimitadorLogin } = require('../src/middlewares/login-rate-limit.middleware');
const { tiposPermitidos } = require('../src/middlewares/upload.middleware');

function responseMock() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    set(name, value) { this.headers[name] = value; return this; }
  };
}

test('autenticar acepta un JWT firmado y confirma que el usuario sigue activo', async () => {
  const anterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'prueba-segura-con-mas-de-32-caracteres';
  const req = { headers: { authorization: `Bearer ${jwt.sign({ rol: 'Tecnico', id_usuario: 17 }, process.env.JWT_SECRET)}` } };
  const autenticar = crearAutenticador({ query: async () => ({ rows: [{ id_usuario: 17, nombre_completo: 'Técnico', correo: 'tec@example.test', rol: 'Tecnico', estado: true }] }) });
  let continuo = false;
  await autenticar(req, responseMock(), () => { continuo = true; });
  assert.equal(continuo, true);
  assert.equal(req.usuario.rol, 'Tecnico');
  if (anterior === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = anterior;
});

test('autenticar rechaza token cuando falta el secreto', async () => {
  const anterior = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  const res = responseMock();
  await crearAutenticador({ query: async () => ({ rows: [] }) })({ headers: { authorization: 'Bearer cualquier-token' } }, res, () => assert.fail('No debe continuar'));
  assert.equal(res.statusCode, 503);
  if (anterior !== undefined) process.env.JWT_SECRET = anterior;
});

test('permitirRoles impide acciones de roles no autorizados', () => {
  const res = responseMock();
  permitirRoles('Administrador')({ usuario: { rol: 'Tecnico' } }, res, () => assert.fail('No debe continuar'));
  assert.equal(res.statusCode, 403);
});

test('limitador de login bloquea intentos adicionales durante la ventana', () => {
  let ahora = 1000;
  const limitar = crearLimitadorLogin({ maxIntentos: 2, ventanaMs: 5000, ahora: () => ahora });
  const req = { ip: '127.0.0.1' };
  for (let i = 0; i < 2; i += 1) limitar(req, responseMock(), () => {});
  const res = responseMock();
  limitar(req, res, () => assert.fail('No debe continuar'));
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['Retry-After'], '5');
  ahora += 5000;
  let continuo = false;
  limitar(req, responseMock(), () => { continuo = true; });
  assert.equal(continuo, true);
});

test('los tipos admitidos de evidencia están acotados por extensión y MIME', () => {
  assert.equal(tiposPermitidos.get('.jpg').has('image/jpeg'), true);
  assert.equal(tiposPermitidos.has('.exe'), false);
  assert.equal(tiposPermitidos.get('.pdf').has('application/x-msdownload'), false);
});
