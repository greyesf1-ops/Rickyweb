require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const fs = require('fs/promises');
const express = require('express');
const cors = require('cors');
const argon2 = require('argon2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const db = require('./config/database');
const { autenticar } = require('./middlewares/auth.middleware');
const { permitirRoles } = require('./middlewares/roles.middleware');
const { upload } = require('./middlewares/upload.middleware');
const { crearLimitadorLogin } = require('./middlewares/login-rate-limit.middleware');
const { registrarAuditoria } = require('./services/auditoria.service');
const { ESTADOS, transicionValida, paginacion } = require('./services/order-workflow.service');

const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);

const origenesPermitidos = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map((origen) => origen.trim()).filter(Boolean);
app.use(cors({
  origin(origen, callback) {
    if (!origen || origenesPermitidos.includes(origen)) return callback(null, true);
    return callback(new Error('Origen no permitido por CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));

function crearToken(usuario) {
  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre_completo,
      correo: usuario.correo,
      rol: usuario.nombre_rol
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function generarContrasenaTemporal() {
  const numero = crypto.randomInt(100000, 1000000);
  return `Ricky#${numero}Tmp`;
}

function validarPasswordSegura(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password || '');
}

async function hashPassword(password) {
  return argon2.hash(password, { type: argon2.argon2id });
}

async function verificarPassword(hash, password) {
  try {
    if (hash?.startsWith('$argon2')) {
      return argon2.verify(hash, password);
    }

    return bcrypt.compare(password || '', hash || '');
  } catch (error) {
    console.error('Error verificando contraseña:', error.message);
    return false;
  }
}

async function obtenerMantenimientos(filtros = {}) {
  const condiciones = [];
  const valores = [];

  if (filtros.estado) {
    valores.push(filtros.estado);
    condiciones.push(`m.estado = $${valores.length}`);
  }

  if (filtros.tipo_mantenimiento) {
    valores.push(filtros.tipo_mantenimiento);
    condiciones.push(`m.tipo_mantenimiento = $${valores.length}`);
  }

  if (filtros.fecha_inicio) {
    valores.push(filtros.fecha_inicio);
    condiciones.push(`DATE(m.fecha_inicio) >= $${valores.length}`);
  }

  if (filtros.fecha_fin) {
    valores.push(filtros.fecha_fin);
    condiciones.push(`DATE(m.fecha_inicio) <= $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await db.query(
    `SELECT
       m.*,
       j.nombre_juego,
       j.codigo_juego,
       u.nombre_completo AS tecnico,
       p.nombre_protocolo,
       v.resultado AS resultado_validacion,
       s.nombre_completo AS supervisor
     FROM mantenimientos m
     JOIN juegos j ON j.id_juego = m.id_juego
     JOIN usuarios u ON u.id_usuario = m.id_tecnico
     JOIN protocolos p ON p.id_protocolo = m.id_protocolo
     LEFT JOIN validaciones v ON v.id_mantenimiento = m.id_mantenimiento
     LEFT JOIN usuarios s ON s.id_usuario = v.id_supervisor
     ${where}
     ORDER BY m.fecha_creacion DESC`,
    valores
  );

  return rows;
}

function crearCodigo(prefijo) {
  const fecha = new Date();
  const stamp = [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, '0'),
    String(fecha.getDate()).padStart(2, '0'),
    String(fecha.getHours()).padStart(2, '0'),
    String(fecha.getMinutes()).padStart(2, '0'),
    String(fecha.getSeconds()).padStart(2, '0')
  ].join('');
  const aleatorio = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefijo}-${stamp}-${aleatorio}`;
}

function normalizarHoras(valor) {
  const horas = Number(valor);
  return Number.isFinite(horas) ? Math.round(horas * 100) / 100 : 0;
}

async function registrarHistorialOrden(client, { orderId, actorId, action, fromStatus = null, toStatus = null, reason = null }) {
  await client.query(
    `INSERT INTO maintenance_order_history (order_id, actor_id, action, from_status, to_status, reason)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orderId, actorId, action, fromStatus, toStatus, reason]
  );
}

async function obtenerOrdenes(filtros = {}, { paginate = false } = {}) {
  const condiciones = [];
  const valores = [];

  if (filtros.estado) {
    valores.push(filtros.estado);
    condiciones.push(`o.status = $${valores.length}`);
  }

  if (filtros.prioridad) {
    valores.push(filtros.prioridad);
    condiciones.push(`o.priority = $${valores.length}`);
  }

  if (filtros.tecnico) {
    valores.push(filtros.tecnico);
    condiciones.push(`o.assigned_to = $${valores.length}`);
  }

  if (filtros.fecha_inicio) {
    valores.push(filtros.fecha_inicio);
    condiciones.push(`DATE(o.created_at) >= $${valores.length}`);
  }

  if (filtros.fecha_fin) {
    valores.push(filtros.fecha_fin);
    condiciones.push(`DATE(o.created_at) <= $${valores.length}`);
  }

  if (filtros.q) {
    valores.push(`%${String(filtros.q).trim()}%`);
    condiciones.push(`(o.order_code ILIKE $${valores.length} OR o.description ILIKE $${valores.length} OR j.nombre_juego ILIKE $${valores.length} OR u.nombre_completo ILIKE $${valores.length})`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const ordenPermitido = {
    fecha: 'o.created_at',
    prioridad: 'o.priority',
    estado: 'o.status',
    codigo: 'o.order_code'
  };
  const orden = ordenPermitido[filtros.sort] || 'o.created_at';
  const direccion = String(filtros.direction).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const pag = paginate ? paginacion(filtros) : null;
  const values = [...valores];
  const pagSql = pag ? `LIMIT $${values.push(pag.pageSize)} OFFSET $${values.push(pag.offset)}` : '';

  const { rows } = await db.query(
    `SELECT
       o.*,
       r.code AS request_code,
       r.title AS request_title,
       j.nombre_juego,
       u.nombre_completo AS responsable,
       COALESCE(SUM(w.hours_worked), 0)::numeric(5,2) AS horas_trabajadas,
       GREATEST(o.max_hours - COALESCE(SUM(w.hours_worked), 0), 0)::numeric(5,2) AS horas_restantes,
       COALESCE((SELECT SUM(wl.hours_worked * wl.hourly_rate) FROM maintenance_work_logs wl WHERE wl.order_id = o.id), 0)::numeric(12,2) AS costo_mano_obra,
       COALESCE((SELECT SUM(op.quantity * op.unit_cost) FROM maintenance_order_parts op WHERE op.order_id = o.id), 0)::numeric(12,2) AS costo_repuestos
     FROM maintenance_orders o
     LEFT JOIN maintenance_requests r ON r.id = o.request_id
     LEFT JOIN juegos j ON j.id_juego = o.id_juego
     LEFT JOIN usuarios u ON u.id_usuario = o.assigned_to
     LEFT JOIN maintenance_work_logs w ON w.order_id = o.id
     ${where}
     GROUP BY o.id, r.id, j.id_juego, u.id_usuario
     ORDER BY ${orden} ${direccion}, o.id DESC ${pagSql}`,
    values
  );

  if (!pag) return rows;
  const totalResult = await db.query(
    `SELECT COUNT(DISTINCT o.id)::int AS total
     FROM maintenance_orders o
     LEFT JOIN juegos j ON j.id_juego = o.id_juego
     LEFT JOIN usuarios u ON u.id_usuario = o.assigned_to
     ${where}`,
    valores
  );
  const total = totalResult.rows[0].total;
  return { items: rows, total, page: pag.page, pageSize: pag.pageSize, totalPages: Math.ceil(total / pag.pageSize) };
}

app.get('/api/salud', (_req, res) => {
  res.json({ estado: 'ok', sistema: 'RickySafe Maintenance' });
});

app.get('/api/dashboard', autenticar, async (_req, res, next) => {
  try {
    const [states, stock, due, costs, recent] = await Promise.all([
      db.query('SELECT status, COUNT(*)::int AS total FROM maintenance_orders GROUP BY status'),
      db.query('SELECT COUNT(*)::int AS total FROM inventario_repuestos WHERE estado = TRUE AND stock_actual <= stock_minimo'),
      db.query('SELECT COUNT(*)::int AS total FROM maintenance_schedules WHERE active = TRUE AND next_due <= CURRENT_DATE + INTERVAL \'7 days\''),
      db.query(
        `SELECT (COALESCE((SELECT SUM(w.hours_worked * w.hourly_rate) FROM maintenance_work_logs w), 0)
              + COALESCE((SELECT SUM(p.quantity * p.unit_cost) FROM maintenance_order_parts p), 0))::numeric(14,2) AS total`
      ),
      db.query(
        `SELECT o.id, o.order_code, o.status, o.priority, o.created_at, j.nombre_juego, u.nombre_completo AS responsable
         FROM maintenance_orders o LEFT JOIN juegos j ON j.id_juego = o.id_juego
         LEFT JOIN usuarios u ON u.id_usuario = o.assigned_to ORDER BY o.created_at DESC LIMIT 6`
      )
    ]);
    const counts = Object.fromEntries(states.rows.map((row) => [row.status, row.total]));
    return res.json({
      ordenes: { total: states.rows.reduce((sum, row) => sum + row.total, 0), por_estado: counts },
      repuestos_bajo_minimo: stock.rows[0].total,
      programaciones_vencen_7_dias: due.rows[0].total,
      costo_historico: costs.rows[0].total,
      recientes: recent.rows
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', crearLimitadorLogin(), async (req, res, next) => {
  const { correo, contrasena } = req.body || {};

  if (typeof correo !== 'string' || typeof contrasena !== 'string' || !correo.trim() || !contrasena) {
    return res.status(400).json({ mensaje: 'Correo/usuario y contraseña son obligatorios' });
  }

  try {
    const { rows } = await db.query(
      `SELECT u.*, r.nombre_rol
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE (u.correo = $1 OR u.usuario = $1)`,
      [correo]
    );

    const usuario = rows[0];
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    if (!usuario.estado) {
      return res.status(403).json({ mensaje: 'Usuario inactivo' });
    }

    const valido = await verificarPassword(usuario.contrasena, contrasena);
    if (!valido) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    const debeCambiar = usuario.must_change_password === true || usuario.debe_cambiar_contrasena === true;

    try {
      await registrarAuditoria({
        idUsuario: usuario.id_usuario,
        accion: 'Inicio de sesion',
        modulo: 'Autenticacion',
        descripcion: `Ingreso de ${usuario.correo}`
      });
    } catch (auditError) {
      console.error('No se pudo registrar auditoria de login:', auditError.message);
    }

    return res.json({
      token: crearToken(usuario),
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.nombre_rol,
        debe_cambiar_contrasena: debeCambiar,
        must_change_password: debeCambiar,
        temporary_password: usuario.temporary_password === true
      }
    });
  } catch (error) {
    console.error('Fallo login DB:', error.message);
    return next(error);
  }
});

app.get('/api/auth/perfil', autenticar, (req, res) => {
  res.json({ usuario: req.usuario });
});

app.get('/api/usuarios', autenticar, permitirRoles('Administrador', 'Supervisor', 'Auditor'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.usuario,
              u.departamento, u.turno, u.telefono, u.ultimo_acceso, u.estado,
              u.debe_cambiar_contrasena, u.must_change_password, u.temporary_password,
              u.password_updated_at, u.fecha_creacion, r.nombre_rol AS rol,
              CASE WHEN $1 = 'Administrador' THEN u.costo_hora END AS costo_hora
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       ORDER BY u.fecha_creacion DESC`, [req.usuario.rol]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/roles', autenticar, permitirRoles('Administrador'), async (_req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id_rol, nombre_rol FROM roles WHERE estado = TRUE ORDER BY id_rol');
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/usuarios/:id/costo-hora', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const rate = Number(req.body.costo_hora);
    if (!Number.isFinite(rate) || rate < 0) return res.status(400).json({ mensaje: 'El costo por hora debe ser un valor no negativo' });
    const { rows } = await db.query('UPDATE usuarios SET costo_hora = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_usuario = $2 RETURNING id_usuario, costo_hora', [rate, req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Costo laboral actualizado', modulo: 'Usuarios', descripcion: `Usuario ${rows[0].id_usuario}` });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/usuarios', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const {
      id_rol,
      nombre_completo,
      correo,
      usuario,
      contrasena_temporal,
      departamento,
      turno,
      telefono,
      costo_hora
    } = req.body;
    const costoHora = Number(costo_hora || 0);
    if (!Number.isFinite(costoHora) || costoHora < 0) return res.status(400).json({ mensaje: 'El costo por hora debe ser un valor no negativo' });
    const temporal = contrasena_temporal || generarContrasenaTemporal();
    const hash = await hashPassword(temporal);

    const { rows } = await db.query(
      `INSERT INTO usuarios
       (id_rol, nombre_completo, correo, usuario, contrasena, debe_cambiar_contrasena,
        must_change_password, temporary_password, departamento, turno, telefono, costo_hora)
       VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, TRUE, $6, $7, $8, $9)
       RETURNING id_usuario, nombre_completo, correo, usuario, estado,
                 debe_cambiar_contrasena, must_change_password, temporary_password, costo_hora, fecha_creacion`,
      [id_rol, nombre_completo, correo, usuario, hash, departamento || null, turno || null, telefono || null, costoHora]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Usuario creado',
      modulo: 'Usuarios',
      descripcion: `Usuario ${correo}`
    });

    res.status(201).json({ ...rows[0], contrasena_temporal: temporal });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/cambiar-contrasena', autenticar, async (req, res, next) => {
  try {
    const { contrasena_actual, nueva_contrasena } = req.body;

    if (!validarPasswordSegura(nueva_contrasena)) {
      return res.status(400).json({
        mensaje: 'La nueva contraseña debe tener mayúscula, minúscula, número, símbolo y mínimo 10 caracteres'
      });
    }

    const { rows } = await db.query(
      'SELECT contrasena FROM usuarios WHERE id_usuario = $1 AND estado = TRUE',
      [req.usuario.id_usuario]
    );
    const usuario = rows[0];

    if (!usuario || !(await verificarPassword(usuario.contrasena, contrasena_actual))) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    const hash = await hashPassword(nueva_contrasena);
    await db.query(
      `UPDATE usuarios
       SET contrasena = $1, debe_cambiar_contrasena = FALSE,
           must_change_password = FALSE,
           temporary_password = FALSE,
           fecha_cambio_contrasena = CURRENT_TIMESTAMP,
           password_updated_at = CURRENT_TIMESTAMP,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_usuario = $2`,
      [hash, req.usuario.id_usuario]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Contraseña cambiada',
      modulo: 'Autenticacion',
      descripcion: 'Cambio obligatorio o voluntario de contraseña'
    });

    return res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/usuarios/:id/estado', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const idUsuario = Number(req.params.id);
    const { estado } = req.body;
    const estadoActivo = estado === true || estado === 'true';

    if (idUsuario === Number(req.usuario.id_usuario) && !estadoActivo) {
      return res.status(400).json({ mensaje: 'No puede desactivar su propia sesion' });
    }

    const { rows } = await db.query(
      `UPDATE usuarios
       SET estado = $1, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_usuario = $2
       RETURNING id_usuario, nombre_completo, correo, usuario, estado, fecha_actualizacion`,
      [estadoActivo, idUsuario]
    );

    if (!rows[0]) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: rows[0].estado ? 'Usuario reactivado' : 'Usuario desactivado',
      modulo: 'Usuarios',
      descripcion: `${rows[0].correo}. El registro se conserva para historial.`
    });

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/juegos', autenticar, async (_req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM juegos ORDER BY fecha_registro DESC');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/juegos/:id/resumen', autenticar, async (req, res, next) => {
  try {
    const equipment = await db.query('SELECT * FROM juegos WHERE id_juego = $1', [req.params.id]);
    if (!equipment.rows[0]) return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    const [orders, schedules, totals] = await Promise.all([
      db.query(
        `SELECT o.id, o.order_code, o.status, o.priority, o.description, o.start_date, o.end_date, o.scheduled_for,
                u.nombre_completo AS responsable,
                COALESCE((SELECT SUM(w.hours_worked * w.hourly_rate) FROM maintenance_work_logs w WHERE w.order_id = o.id), 0)::numeric(12,2) AS costo_mano_obra,
                COALESCE((SELECT SUM(p.quantity * p.unit_cost) FROM maintenance_order_parts p WHERE p.order_id = o.id), 0)::numeric(12,2) AS costo_repuestos
         FROM maintenance_orders o LEFT JOIN usuarios u ON u.id_usuario = o.assigned_to
         WHERE o.id_juego = $1 ORDER BY o.created_at DESC LIMIT 100`, [req.params.id]
      ),
      db.query('SELECT id, title, interval_days, next_due, active FROM maintenance_schedules WHERE id_juego = $1 ORDER BY active DESC, next_due', [req.params.id]),
      db.query(
        `SELECT COALESCE(SUM(w.hours_worked * w.hourly_rate), 0)::numeric(12,2) AS costo_mano_obra,
                COALESCE((SELECT SUM(p.quantity * p.unit_cost) FROM maintenance_order_parts p JOIN maintenance_orders o ON o.id = p.order_id WHERE o.id_juego = $1), 0)::numeric(12,2) AS costo_repuestos
         FROM maintenance_work_logs w JOIN maintenance_orders o ON o.id = w.order_id WHERE o.id_juego = $1`, [req.params.id]
      )
    ]);
    return res.json({ equipo: equipment.rows[0], ordenes: orders.rows, programaciones: schedules.rows, costos: totals.rows[0] });
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/juegos/:id/estado', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const allowed = ['Activo', 'Fuera de servicio', 'Inactivo'];
    if (!allowed.includes(req.body.estado_operativo)) return res.status(400).json({ mensaje: 'Estado de equipo no válido' });
    const { rows } = await db.query('UPDATE juegos SET estado_operativo = $1 WHERE id_juego = $2 RETURNING *', [req.body.estado_operativo, req.params.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: 'Equipo no encontrado' });
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Estado del equipo actualizado', modulo: 'Juegos', descripcion: `${rows[0].codigo_juego}: ${rows[0].estado_operativo}` });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/juegos', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const { codigo_juego, nombre_juego, tipo_juego, ubicacion, descripcion, estado_operativo } = req.body;
    const { rows } = await db.query(
      `INSERT INTO juegos (codigo_juego, nombre_juego, tipo_juego, ubicacion, descripcion, estado_operativo)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'Activo'))
       RETURNING *`,
      [codigo_juego, nombre_juego, tipo_juego, ubicacion, descripcion, estado_operativo]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Juego registrado',
      modulo: 'Juegos',
      descripcion: nombre_juego
    });

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/protocolos', autenticar, async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*,
              COALESCE(json_agg(pp ORDER BY pp.orden) FILTER (WHERE pp.id_paso IS NOT NULL), '[]') AS pasos
       FROM protocolos p
       LEFT JOIN pasos_protocolo pp ON pp.id_protocolo = p.id_protocolo
       GROUP BY p.id_protocolo
       ORDER BY p.fecha_creacion DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/protocolos', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const { nombre_protocolo, descripcion, tipo_mantenimiento, requiere_evidencia } = req.body;
    const { rows } = await db.query(
      `INSERT INTO protocolos (nombre_protocolo, descripcion, tipo_mantenimiento, requiere_evidencia)
       VALUES ($1, $2, $3, COALESCE($4, TRUE))
       RETURNING *`,
      [nombre_protocolo, descripcion, tipo_mantenimiento, requiere_evidencia]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Protocolo creado',
      modulo: 'Protocolos',
      descripcion: nombre_protocolo
    });

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/protocolos/:id/pasos', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  try {
    const { descripcion_paso, obligatorio, orden } = req.body;
    const { rows } = await db.query(
      `INSERT INTO pasos_protocolo (id_protocolo, descripcion_paso, obligatorio, orden)
       VALUES ($1, $2, COALESCE($3, TRUE), $4)
       RETURNING *`,
      [req.params.id, descripcion_paso, obligatorio, orden]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/solicitudes-mantenimiento', autenticar, async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, u.nombre_completo AS solicitado_por, j.nombre_juego
       FROM maintenance_requests r
       LEFT JOIN usuarios u ON u.id_usuario = r.requested_by
       LEFT JOIN juegos j ON j.id_juego = r.id_juego
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/solicitudes-mantenimiento', autenticar, async (req, res, next) => {
  try {
    const {
      title,
      description,
      area,
      equipment,
      id_juego,
      priority
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ mensaje: 'Titulo y descripcion son obligatorios' });
    }

    const { rows } = await db.query(
      `INSERT INTO maintenance_requests
       (code, title, description, area, equipment, id_juego, priority, requested_by)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'Media'), $8)
       RETURNING *`,
      [
        crearCodigo('SOL'),
        title,
        description,
        area || null,
        equipment || null,
        id_juego || null,
        priority,
        req.usuario.id_usuario
      ]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Solicitud de mantenimiento creada',
      modulo: 'Mantenimientos',
      descripcion: rows[0].code
    });

    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/solicitudes-mantenimiento/:id/generar-orden', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const { assigned_to, observations } = req.body;
    await client.query('BEGIN');

    const solicitudResult = await client.query(
      'SELECT * FROM maintenance_requests WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const solicitud = solicitudResult.rows[0];

    if (!solicitud) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Solicitud no encontrada' });
    }

    if (solicitud.status === 'Convertida') {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(400).json({ mensaje: 'La solicitud ya fue convertida en orden' });
    }

    const ordenResult = await client.query(
      `INSERT INTO maintenance_orders
       (request_id, order_code, id_juego, assigned_to, status, priority, description, observations)
       VALUES ($1, $2, $3, $4, 'Pendiente', $5, $6, $7)
       RETURNING *`,
      [
        solicitud.id,
        crearCodigo('ORD'),
        solicitud.id_juego,
        assigned_to || req.usuario.id_usuario,
        solicitud.priority,
        solicitud.description,
        observations || null
      ]
    );

    const checklistBase = [
      'Confirmar aislamiento y señalización del equipo',
      'Verificar EPP requerido antes de intervenir',
      'Registrar resultado y evidencia del trabajo'
    ];
    for (const description of checklistBase) {
      await client.query('INSERT INTO maintenance_order_checklist (order_id, description) VALUES ($1, $2) ON CONFLICT DO NOTHING', [ordenResult.rows[0].id, description]);
    }
    await registrarHistorialOrden(client, {
      orderId: ordenResult.rows[0].id,
      actorId: req.usuario.id_usuario,
      action: 'Creada',
      toStatus: ordenResult.rows[0].status,
      reason: `Creada desde solicitud ${solicitud.code}`
    });

    await client.query(
      `UPDATE maintenance_requests
       SET status = 'Convertida', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [solicitud.id]
    );

    await client.query('COMMIT');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Solicitud convertida en orden',
      modulo: 'Mantenimientos',
      descripcion: `${solicitud.code} -> ${ordenResult.rows[0].order_code}`
    });

    return res.status(201).json(ordenResult.rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/ordenes-mantenimiento', autenticar, async (req, res, next) => {
  try {
    res.json(await obtenerOrdenes(req.query, { paginate: true }));
  } catch (error) {
    next(error);
  }
});

app.post('/api/ordenes-mantenimiento', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const {
      id_juego,
      assigned_to,
      priority,
      description,
      observations,
      start_date
    } = req.body;

    if (!description) {
      return res.status(400).json({ mensaje: 'La descripcion de la orden es obligatoria' });
    }

    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO maintenance_orders
       (order_code, id_juego, assigned_to, status, priority, description, observations, start_date)
       VALUES ($1, $2, $3, 'Pendiente', COALESCE($4, 'Media'), $5, $6, $7)
       RETURNING *`,
      [
        crearCodigo('ORD'),
        id_juego || null,
        assigned_to || null,
        priority,
        description,
        observations || null,
        start_date || null
      ]
    );

    const orden = rows[0];
    const checklist = Array.isArray(req.body.checklist) && req.body.checklist.length
      ? req.body.checklist
      : [
          'Confirmar aislamiento y señalización del equipo',
          'Verificar EPP requerido antes de intervenir',
          'Registrar resultado y evidencia del trabajo'
        ];
    for (const item of checklist) {
      const descriptionItem = String(typeof item === 'string' ? item : item.description || '').trim();
      if (!descriptionItem) continue;
      await client.query(
        'INSERT INTO maintenance_order_checklist (order_id, description, required) VALUES ($1, $2, $3) ON CONFLICT (order_id, description) DO NOTHING',
        [orden.id, descriptionItem, typeof item === 'string' ? true : item.required !== false]
      );
    }
    await registrarHistorialOrden(client, {
      orderId: orden.id,
      actorId: req.usuario.id_usuario,
      action: 'Creada',
      toStatus: orden.status,
      reason: 'Orden registrada'
    });
    await client.query('COMMIT');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Orden de mantenimiento creada',
      modulo: 'Mantenimientos',
      descripcion: rows[0].order_code
    });

    return res.status(201).json({ ...orden, checklist });
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/ordenes-mantenimiento/:id/historial', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT h.*, u.nombre_completo AS responsable
       FROM maintenance_order_history h
       LEFT JOIN usuarios u ON u.id_usuario = h.actor_id
       WHERE h.order_id = $1 ORDER BY h.event_date DESC, h.id DESC`,
      [req.params.id]
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/ordenes-mantenimiento/:id/asignar', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const assignedTo = Number(req.body.assigned_to);
    if (!Number.isInteger(assignedTo) || assignedTo <= 0) return res.status(400).json({ mensaje: 'Selecciona un responsable válido' });
    await client.query('BEGIN');
    const before = await client.query('SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!before.rows[0]) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    if ([ESTADOS.FINALIZADA, ESTADOS.CANCELADA].includes(before.rows[0].status)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'No se puede reasignar una orden cerrada' });
    }
    const assigned = await client.query('SELECT id_usuario FROM usuarios WHERE id_usuario = $1 AND estado = TRUE', [assignedTo]);
    if (!assigned.rows[0]) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(400).json({ mensaje: 'El responsable no existe o está desactivado' });
    }
    const { rows } = await client.query('UPDATE maintenance_orders SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *', [assignedTo, req.params.id]);
    await registrarHistorialOrden(client, { orderId: rows[0].id, actorId: req.usuario.id_usuario, action: 'Asignada', fromStatus: rows[0].status, toStatus: rows[0].status, reason: String(req.body.reason || 'Cambio de responsable').trim() });
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Orden reasignada', modulo: 'Mantenimientos', descripcion: `${rows[0].order_code} -> usuario ${assignedTo}` });
    return res.json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.post('/api/ordenes-mantenimiento/:id/iniciar', autenticar, permitirRoles('Administrador', 'Tecnico', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!current.rows[0]) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    const order = current.rows[0];
    if (!transicionValida(order.status, ESTADOS.PROCESO)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: `No se puede iniciar una orden en estado ${order.status}` });
    }
    if (!order.epp_verified) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'Verifica el EPP y adjunta evidencia antes de iniciar el trabajo' });
    }
    if (req.usuario.rol === 'Tecnico' && Number(order.assigned_to) !== Number(req.usuario.id_usuario)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede iniciar esta orden' });
    }
    const { rows } = await client.query(
      `UPDATE maintenance_orders SET status = $1, start_date = COALESCE(start_date, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`, [ESTADOS.PROCESO, order.id]
    );
    await registrarHistorialOrden(client, { orderId: order.id, actorId: req.usuario.id_usuario, action: 'Estado', fromStatus: order.status, toStatus: ESTADOS.PROCESO, reason: String(req.body.reason || 'Trabajo iniciado').trim() });
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Orden iniciada', modulo: 'Mantenimientos', descripcion: rows[0].order_code });
    return res.json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.post('/api/ordenes-mantenimiento/:id/cancelar', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const reason = String(req.body.reason || '').trim();
    if (reason.length < 5) return res.status(400).json({ mensaje: 'Indica el motivo de cancelación (mínimo 5 caracteres)' });
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!current.rows[0]) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    const order = current.rows[0];
    if (!transicionValida(order.status, ESTADOS.CANCELADA)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: `No se puede cancelar una orden en estado ${order.status}` });
    }
    const { rows } = await client.query(
      `UPDATE maintenance_orders SET status = $1, observations = CONCAT_WS(' | ', observations, $2),
       updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [ESTADOS.CANCELADA, `Cancelación: ${reason}`, order.id]
    );
    await registrarHistorialOrden(client, { orderId: order.id, actorId: req.usuario.id_usuario, action: 'Estado', fromStatus: order.status, toStatus: ESTADOS.CANCELADA, reason });
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Orden cancelada', modulo: 'Mantenimientos', descripcion: `${rows[0].order_code}: ${reason}` });
    return res.json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/ordenes-mantenimiento/:id/checklist', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, u.nombre_completo AS responsable
       FROM maintenance_order_checklist c LEFT JOIN usuarios u ON u.id_usuario = c.completed_by
       WHERE c.order_id = $1 ORDER BY c.id`, [req.params.id]
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/ordenes-mantenimiento/:id/evidencias', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT e.id, e.order_id, e.uploaded_by, e.original_name, e.mime_type, e.description, e.created_at,
              u.nombre_completo AS responsable
       FROM maintenance_order_evidence e LEFT JOIN usuarios u ON u.id_usuario = e.uploaded_by
       WHERE e.order_id = $1 ORDER BY e.created_at DESC`, [req.params.id]
    );
    return res.json(rows.map((row) => ({ ...row, url_descarga: `/api/orden-evidencias/${row.id}/archivo` })));
  } catch (error) {
    return next(error);
  }
});

