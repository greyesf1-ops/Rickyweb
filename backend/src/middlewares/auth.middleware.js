const jwt = require('jsonwebtoken');

function crearAutenticador(db) {
  return async function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ mensaje: 'Autenticación no configurada' });
  }
  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ mensaje: 'Token invalido' });
  }
  try {
    const { rows } = await db.query(
      `SELECT u.id_usuario, u.nombre_completo, u.correo, u.estado, r.nombre_rol AS rol
       FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.id_usuario = $1`, [claims.id_usuario]
    );
    if (!rows[0] || !rows[0].estado) return res.status(401).json({ mensaje: 'La sesión ya no está activa' });
    req.usuario = { ...claims, ...rows[0], nombre: rows[0].nombre_completo };
    return next();
  } catch (error) {
    return next(error);
  }
  };
}

const db = require('../config/database');
module.exports = { autenticar: crearAutenticador(db), crearAutenticador };
