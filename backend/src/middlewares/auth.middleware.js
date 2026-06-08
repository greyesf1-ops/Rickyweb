const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mensaje: 'Token requerido' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'rickysafe_dev_secret');
    return next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token invalido' });
  }
}

module.exports = { autenticar };