app.post('/api/ordenes-mantenimiento/:id/evidencias', autenticar, permitirRoles('Administrador', 'Tecnico', 'Supervisor'), upload.single('archivo'), async (req, res, next) => {
  const file = req.file;
  try {
    if (!file) return res.status(400).json({ mensaje: 'Selecciona un archivo de evidencia' });
    const order = await db.query('SELECT id, assigned_to, status FROM maintenance_orders WHERE id = $1', [req.params.id]);
    if (!order.rows[0]) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    if (['Finalizada', 'Cancelada'].includes(order.rows[0].status)) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(409).json({ mensaje: 'No se pueden adjuntar evidencias a una orden cerrada' });
    }
    if (req.usuario.rol === 'Tecnico' && Number(order.rows[0].assigned_to) !== Number(req.usuario.id_usuario)) {
      await fs.unlink(file.path).catch(() => {});
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede cargar evidencia' });
    }
    const { rows } = await db.query(
      `INSERT INTO maintenance_order_evidence (order_id, uploaded_by, original_name, file_path, mime_type, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, order_id, uploaded_by, original_name, mime_type, description, created_at`,
      [req.params.id, req.usuario.id_usuario, file.originalname, file.path, file.mimetype, req.body.description || null]
    );
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Evidencia adjuntada', modulo: 'Mantenimientos', descripcion: `${order.rows[0].id}: ${file.originalname}` });
    return res.status(201).json(rows[0]);
  } catch (error) {
    if (file) await fs.unlink(file.path).catch(() => {});
    return next(error);
  }
});

