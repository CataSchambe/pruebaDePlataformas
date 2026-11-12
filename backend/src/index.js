import express from 'express';
import cors from 'cors';
import productosRouter from './routes/productos.js';
import { pool } from './db.js';

const app = express();
// Cloud Run inyecta la variable PORT (por defecto 8080)
const PORT = Number(process.env.PORT) || 8080;

// CORS: lista de orígenes permitidos separados por coma.
// Ej: ALLOWED_ORIGINS=https://mi-app.netlify.app,http://localhost:5173
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('⚠️  ALLOWED_ORIGINS no está definido: se permiten peticiones desde cualquier origen.');
}

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '100kb' }));

// Healthcheck
app.get('/', (_req, res) => res.json({ status: 'ok', service: 'crud-productos-api' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/health/db', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT VERSION() AS version');
    res.json({ status: 'ok', db: rows[0].version });
  } catch (err) {
    console.error('DB healthcheck:', err.message);
    res.status(503).json({ status: 'error', error: 'No se pudo conectar a la base de datos.' });
  }
});

app.use('/api/productos', productosRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// Manejo centralizado de errores (Express 5 captura errores async automáticamente)
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido.' });
  }
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
});
