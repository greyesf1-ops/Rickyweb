require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function ejecutarArchivo(ruta) {
  const sql = fs.readFileSync(ruta, 'utf8')
    .split('\n')
    .filter((linea) => !linea.trim().toUpperCase().startsWith('CREATE EXTENSION'))
    .join('\n');
  await db.query(sql);
}

async function main() {
  const databaseDir = path.resolve(__dirname, '..', 'database');
  const schemaPath = path.join(databaseDir, 'schema.sql');
  const seedPath = path.join(databaseDir, 'seed.sql');

  if (!fs.existsSync(schemaPath)) {
    console.log('Migracion omitida: no se encontro database/schema.sql');
    return;
  }

  console.log('Aplicando schema.sql...');
  await ejecutarArchivo(schemaPath);

  if (fs.existsSync(seedPath)) {
    console.log('Aplicando seed.sql...');
    await ejecutarArchivo(seedPath);
  }

  console.log('Migracion finalizada.');
}

main()
  .catch((error) => {
    console.error('Error ejecutando migracion:', error);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