app.get('/api/orden-evidencias/:id/archivo', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT e.file_path, e.original_name, o.assigned_to
       FROM maintenance_order_evidence e JOIN maintenance_orders o ON o.id = e.order_id
       WHERE e.id = $1`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Evidencia no encontrada' });
    if (req.usuario.rol === 'Tecnico' && Number(rows[0].assigned_to) !== Number(req.usuario.id_usuario)) {
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede consultar esta evidencia' });
    }
    return res.download(rows[0].file_path, path.basename(rows[0].original_name), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/ordenes-mantenimiento/:id/epp', autenticar, permitirRoles('Administrador', 'Tecnico', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const verified = req.body.verified === true;
    const observations = String(req.body.observations || '').trim();
    await client.query('BEGIN');
    const orderResult = await client.query('SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    const order = orderResult.rows[0];
    if (!order) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    if (req.usuario.rol === 'Tecnico' && Number(order.assigned_to) !== Number(req.usuario.id_usuario)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede validar el EPP' });
    }
    if (order.status !== ESTADOS.PENDIENTE && verified !== order.epp_verified) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'La verificación de EPP ya no se puede cambiar después de iniciar el trabajo' });
    }
    if (verified) {
      const evidence = await client.query('SELECT 1 FROM maintenance_order_evidence WHERE order_id = $1 LIMIT 1', [order.id]);
      if (!evidence.rows[0]) {
        await client?.query('ROLLBACK').catch(() => {});
        return res.status(409).json({ mensaje: 'Adjunta evidencia antes de validar el EPP' });
      }
    }
    const { rows } = await client.query(
      `UPDATE maintenance_orders SET epp_verified = $1, epp_observations = $2,
       epp_verified_by = CASE WHEN $1 THEN $3::integer ELSE NULL::integer END,
       epp_verified_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END,
       updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [verified, observations || null, req.usuario.id_usuario, order.id]
    );
    await client.query(
      `UPDATE maintenance_order_checklist SET completed = $1,
       completed_by = CASE WHEN $1 THEN $2::integer ELSE NULL::integer END,
       completed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE order_id = $3 AND description = 'Verificar EPP requerido antes de intervenir'`,
      [verified, req.usuario.id_usuario, order.id]
    );
    await registrarHistorialOrden(client, { orderId: order.id, actorId: req.usuario.id_usuario, action: verified ? 'EPP verificado' : 'EPP pendiente', fromStatus: order.status, toStatus: order.status, reason: observations || (verified ? 'EPP completo y evidencia adjunta' : 'EPP desmarcado') });
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: verified ? 'EPP verificado en orden' : 'Verificación EPP retirada', modulo: 'Seguridad EPP', descripcion: order.order_code });
    return res.json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.put('/api/ordenes-mantenimiento/:id/checklist/:checklistId', autenticar, permitirRoles('Administrador', 'Tecnico', 'Supervisor'), async (req, res, next) => {
  try {
    if (typeof req.body.completed !== 'boolean') return res.status(400).json({ mensaje: 'Indica completed como true o false' });
    const order = await db.query('SELECT assigned_to, status FROM maintenance_orders WHERE id = $1', [req.params.id]);
    if (!order.rows[0]) return res.status(404).json({ mensaje: 'Orden no encontrada' });
    if (['Finalizada', 'Cancelada'].includes(order.rows[0].status)) return res.status(409).json({ mensaje: 'No se puede modificar el checklist de una orden cerrada' });
    if (req.usuario.rol === 'Tecnico' && Number(order.rows[0].assigned_to) !== Number(req.usuario.id_usuario)) {
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede completar el checklist' });
    }
    const { rows } = await db.query(
      `UPDATE maintenance_order_checklist SET completed = $1,
         completed_by = CASE WHEN $1 THEN $2::integer ELSE NULL::integer END,
         completed_at = CASE WHEN $1 THEN CURRENT_TIMESTAMP ELSE NULL END
       WHERE id = $3 AND order_id = $4 RETURNING *`,
      [req.body.completed, req.usuario.id_usuario, req.params.checklistId, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Elemento de checklist no encontrado' });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/programaciones', autenticar, async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, j.nombre_juego, j.codigo_juego, u.nombre_completo AS responsable
       FROM maintenance_schedules s JOIN juegos j ON j.id_juego = s.id_juego
       LEFT JOIN usuarios u ON u.id_usuario = s.assigned_to
       ORDER BY s.active DESC, s.next_due ASC`
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/programaciones', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  try {
    const { id_juego, assigned_to, title, description, priority, interval_days, next_due } = req.body;
    const days = Number(interval_days);
    if (!id_juego || !title?.trim() || !description?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(next_due || '') || !Number.isInteger(days) || days < 1 || days > 3650) {
      return res.status(400).json({ mensaje: 'Completa equipo, título, descripción, fecha y un intervalo de 1 a 3650 días' });
    }
    const { rows } = await db.query(
      `INSERT INTO maintenance_schedules (id_juego, assigned_to, title, description, priority, interval_days, next_due, created_by)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'Media'), $6, $7, $8) RETURNING *`,
      [id_juego, assigned_to || null, title.trim(), description.trim(), priority || 'Media', days, next_due, req.usuario.id_usuario]
    );
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Programación recurrente creada', modulo: 'Mantenimientos', descripcion: rows[0].title });
    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.patch('/api/programaciones/:id/estado', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  try {
    if (typeof req.body.active !== 'boolean') return res.status(400).json({ mensaje: 'Indica active como true o false' });
    const { rows } = await db.query(
      'UPDATE maintenance_schedules SET active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [req.body.active, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Programación no encontrada' });
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: req.body.active ? 'Programación activada' : 'Programación pausada', modulo: 'Mantenimientos', descripcion: rows[0].title });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/programaciones/procesar', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    await client.query('BEGIN');
    const { rows: schedules } = await client.query(
      `SELECT * FROM maintenance_schedules WHERE active = TRUE AND next_due <= CURRENT_DATE
       ORDER BY next_due FOR UPDATE SKIP LOCKED`
    );
    const created = [];
    const checklistBase = [
      'Confirmar aislamiento y señalización del equipo',
      'Verificar EPP requerido antes de intervenir',
      'Registrar resultado y evidencia del trabajo'
    ];
    for (const schedule of schedules) {
      let due = schedule.next_due;
      let count = 0;
      while (new Date(`${due}T00:00:00Z`) <= new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z') && count < 100) {
        const inserted = await client.query(
          `INSERT INTO maintenance_orders (order_code, id_juego, assigned_to, status, priority, description, schedule_id, scheduled_for)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (schedule_id, scheduled_for) WHERE schedule_id IS NOT NULL DO NOTHING
           RETURNING *`,
          [crearCodigo('ORD'), schedule.id_juego, schedule.assigned_to, ESTADOS.PENDIENTE, schedule.priority, `${schedule.title}: ${schedule.description}`, schedule.id, due]
        );
        if (inserted.rows[0]) {
          for (const description of checklistBase) {
            await client.query('INSERT INTO maintenance_order_checklist (order_id, description) VALUES ($1, $2) ON CONFLICT DO NOTHING', [inserted.rows[0].id, description]);
          }
          await registrarHistorialOrden(client, { orderId: inserted.rows[0].id, actorId: req.usuario.id_usuario, action: 'Creada', toStatus: ESTADOS.PENDIENTE, reason: `Generada por programación recurrente ${schedule.id}; fecha prevista ${due}` });
          created.push(inserted.rows[0]);
        }
        const nextDate = new Date(`${due}T00:00:00Z`);
        nextDate.setUTCDate(nextDate.getUTCDate() + Number(schedule.interval_days));
        due = nextDate.toISOString().slice(0, 10);
        count += 1;
      }
      await client.query('UPDATE maintenance_schedules SET next_due = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [due, schedule.id]);
    }
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Órdenes recurrentes procesadas', modulo: 'Mantenimientos', descripcion: `${created.length} órdenes generadas` });
    return res.json({ generadas: created.length, ordenes: created });
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/ordenes-mantenimiento/:id/horas', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT w.*, u.nombre_completo AS tecnico,
              (w.hours_worked * w.hourly_rate)::numeric(12,2) AS costo_total
       FROM maintenance_work_logs w
       LEFT JOIN usuarios u ON u.id_usuario = w.user_id
       WHERE w.order_id = $1
       ORDER BY w.work_date DESC, w.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/ordenes-mantenimiento/:id/horas', autenticar, permitirRoles('Administrador', 'Tecnico', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const { work_date, hours_worked, description, progress_status, evidence } = req.body;
    const horas = normalizarHoras(hours_worked);

    if (horas <= 0) {
      return res.status(400).json({ mensaje: 'Las horas trabajadas deben ser mayores a 0' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ mensaje: 'La descripcion del trabajo realizado es obligatoria' });
    }

    await client.query('BEGIN');

    const ordenResult = await client.query(
      'SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const orden = ordenResult.rows[0];

    if (!orden) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden de mantenimiento no encontrada' });
    }

    if (['Finalizada', 'Cancelada'].includes(orden.status)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(400).json({ mensaje: 'La orden ya no acepta nuevos registros de horas' });
    }

    if (!orden.epp_verified) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'Verifica el EPP antes de registrar horas' });
    }
    if (req.usuario.rol === 'Tecnico' && Number(orden.assigned_to) !== Number(req.usuario.id_usuario)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede registrar horas' });
    }

    const horasResult = await client.query(
      'SELECT COALESCE(SUM(hours_worked), 0)::numeric(5,2) AS total FROM maintenance_work_logs WHERE order_id = $1',
      [orden.id]
    );
    const totalActual = normalizarHoras(horasResult.rows[0].total);
    const maxHoras = normalizarHoras(orden.max_hours || 15);
    if (totalActual + horas > maxHoras) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(400).json({
        mensaje: `No se pueden registrar ${horas} horas. La orden va en ${totalActual}/${maxHoras} horas.`
      });
    }

    const logResult = await client.query(
      `INSERT INTO maintenance_work_logs
       (order_id, user_id, work_date, hours_worked, description, progress_status, evidence, hourly_rate)
       SELECT $1, $2, COALESCE($3, CURRENT_DATE), $4, $5, COALESCE($6, 'En proceso'), $7, costo_hora
       FROM usuarios WHERE id_usuario = $2
       RETURNING *`,
      [
        orden.id,
        req.usuario.id_usuario,
        work_date || null,
        horas,
        description,
        progress_status,
        evidence || null
      ]
    );

    const nuevoTotal = totalActual + horas;
    await client.query(
      `UPDATE maintenance_orders
       SET total_hours = $1,
           status = CASE WHEN status = 'Pendiente' THEN 'En proceso' ELSE status END,
           start_date = COALESCE(start_date, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [nuevoTotal, orden.id]
    );

    if (orden.status === ESTADOS.PENDIENTE) {
      await registrarHistorialOrden(client, { orderId: orden.id, actorId: req.usuario.id_usuario, action: 'Estado', fromStatus: ESTADOS.PENDIENTE, toStatus: ESTADOS.PROCESO, reason: 'Inicio al registrar horas de trabajo' });
    }

    await client.query('COMMIT');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Horas registradas',
      modulo: 'Mantenimientos',
      descripcion: `${orden.order_code}: ${horas} horas`
    });

    return res.status(201).json({ ...logResult.rows[0], total_hours: nuevoTotal, max_hours: maxHoras });
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.put('/api/ordenes-mantenimiento/:id/finalizar', autenticar, permitirRoles('Administrador', 'Tecnico', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!current.rows[0]) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    const order = current.rows[0];
    if (!transicionValida(order.status, ESTADOS.FINALIZADA)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: `No se puede finalizar una orden en estado ${order.status}` });
    }
    if (!order.epp_verified) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'La orden no puede finalizar sin la verificación de EPP' });
    }
    if (req.usuario.rol === 'Tecnico' && Number(order.assigned_to) !== Number(req.usuario.id_usuario)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede finalizar esta orden' });
    }
    const checklist = await client.query(
      'SELECT COUNT(*)::int AS pendientes FROM maintenance_order_checklist WHERE order_id = $1 AND required = TRUE AND completed = FALSE',
      [order.id]
    );
    if (checklist.rows[0].pendientes > 0) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'Completa todos los puntos obligatorios del checklist antes de finalizar' });
    }
    const observations = String(req.body.observations || '').trim();
    const { rows } = await client.query(
      `UPDATE maintenance_orders SET status = $1, end_date = CURRENT_TIMESTAMP,
       observations = COALESCE(NULLIF($2, ''), observations), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [ESTADOS.FINALIZADA, observations, order.id]
    );
    await registrarHistorialOrden(client, { orderId: order.id, actorId: req.usuario.id_usuario, action: 'Estado', fromStatus: order.status, toStatus: ESTADOS.FINALIZADA, reason: observations || 'Trabajo completado' });
    await client.query('COMMIT');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Orden finalizada',
      modulo: 'Mantenimientos',
      descripcion: rows[0].order_code
    });

    return res.json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/mantenimientos', autenticar, async (req, res, next) => {
  try {
    res.json(await obtenerMantenimientos(req.query));
  } catch (error) {
    next(error);
  }
});

app.post('/api/mantenimientos', autenticar, permitirRoles('Administrador', 'Tecnico'), async (req, res, next) => {
  try {
    const { id_juego, id_tecnico, id_protocolo, tipo_mantenimiento, descripcion, observaciones } = req.body;

    const { rows } = await db.query(
      `INSERT INTO mantenimientos (id_juego, id_tecnico, id_protocolo, tipo_mantenimiento, descripcion, observaciones)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id_juego, id_tecnico || req.usuario.id_usuario, id_protocolo, tipo_mantenimiento, descripcion, observaciones]
    );

    const mantenimiento = rows[0];
    await db.query(
      `INSERT INTO checklist_mantenimiento (id_mantenimiento, id_paso)
       SELECT $1, id_paso
       FROM pasos_protocolo
       WHERE id_protocolo = $2 AND estado = TRUE`,
      [mantenimiento.id_mantenimiento, id_protocolo]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Mantenimiento creado',
      modulo: 'Mantenimientos',
      descripcion: `Orden ${mantenimiento.id_mantenimiento}`
    });

    res.status(201).json(mantenimiento);
  } catch (error) {
    next(error);
  }
});

