import mysql from 'mysql2/promise';

const {
  DB_HOST,
  DB_PORT = '4000',
  DB_USER,
  DB_PASSWORD,
  DB_NAME = 'crud_productos',
  DB_SSL = 'true',
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error(
    '❌ Faltan variables de entorno: DB_HOST, DB_USER y/o DB_PASSWORD. ' +
      'Revisa el archivo .env (local) o la configuración del servicio en Cloud Run.'
  );
  process.exit(1);
}

// Pool de conexiones a TiDB Cloud (compatible con MySQL).
// TiDB Cloud Starter/Serverless EXIGE TLS; la CA pública ya viene incluida en Node.js.
export const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 5,
  maxIdle: 5,
  idleTimeout: 60_000,
  enableKeepAlive: true,
  decimalNumbers: true, // DECIMAL -> number en lugar de string
});
