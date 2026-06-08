const db = require('../config/database');

async function registrarAuditoria({ idUsuario, accion, modulo, descripcion }) {
  await db.query(
    `INSERT INTO auditoria (id_usuario, accion, modulo, descripcion)
     VALUES ($1, $2, $3, $4)`,
    [idUsuario || null, accion, modulo, descripcion || null]
  );
}

module.exports = { registrarAuditoria };