app.get('/api/mantenimientos/:id/checklist', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT cm.*, pp.descripcion_paso, pp.obligatorio, pp.orden
       FROM checklist_mantenimiento cm
       JOIN pasos_protocolo pp ON pp.id_paso = cm.id_paso
       WHERE cm.id_mantenimiento = $1
       ORDER BY pp.orden`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.put('/api/checklist/:id', autenticar, permitirRoles('Administrador', 'Tecnico'), async (req, res, next) => {
  try {
    const { cumplido, observacion } = req.body;
    const { rows } = await db.query(
      `UPDATE checklist_mantenimiento
       SET cumplido = $1, observacion = $2, fecha_registro = CURRENT_TIMESTAMP
       WHERE id_checklist = $3
       RETURNING *`,
      [cumplido, observacion || null, req.params.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/mantenimientos/:id/evidencias', autenticar, upload.single('archivo'), async (req, res, next) => {
  try {
    const archivo = req.file;
    if (!archivo) return res.status(400).json({ mensaje: 'Selecciona un archivo de evidencia' });
    const { descripcion } = req.body;

    const { rows } = await db.query(
      `INSERT INTO evidencias (id_mantenimiento, id_usuario_subio, nombre_archivo, ruta_archivo, tipo_archivo, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id_evidencia, id_mantenimiento, id_usuario_subio, nombre_archivo, tipo_archivo, descripcion, fecha_subida`,
      [req.params.id, req.usuario.id_usuario, archivo.originalname, archivo.path, archivo.mimetype, descripcion || null]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Evidencia subida',
      modulo: 'Evidencias',
      descripcion: archivo.originalname
    });

    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/mantenimientos/:id/evidencias', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id_evidencia, id_mantenimiento, id_usuario_subio, nombre_archivo, tipo_archivo, descripcion, fecha_subida
       FROM evidencias WHERE id_mantenimiento = $1 ORDER BY fecha_subida DESC`,
      [req.params.id]
    );
    res.json(rows.map((row) => ({ ...row, url_descarga: `/api/evidencias/${row.id_evidencia}/archivo` })));
  } catch (error) {
    next(error);
  }
});

