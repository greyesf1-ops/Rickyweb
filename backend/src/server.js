const app = require('./app');

const port = Number(process.env.PORT || 3001);

if (process.env.NODE_ENV === 'production' && (
  !process.env.JWT_SECRET
  || process.env.JWT_SECRET.length < 32
  || /reemplaza|cambia|example|secret|password/i.test(process.env.JWT_SECRET)
)) {
  throw new Error('Define JWT_SECRET como una clave aleatoria de al menos 32 caracteres en producción');
}

if (process.env.NODE_ENV === 'production' && (
  !process.env.DB_PASSWORD
  || /tu_contrasena|reemplaza|cambia|example|password/i.test(process.env.DB_PASSWORD)
)) {
  throw new Error('Define DB_PASSWORD como una contraseña propia en producción');
}

const server = app.listen(port, () => {
  console.log(`RickySafe Maintenance API escuchando en http://localhost:${port}`);
});

function cerrar(signal) {
  console.log(`Recibida señal ${signal}; cerrando API...`);
  server.close(() => {
    const db = require('./config/database');
    db.pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => cerrar('SIGTERM'));
process.on('SIGINT', () => cerrar('SIGINT'));
