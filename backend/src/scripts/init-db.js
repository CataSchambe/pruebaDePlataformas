// Crea la base de datos, la tabla y los datos de ejemplo en TiDB Cloud.
// Uso (desde /backend):  npm run db:init
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';

const { DB_HOST, DB_PORT = '4000', DB_USER, DB_PASSWORD, DB_SSL = 'true' } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error('❌ Faltan DB_HOST, DB_USER o DB_PASSWORD en el .env');
  process.exit(1);
}

const sql = await readFile(new URL('../../../database/schema.sql', import.meta.url), 'utf8');

const conn = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  multipleStatements: true,
});

try {
  await conn.query(sql);
  const [rows] = await conn.query('SELECT COUNT(*) AS total FROM crud_productos.productos');
  console.log(`✅ Esquema aplicado. Productos en la tabla: ${rows[0].total}`);
} finally {
  await conn.end();
}