app.get('/api/evidencias/:id/archivo', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT ruta_archivo, nombre_archivo, tipo_archivo FROM evidencias WHERE id_evidencia = $1',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ mensaje: 'Evidencia no encontrada' });
    return res.download(rows[0].ruta_archivo, path.basename(rows[0].nombre_archivo), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/mantenimientos/:id/epp', autenticar, permitirRoles('Administrador', 'Tecnico'), async (req, res, next) => {
  try {
    const { verificado, evidencia, observaciones, destinatario } = req.body;
    const eppVerificado = verificado === true || verificado === 'true';

    if (eppVerificado && !evidencia) {
      return res.status(400).json({ mensaje: 'La evidencia del EPP es obligatoria' });
    }

    const { rows } = await db.query(
      `UPDATE mantenimientos
       SET epp_verificado = $1,
           epp_evidencia = $2,
           epp_observaciones = $3,
           epp_fecha = CURRENT_TIMESTAMP,
           epp_notificado = $4
       WHERE id_mantenimiento = $5
       RETURNING *`,
      [eppVerificado, eppVerificado ? evidencia : null, observaciones || null, !eppVerificado, req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ mensaje: 'Mantenimiento no encontrado' });
    }

    if (!eppVerificado) {
      await db.query(
        `INSERT INTO alertas_seguridad
         (id_mantenimiento, id_usuario, destinatario, prioridad, estado, mensaje)
         SELECT $1, $2, $3, 'Alta', 'Pendiente', $4
         WHERE NOT EXISTS (
           SELECT 1
           FROM alertas_seguridad
           WHERE id_mantenimiento = $1
             AND estado = 'Pendiente'
         )`,
        [
          req.params.id,
          req.usuario.id_usuario,
          destinatario || 'Ingeniero de turno / Encargado de area',
          `Orden ${req.params.id}: intento de realizar procedimiento sin equipo de proteccion personal completo`
        ]
      );
    }

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: eppVerificado ? 'EPP verificado' : 'Alerta por falta de EPP',
      modulo: 'Seguridad EPP',
      descripcion: `Orden ${req.params.id}`
    });

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/alertas-seguridad', autenticar, permitirRoles('Administrador', 'Supervisor', 'Auditor'), async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, u.nombre_completo AS usuario
       FROM alertas_seguridad a
       LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
       ORDER BY a.fecha_creacion DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.put('/api/alertas-seguridad/:id/atender', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE alertas_seguridad
       SET estado = 'Atendida', fecha_atencion = CURRENT_TIMESTAMP
       WHERE id_alerta = $1
       RETURNING *`,
      [req.params.id]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Alerta EPP atendida',
      modulo: 'Alertas',
      descripcion: `Alerta ${req.params.id}`
    });

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.get('/api/inventario', autenticar, async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT *,
              CASE WHEN stock_actual <= stock_minimo THEN 'Bajo stock' ELSE 'Disponible' END AS estado_stock
       FROM inventario_repuestos
       ORDER BY nombre_repuesto`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/inventario', autenticar, permitirRoles('Administrador'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const { codigo_repuesto, nombre_repuesto, categoria, unidad, stock_actual, stock_minimo, ubicacion, costo_unitario } = req.body;
    const stockInicial = Number(stock_actual || 0);
    const costo = Number(costo_unitario || 0);
    if (!codigo_repuesto?.trim() || !nombre_repuesto?.trim() || !Number.isFinite(stockInicial) || stockInicial < 0 || !Number.isFinite(costo) || costo < 0) {
      return res.status(400).json({ mensaje: 'Código, nombre, existencias y costo deben ser válidos' });
    }
    await client.query('BEGIN');
    const { rows } = await client.query(
      `INSERT INTO inventario_repuestos
       (codigo_repuesto, nombre_repuesto, categoria, unidad, stock_actual, stock_minimo, ubicacion, costo_unitario)
       VALUES ($1, $2, $3, COALESCE($4, 'Unidad'), $5, COALESCE($6, 0), $7, $8)
       RETURNING *`,
      [codigo_repuesto.trim(), nombre_repuesto.trim(), categoria, unidad, stockInicial, stock_minimo, ubicacion, costo]
    );

    if (stockInicial > 0) {
      await client.query(
        `INSERT INTO inventory_movements (part_id, actor_id, movement_type, quantity, stock_before, stock_after, unit_cost, reason)
         VALUES ($1, $2, 'Entrada', $3, 0, $3, $4, 'Existencia inicial al crear repuesto')`,
        [rows[0].id_repuesto, req.usuario.id_usuario, stockInicial, costo]
      );
    }
    await client.query('COMMIT');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Repuesto registrado',
      modulo: 'Inventario',
      descripcion: `${codigo_repuesto} - ${nombre_repuesto}`
    });

    res.status(201).json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/inventario/movimientos', autenticar, async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT mv.*, ir.codigo_repuesto, ir.nombre_repuesto, u.nombre_completo AS responsable, o.order_code
       FROM inventory_movements mv JOIN inventario_repuestos ir ON ir.id_repuesto = mv.part_id
       LEFT JOIN usuarios u ON u.id_usuario = mv.actor_id
       LEFT JOIN maintenance_orders o ON o.id = mv.order_id
       ORDER BY mv.created_at DESC LIMIT 500`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/inventario/:id/movimientos', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const { movement_type: movementType, reason } = req.body;
    const amount = Number(req.body.quantity);
    const inputCost = Number(req.body.unit_cost || 0);
    const reasonText = String(reason || '').trim();
    if (!['Entrada', 'Salida', 'Ajuste'].includes(movementType) || !Number.isFinite(amount) || amount < 0 || (movementType !== 'Ajuste' && amount === 0) || !reasonText || !Number.isFinite(inputCost) || (movementType === 'Entrada' && inputCost < 0)) {
      return res.status(400).json({ mensaje: 'Tipo, cantidad y motivo válidos son obligatorios' });
    }
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM inventario_repuestos WHERE id_repuesto = $1 FOR UPDATE', [req.params.id]);
    if (!found.rows[0]) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Repuesto no encontrado' });
    }
    const part = found.rows[0];
    const before = Number(part.stock_actual);
    const currentCost = Number(part.costo_unitario || 0);
    let after = before;
    let movementQuantity = amount;
    let cost = currentCost;
    if (movementType === 'Entrada') {
      after += amount;
      cost = after ? ((before * currentCost) + (amount * inputCost)) / after : inputCost;
    } else if (movementType === 'Salida') {
      if (amount > before) {
        await client?.query('ROLLBACK').catch(() => {});
        return res.status(409).json({ mensaje: 'La salida supera las existencias disponibles' });
      }
      after -= amount;
    } else {
      after = amount;
      movementQuantity = Math.abs(after - before);
    }
    await client.query('UPDATE inventario_repuestos SET stock_actual = $1, costo_unitario = $2, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_repuesto = $3', [after, cost, part.id_repuesto]);
    const { rows } = await client.query(
      `INSERT INTO inventory_movements (part_id, actor_id, movement_type, quantity, stock_before, stock_after, unit_cost, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [part.id_repuesto, req.usuario.id_usuario, movementType, movementQuantity, before, after, movementType === 'Entrada' ? inputCost : currentCost, reasonText]
    );
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: `Inventario: ${movementType.toLowerCase()}`, modulo: 'Inventario', descripcion: `${part.codigo_repuesto}, ${before} -> ${after}. ${reasonText}` });
    return res.status(201).json(rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.get('/api/mantenimientos/:id/repuestos', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT rm.*, ir.codigo_repuesto, ir.nombre_repuesto, u.nombre_completo AS usuario
       FROM repuestos_mantenimiento rm
       JOIN inventario_repuestos ir ON ir.id_repuesto = rm.id_repuesto
       JOIN usuarios u ON u.id_usuario = rm.id_usuario
       WHERE rm.id_mantenimiento = $1
       ORDER BY rm.fecha_registro DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/ordenes-mantenimiento/:id/repuestos', autenticar, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, i.codigo_repuesto, i.nombre_repuesto, u.nombre_completo AS responsable,
              (p.quantity * p.unit_cost)::numeric(12,2) AS costo_total
       FROM maintenance_order_parts p
       JOIN inventario_repuestos i ON i.id_repuesto = p.part_id
       LEFT JOIN usuarios u ON u.id_usuario = p.user_id
       WHERE p.order_id = $1 ORDER BY p.created_at DESC`, [req.params.id]
    );
    return res.json(rows);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/ordenes-mantenimiento/:id/repuestos', autenticar, permitirRoles('Administrador', 'Supervisor', 'Tecnico'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const partId = Number(req.body.part_id);
    const quantity = Number(req.body.quantity);
    const reason = String(req.body.reason || '').trim();
    if (!Number.isInteger(partId) || partId <= 0 || !Number.isFinite(quantity) || quantity <= 0 || reason.length < 4) {
      return res.status(400).json({ mensaje: 'Selecciona un repuesto, cantidad positiva y motivo (mínimo 4 caracteres)' });
    }
    await client.query('BEGIN');
    const orderResult = await client.query('SELECT * FROM maintenance_orders WHERE id = $1 FOR UPDATE', [req.params.id]);
    const order = orderResult.rows[0];
    if (!order) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Orden no encontrada' });
    }
    if (order.status !== ESTADOS.PROCESO) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'Los repuestos solo se pueden consumir en órdenes en proceso' });
    }
    if (!order.epp_verified) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: 'Verifica el EPP antes de consumir repuestos' });
    }
    if (req.usuario.rol === 'Tecnico' && Number(order.assigned_to) !== Number(req.usuario.id_usuario)) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(403).json({ mensaje: 'Solo el responsable asignado puede registrar repuestos' });
    }
    const partResult = await client.query('SELECT * FROM inventario_repuestos WHERE id_repuesto = $1 AND estado = TRUE FOR UPDATE', [partId]);
    const part = partResult.rows[0];
    if (!part) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Repuesto no encontrado o desactivado' });
    }
    const before = Number(part.stock_actual);
    if (quantity > before) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(409).json({ mensaje: `Stock insuficiente: disponibles ${before}` });
    }
    const cost = Number(part.costo_unitario || 0);
    const after = before - quantity;
    await client.query('UPDATE inventario_repuestos SET stock_actual = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id_repuesto = $2', [after, partId]);
    const { rows } = await client.query(
      `INSERT INTO maintenance_order_parts (order_id, part_id, user_id, quantity, unit_cost, reason)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [order.id, partId, req.usuario.id_usuario, quantity, cost, reason]
    );
    await client.query(
      `INSERT INTO inventory_movements (part_id, order_id, actor_id, movement_type, quantity, stock_before, stock_after, unit_cost, reason)
       VALUES ($1, $2, $3, 'Salida', $4, $5, $6, $7, $8)`,
      [partId, order.id, req.usuario.id_usuario, quantity, before, after, cost, `Orden ${order.order_code}: ${reason}`]
    );
    await client.query('COMMIT');
    await registrarAuditoria({ idUsuario: req.usuario.id_usuario, accion: 'Repuesto consumido en orden', modulo: 'Inventario', descripcion: `${part.codigo_repuesto} x ${quantity}; orden ${order.order_code}` });
    return res.status(201).json({ ...rows[0], codigo_repuesto: part.codigo_repuesto, nombre_repuesto: part.nombre_repuesto, costo_total: quantity * cost });
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.post('/api/mantenimientos/:id/repuestos', autenticar, permitirRoles('Administrador', 'Supervisor', 'Tecnico'), async (req, res, next) => {
  let client;
  try {
    client = await db.pool.connect();
    const { id_repuesto, cantidad, evidencia, observaciones } = req.body;
    const cantidadUsada = Number(cantidad || 0);

    if (!id_repuesto || !Number.isFinite(cantidadUsada) || cantidadUsada <= 0 || String(observaciones || '').trim().length < 4) {
      return res.status(400).json({ mensaje: 'Repuesto y cantidad son obligatorios' });
    }

    await client.query('BEGIN');

    const repuestoResult = await client.query(
      'SELECT * FROM inventario_repuestos WHERE id_repuesto = $1 FOR UPDATE',
      [id_repuesto]
    );
    const repuesto = repuestoResult.rows[0];

    if (!repuesto) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(404).json({ mensaje: 'Repuesto no encontrado' });
    }

    if (Number(repuesto.stock_actual) < cantidadUsada) {
      await client?.query('ROLLBACK').catch(() => {});
      return res.status(400).json({ mensaje: 'Stock insuficiente para registrar el cambio' });
    }

    const stockAntes = Number(repuesto.stock_actual);
    const costoUnitario = Number(repuesto.costo_unitario || 0);

    await client.query(
      `UPDATE inventario_repuestos
       SET stock_actual = stock_actual - $1, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id_repuesto = $2`,
      [cantidadUsada, id_repuesto]
    );

    await client.query(
      `INSERT INTO inventory_movements (part_id, actor_id, movement_type, quantity, stock_before, stock_after, unit_cost, reason)
       VALUES ($1, $2, 'Salida', $3, $4, $5, $6, $7)`,
      [id_repuesto, req.usuario.id_usuario, cantidadUsada, stockAntes, stockAntes - cantidadUsada, costoUnitario, `Mantenimiento ${req.params.id}: ${String(observaciones).trim()}`]
    );

    const movimientoResult = await client.query(
      `INSERT INTO repuestos_mantenimiento
       (id_mantenimiento, id_repuesto, id_usuario, cantidad, evidencia, observaciones, costo_unitario)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.params.id, id_repuesto, req.usuario.id_usuario, cantidadUsada, evidencia || null, observaciones || null, costoUnitario]
    );

    await client.query('COMMIT');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Repuesto usado',
      modulo: 'Inventario',
      descripcion: `${repuesto.nombre_repuesto} x${cantidadUsada} en orden ${req.params.id}`
    });

    return res.status(201).json(movimientoResult.rows[0]);
  } catch (error) {
    await client?.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally {
    client?.release();
  }
});

app.post('/api/mantenimientos/:id/enviar-revision', autenticar, permitirRoles('Administrador', 'Tecnico'), async (req, res, next) => {
  try {
    const epp = await db.query(
      `SELECT epp_verificado, epp_evidencia
       FROM mantenimientos
       WHERE id_mantenimiento = $1`,
      [req.params.id]
    );

    if (!epp.rows[0]?.epp_verificado || !epp.rows[0]?.epp_evidencia) {
      return res.status(400).json({ mensaje: 'La verificacion EPP con evidencia es obligatoria' });
    }

    const pendientes = await db.query(
      `SELECT COUNT(*)::int AS total
       FROM checklist_mantenimiento cm
       JOIN pasos_protocolo pp ON pp.id_paso = cm.id_paso
       WHERE cm.id_mantenimiento = $1
         AND pp.obligatorio = TRUE
         AND cm.cumplido = FALSE`,
      [req.params.id]
    );

    if (pendientes.rows[0].total > 0) {
      return res.status(400).json({ mensaje: 'Existen pasos obligatorios sin cumplir' });
    }

    const { rows } = await db.query(
      `UPDATE mantenimientos
       SET estado = 'En revision'
       WHERE id_mantenimiento = $1
       RETURNING *`,
      [req.params.id]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Mantenimiento enviado a revision',
      modulo: 'Mantenimientos',
      descripcion: `Orden ${req.params.id}`
    });

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.post('/api/mantenimientos/:id/validar', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  try {
    const { observaciones } = req.body;

    await db.query(
      `INSERT INTO validaciones (id_mantenimiento, id_supervisor, resultado, observaciones)
       VALUES ($1, $2, 'Aprobado', $3)`,
      [req.params.id, req.usuario.id_usuario, observaciones || null]
    );

    const { rows } = await db.query(
      `UPDATE mantenimientos
       SET estado = 'Validado', fecha_fin = CURRENT_TIMESTAMP
       WHERE id_mantenimiento = $1
       RETURNING *`,
      [req.params.id]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Mantenimiento validado',
      modulo: 'Validaciones',
      descripcion: `Orden ${req.params.id}`
    });

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/mantenimientos/:id/rechazar', autenticar, permitirRoles('Administrador', 'Supervisor'), async (req, res, next) => {
  try {
    const { observaciones } = req.body;
    if (!observaciones || !observaciones.trim()) {
      return res.status(400).json({ mensaje: 'Todo rechazo debe incluir observaciones' });
    }

    await db.query(
      `INSERT INTO validaciones (id_mantenimiento, id_supervisor, resultado, observaciones)
       VALUES ($1, $2, 'Rechazado', $3)`,
      [req.params.id, req.usuario.id_usuario, observaciones]
    );

    const { rows } = await db.query(
      `UPDATE mantenimientos
       SET estado = 'Rechazado'
       WHERE id_mantenimiento = $1
       RETURNING *`,
      [req.params.id]
    );

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Mantenimiento rechazado',
      modulo: 'Validaciones',
      descripcion: observaciones
    });

    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/reportes/personalizado', autenticar, permitirRoles('Administrador', 'Supervisor', 'Auditor'), async (req, res, next) => {
  try {
    const mantenimientos = await obtenerMantenimientos(req.query);
    const ordenes = await obtenerOrdenes(req.query);
    const solicitudesResult = await db.query(
      `SELECT r.*, u.nombre_completo AS solicitado_por, j.nombre_juego
       FROM maintenance_requests r
       LEFT JOIN usuarios u ON u.id_usuario = r.requested_by
       LEFT JOIN juegos j ON j.id_juego = r.id_juego
       ORDER BY r.created_at DESC`
    );
    const resumen = mantenimientos.reduce((acc, item) => {
      acc.total += 1;
      acc.por_estado[item.estado] = (acc.por_estado[item.estado] || 0) + 1;
      acc.por_tipo[item.tipo_mantenimiento] = (acc.por_tipo[item.tipo_mantenimiento] || 0) + 1;
      return acc;
    }, { total: 0, por_estado: {}, por_tipo: {} });
    resumen.ordenes = ordenes.length;
    resumen.solicitudes = solicitudesResult.rows.length;
    resumen.horas_trabajadas = ordenes.reduce((total, item) => total + Number(item.horas_trabajadas || 0), 0);

    res.json({
      sistema: 'RickySafe Maintenance',
      tipo_reporte: 'Personalizado',
      generado_por: req.usuario.nombre,
      fecha_generacion: new Date().toISOString(),
      filtros: req.query,
      resumen,
      resultados: mantenimientos,
      solicitudes: solicitudesResult.rows,
      ordenes
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/reportes/exportar/csv', autenticar, permitirRoles('Administrador', 'Supervisor', 'Auditor'), async (req, res, next) => {
  try {
    const mantenimientos = await obtenerMantenimientos(req.query);
    const ordenes = await obtenerOrdenes(req.query);
    if (!mantenimientos.length && !ordenes.length) {
      return res.status(404).json({ mensaje: 'No hay información para exportar' });
    }
    const valorCsv = (valor) => `"${String(valor ?? '').replaceAll('"', '""')}"`;
    const filasBase = [
      ['Sistema', 'RickySafe Maintenance'],
      ['Tipo de reporte', 'Personalizado'],
      ['Fecha de generacion', new Date().toISOString()],
      ['Usuario', req.usuario.nombre],
      [],
      ['Mantenimientos'],
      ['ID', 'Juego', 'Tipo', 'Tecnico', 'Estado', 'Fecha inicio', 'Supervisor', 'Resultado']
    ];
    const filas = mantenimientos.map((item) => [
      item.id_mantenimiento,
      item.nombre_juego,
      item.tipo_mantenimiento,
      item.tecnico,
      item.estado,
      item.fecha_inicio,
      item.supervisor || 'Pendiente',
      item.resultado_validacion || 'Pendiente'
    ]);
    const filasOrdenes = [
      [],
      ['Ordenes de mantenimiento'],
      ['Codigo', 'Solicitud', 'Juego', 'Responsable', 'Prioridad', 'Estado', 'Fecha inicio', 'Fecha fin', 'Horas', 'Horas restantes', 'Observaciones'],
      ...ordenes.map((item) => [
        item.order_code,
        item.request_code || 'Directa',
        item.nombre_juego || 'Sin juego',
        item.responsable || 'Sin asignar',
        item.priority,
        item.status,
        item.start_date || 'Pendiente',
        item.end_date || 'Pendiente',
        `${item.horas_trabajadas || 0}/${item.max_hours || 15}`,
        item.horas_restantes,
        item.observations || ''
      ])
    ];
    const csv = '\uFEFFsep=;\n' + [...filasBase, ...filas, ...filasOrdenes]
      .map((row) => row.map(valorCsv).join(';'))
      .join('\n');

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Reporte exportado',
      modulo: 'Reportes',
      descripcion: 'CSV'
    });

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment('rickysafe-reporte.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

app.get('/api/reportes/exportar/excel', autenticar, permitirRoles('Administrador', 'Supervisor', 'Auditor'), async (req, res, next) => {
  try {
    const mantenimientos = await obtenerMantenimientos(req.query);
    const ordenes = await obtenerOrdenes(req.query);
    if (!mantenimientos.length && !ordenes.length) {
      return res.status(404).json({ mensaje: 'No hay información para exportar' });
    }
    const escaparXml = (valor) => String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
    const filaExcel = (celdas, estilo = '') => `<Row>${celdas.map((celda) => {
      const tipo = typeof celda === 'number' ? 'Number' : 'String';
      const style = estilo ? ` ss:StyleID="${estilo}"` : '';
      return `<Cell${style}><Data ss:Type="${tipo}">${escaparXml(celda)}</Data></Cell>`;
    }).join('')}</Row>`;

    const excel = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook
        xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#162238" /></Style>
          <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF" /><Interior ss:Color="#162238" ss:Pattern="Solid" /></Style>
        </Styles>
        <Worksheet ss:Name="Reporte">
          <Table>
            <Column ss:Width="55" />
            <Column ss:Width="150" />
            <Column ss:Width="105" />
            <Column ss:Width="170" />
            <Column ss:Width="100" />
            <Column ss:Width="150" />
            <Column ss:Width="150" />
            <Column ss:Width="110" />
            ${filaExcel(['RickySafe Maintenance'], 'Title')}
            ${filaExcel(['Reporte personalizado de mantenimientos'])}
            ${filaExcel(['Fecha de generacion', new Date().toISOString()])}
            ${filaExcel(['Usuario', req.usuario.nombre])}
            ${filaExcel([])}
            ${filaExcel(['Mantenimientos'], 'Title')}
            ${filaExcel(['ID', 'Juego', 'Tipo', 'Tecnico', 'Estado', 'Fecha inicio', 'Supervisor', 'Resultado'], 'Header')}
            ${mantenimientos.map((item) => filaExcel([
              item.id_mantenimiento,
              item.nombre_juego,
              item.tipo_mantenimiento,
              item.tecnico,
              item.estado,
              item.fecha_inicio,
              item.supervisor || 'Pendiente',
              item.resultado_validacion || 'Pendiente'
            ])).join('')}
            ${filaExcel([])}
            ${filaExcel(['Ordenes de mantenimiento'], 'Title')}
            ${filaExcel(['Codigo', 'Solicitud', 'Juego', 'Responsable', 'Prioridad', 'Estado', 'Inicio', 'Fin'], 'Header')}
            ${ordenes.map((item) => filaExcel([
              item.order_code,
              item.request_code || 'Directa',
              item.nombre_juego || 'Sin juego',
              item.responsable || 'Sin asignar',
              item.priority,
              item.status,
              item.start_date || 'Pendiente',
              item.end_date || 'Pendiente'
            ])).join('')}
            ${filaExcel(['Codigo', 'Horas trabajadas', 'Maximo', 'Horas restantes', 'Observaciones'], 'Header')}
            ${ordenes.map((item) => filaExcel([
              item.order_code,
              item.horas_trabajadas || 0,
              item.max_hours || 15,
              item.horas_restantes || 0,
              item.observations || ''
            ])).join('')}
          </Table>
        </Worksheet>
      </Workbook>
    `;

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Reporte exportado',
      modulo: 'Reportes',
      descripcion: 'Excel'
    });

    res.header('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.attachment('rickysafe-reporte.xls');
    res.send(excel);
  } catch (error) {
    next(error);
  }
});

app.get('/api/reportes/exportar/pdf', autenticar, permitirRoles('Administrador', 'Supervisor', 'Auditor'), async (req, res, next) => {
  try {
    const mantenimientos = await obtenerMantenimientos(req.query);
    const ordenes = await obtenerOrdenes(req.query);
    if (!mantenimientos.length && !ordenes.length) {
      return res.status(404).json({ mensaje: 'No hay información para exportar' });
    }

    await registrarAuditoria({
      idUsuario: req.usuario.id_usuario,
      accion: 'Reporte exportado',
      modulo: 'Reportes',
      descripcion: 'PDF'
    });

    res.header('Content-Type', 'application/pdf');
    res.attachment('rickysafe-reporte.pdf');

    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc
      .fillColor('#162238')
      .fontSize(20)
      .text('RickySafe Maintenance', 36, 34);
    doc
      .fillColor('#475569')
      .fontSize(10)
      .text('Reporte personalizado de mantenimientos', 36, 60)
      .text(`Fecha de generacion: ${new Date().toISOString()}`, 36, 76)
      .text(`Usuario: ${req.usuario.nombre}`, 36, 92);

    const resumen = mantenimientos.reduce((acc, item) => {
      acc.total += 1;
      acc.validados += item.estado === 'Validado' ? 1 : 0;
      acc.revision += item.estado === 'En revision' ? 1 : 0;
      acc.pendientes += item.estado === 'Pendiente' ? 1 : 0;
      return acc;
    }, { total: 0, validados: 0, revision: 0, pendientes: 0 });

    doc
      .roundedRect(36, 116, 760, 34, 4)
      .fill('#e8f5f4')
      .fillColor('#162238')
      .fontSize(10)
      .text(`Total: ${resumen.total}`, 48, 128)
      .text(`Validados: ${resumen.validados}`, 180, 128)
      .text(`En revision: ${resumen.revision}`, 330, 128)
      .text(`Pendientes: ${resumen.pendientes}`, 500, 128)
      .text(`Ordenes: ${ordenes.length}`, 650, 128);

    const columnas = [
      { label: 'ID', width: 34 },
      { label: 'Juego', width: 118 },
      { label: 'Tipo', width: 74 },
      { label: 'Tecnico', width: 138 },
      { label: 'Estado', width: 74 },
      { label: 'Fecha', width: 118 },
      { label: 'Supervisor', width: 118 },
      { label: 'Resultado', width: 86 }
    ];
    let y = 172;

    function dibujarFila(celdas, encabezado = false) {
      if (y > 540) {
        doc.addPage();
        y = 44;
      }

      let x = 36;
      const alto = encabezado ? 24 : 30;

      columnas.forEach((columna, index) => {
        doc
          .rect(x, y, columna.width, alto)
          .fillAndStroke(encabezado ? '#162238' : '#ffffff', '#cbd5e1');
        doc
          .fillColor(encabezado ? '#ffffff' : '#172033')
          .fontSize(encabezado ? 9 : 8)
          .text(String(celdas[index] ?? ''), x + 4, y + 7, {
            width: columna.width - 8,
            height: alto - 10,
            ellipsis: true
          });
        x += columna.width;
      });

      y += alto;
    }

    dibujarFila(columnas.map((columna) => columna.label), true);
    mantenimientos.forEach((item) => {
      dibujarFila([
        item.id_mantenimiento,
        item.nombre_juego,
        item.tipo_mantenimiento,
        item.tecnico,
        item.estado,
        item.fecha_inicio,
        item.supervisor || 'Pendiente',
        item.resultado_validacion || 'Pendiente'
      ]);
    });

    if (ordenes.length) {
      y += 18;
      if (y > 500) {
        doc.addPage();
        y = 44;
      }
      doc
        .fillColor('#162238')
        .fontSize(14)
        .text('Ordenes y horas trabajadas', 36, y);
      y += 24;

      const columnasOrdenes = [
        { label: 'Codigo', width: 84 },
        { label: 'Juego', width: 116 },
        { label: 'Responsable', width: 138 },
        { label: 'Prioridad', width: 70 },
        { label: 'Estado', width: 82 },
        { label: 'Horas', width: 70 },
        { label: 'Rest.', width: 54 },
        { label: 'Observaciones', width: 156 }
      ];

      function dibujarFilaOrden(celdas, encabezado = false) {
        if (y > 540) {
          doc.addPage();
          y = 44;
        }

        let x = 36;
        const alto = encabezado ? 24 : 32;

        columnasOrdenes.forEach((columna, index) => {
          doc
            .rect(x, y, columna.width, alto)
            .fillAndStroke(encabezado ? '#162238' : '#ffffff', '#cbd5e1');
          doc
            .fillColor(encabezado ? '#ffffff' : '#172033')
            .fontSize(encabezado ? 9 : 8)
            .text(String(celdas[index] ?? ''), x + 4, y + 7, {
              width: columna.width - 8,
              height: alto - 10,
              ellipsis: true
            });
          x += columna.width;
        });

        y += alto;
      }

      dibujarFilaOrden(columnasOrdenes.map((columna) => columna.label), true);
      ordenes.forEach((item) => {
        dibujarFilaOrden([
          item.order_code,
          item.nombre_juego || 'Sin juego',
          item.responsable || 'Sin asignar',
          item.priority,
          item.status,
          `${item.horas_trabajadas || 0}/${item.max_hours || 15}`,
          item.horas_restantes || 0,
          item.observations || ''
        ]);
      });
    }

    doc.end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/auditoria', autenticar, permitirRoles('Administrador', 'Auditor'), async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT a.*, u.nombre_completo
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id_usuario = a.id_usuario
       ORDER BY a.fecha_hora DESC
       LIMIT 300`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ mensaje: 'Ruta no encontrada' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'La solicitud supera el límite de 1 MB' });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo JSON no es válido' });
  }
  if (error.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ mensaje: 'Origen no autorizado' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ mensaje: 'El archivo supera el límite de 10 MB' });
  }
  if (error.message === 'Tipo de archivo no permitido') {
    return res.status(415).json({ mensaje: error.message });
  }
  res.status(500).json({
    mensaje: 'Error interno del servidor',
    detalle: process.env.NODE_ENV === 'production' ? undefined : error.message
  });
});

module.exports = app;
