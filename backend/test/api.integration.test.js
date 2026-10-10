const test = require('node:test');
const assert = require('node:assert/strict');

const enabled = Boolean(process.env.TEST_DATABASE_URL);

test('API completa órdenes, EPP, checklist, inventario, costos y recurrencias con PostgreSQL', { skip: !enabled }, async (t) => {
  process.env.JWT_SECRET ||= 'integration-test-jwt-secret-with-at-least-32-characters';
  const app = require('../src/app');
  const db = require('../src/config/database');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.pool.end();
  });

  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, { method = 'GET', token, body, headers = {} } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body
    });
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();
    return { status: response.status, data };
  }

  const login = await request('/auth/login', {
    method: 'POST', body: JSON.stringify({ correo: 'admin@rickysafe.local', contrasena: 'admin123' }),
    headers: { 'Content-Type': 'application/json' }
  });
  assert.equal(login.status, 200, JSON.stringify(login.data));
  const token = login.data.token;
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  const technicianLogin = await request('/auth/login', {
    method: 'POST', body: JSON.stringify({ correo: 'tecnico@rickysafe.local', contrasena: 'admin123' }),
    headers: { 'Content-Type': 'application/json' }
  });
  assert.equal(technicianLogin.status, 200, JSON.stringify(technicianLogin.data));
  const forbiddenCreate = await request('/ordenes-mantenimiento', {
    method: 'POST', token: technicianLogin.data.token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_juego: 1, priority: 'Alta', description: 'No debe crear órdenes como técnico' })
  });
  assert.equal(forbiddenCreate.status, 403);

  const orderResponse = await request('/ordenes-mantenimiento', {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_juego: 1, assigned_to: login.data.usuario.id_usuario, priority: 'Alta', description: `Prueba integrada ${suffix}` })
  });
  assert.equal(orderResponse.status, 201, JSON.stringify(orderResponse.data));
  const order = orderResponse.data;
  assert.equal(order.checklist.length, 3);

  const blockedStart = await request(`/ordenes-mantenimiento/${order.id}/iniciar`, { method: 'POST', token, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(blockedStart.status, 409);

  const form = new FormData();
  form.append('archivo', new Blob(['demo evidence'], { type: 'image/jpeg' }), `epp-${suffix}.jpg`);
  const evidence = await request(`/ordenes-mantenimiento/${order.id}/evidencias`, { method: 'POST', token, body: form });
  assert.equal(evidence.status, 201, JSON.stringify(evidence.data));
  const epp = await request(`/ordenes-mantenimiento/${order.id}/epp`, {
    method: 'PUT', token, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: true, observations: 'EPP completo' })
  });
  assert.equal(epp.status, 200, JSON.stringify(epp.data));

  const started = await request(`/ordenes-mantenimiento/${order.id}/iniciar`, { method: 'POST', token, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(started.status, 200, JSON.stringify(started.data));

  const checklistResponse = await request(`/ordenes-mantenimiento/${order.id}/checklist`, { token });
  assert.equal(checklistResponse.status, 200);

  const part = await request('/inventario', {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo_repuesto: `TEST-${suffix}`, nombre_repuesto: `Repuesto test ${suffix}`, stock_actual: 0, stock_minimo: 1, costo_unitario: 5 })
  });
  assert.equal(part.status, 201, JSON.stringify(part.data));
  const entry = await request(`/inventario/${part.data.id_repuesto}/movimientos`, {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movement_type: 'Entrada', quantity: 10, unit_cost: 5, reason: 'Compra integrada' })
  });
  assert.equal(entry.status, 201, JSON.stringify(entry.data));
  const overdraw = await request(`/inventario/${part.data.id_repuesto}/movimientos`, {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movement_type: 'Salida', quantity: 11, reason: 'Prueba stock negativo' })
  });
  assert.equal(overdraw.status, 409);

  const used = await request(`/ordenes-mantenimiento/${order.id}/repuestos`, {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ part_id: part.data.id_repuesto, quantity: 2, reason: 'Cambio de pieza' })
  });
  assert.equal(used.status, 201, JSON.stringify(used.data));
  assert.equal(Number(used.data.costo_total), 10);

  const incomplete = await request(`/ordenes-mantenimiento/${order.id}/finalizar`, { method: 'PUT', token, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(incomplete.status, 409);
  for (const item of checklistResponse.data) {
    if (item.description === 'Verificar EPP requerido antes de intervenir') continue;
    const checked = await request(`/ordenes-mantenimiento/${order.id}/checklist/${item.id}`, {
      method: 'PUT', token, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: true })
    });
    assert.equal(checked.status, 200, JSON.stringify(checked.data));
  }
  const finished = await request(`/ordenes-mantenimiento/${order.id}/finalizar`, { method: 'PUT', token, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ observations: 'Prueba terminada' }) });
  assert.equal(finished.status, 200, JSON.stringify(finished.data));
  const repeatFinish = await request(`/ordenes-mantenimiento/${order.id}/finalizar`, { method: 'PUT', token, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(repeatFinish.status, 409);
  const history = await request(`/ordenes-mantenimiento/${order.id}/historial`, { token });
  assert.equal(history.status, 200);
  assert.ok(history.data.some((event) => event.to_status === 'Finalizada'));

  const schedule = await request('/programaciones', {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_juego: 1, assigned_to: login.data.usuario.id_usuario, title: `Prueba recurrente ${suffix}`, description: 'Inspección integrada', interval_days: 30, next_due: new Date().toISOString().slice(0, 10) })
  });
  assert.equal(schedule.status, 201, JSON.stringify(schedule.data));
  const firstProcess = await request('/programaciones/procesar', { method: 'POST', token, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  const secondProcess = await request('/programaciones/procesar', { method: 'POST', token, headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(firstProcess.status, 200, JSON.stringify(firstProcess.data));
  assert.equal(secondProcess.status, 200, JSON.stringify(secondProcess.data));
  assert.equal(firstProcess.data.generadas + secondProcess.data.generadas, 1, JSON.stringify({ first: firstProcess.data, second: secondProcess.data, schedule: schedule.data }));

  const cancelOrder = await request('/ordenes-mantenimiento', {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_juego: 1, assigned_to: login.data.usuario.id_usuario, priority: 'Baja', description: `Cancelar ${suffix}` })
  });
  assert.equal(cancelOrder.status, 201, JSON.stringify(cancelOrder.data));
  const cancelled = await request(`/ordenes-mantenimiento/${cancelOrder.data.id}/cancelar`, {
    method: 'POST', token, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'Cancelación de prueba integrada' })
  });
  assert.equal(cancelled.status, 200, JSON.stringify(cancelled.data));
  assert.equal(cancelled.data.status, 'Cancelada');
});
