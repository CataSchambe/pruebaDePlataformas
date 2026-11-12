import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();
const COLUMNS = 'id, nombre, descripcion, precio, stock, created_at, updated_at';

/**
 * Valida y normaliza el cuerpo de la petición.
 * Devuelve { data } si es válido o { error } con un mensaje.
 */
function validarProducto(body = {}) {
  const { nombre, descripcion = '', precio, stock } = body;

  if (typeof nombre !== 'string' || !nombre.trim()) {
    return { error: 'El campo "nombre" es obligatorio.' };
  }
  if (nombre.trim().length > 120) {
    return { error: 'El "nombre" no puede superar 120 caracteres.' };
  }
  if (descripcion !== null && typeof descripcion !== 'string') {
    return { error: 'La "descripcion" debe ser texto.' };
  }

  const precioNum = Number(precio);
  if (precio === '' || precio === null || Number.isNaN(precioNum) || precioNum < 0) {
    return { error: 'El "precio" debe ser un número mayor o igual a 0.' };
  }

  const stockNum = Number(stock);
  if (stock === '' || stock === null || !Number.isInteger(stockNum) || stockNum < 0) {
    return { error: 'El "stock" debe ser un entero mayor o igual a 0.' };
  }

  return {
    data: {
      nombre: nombre.trim(),
      descripcion: (descripcion ?? '').trim(),
      precio: Math.round(precioNum * 100) / 100,
      stock: stockNum,
    },
  };
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'ID inválido.' });
    return null;
  }
  return id;
}

async function buscarPorId(id) {
  const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM productos WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

// READ - listar todos (con búsqueda opcional ?q=texto)
router.get('/', async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  const [rows] = q
    ? await pool.execute(`SELECT ${COLUMNS} FROM productos WHERE nombre LIKE ? ORDER BY id`, [
        `%${q}%`,
      ])
    : await pool.execute(`SELECT ${COLUMNS} FROM productos ORDER BY id`);

  res.json(rows);
});

// READ - obtener uno
router.get('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const producto = await buscarPorId(id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(producto);
});

// CREATE
router.post('/', async (req, res) => {
  const { data: p, error } = validarProducto(req.body);
  if (error) return res.status(400).json({ error });

  const [result] = await pool.execute(
    'INSERT INTO productos (nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?)',
    [p.nombre, p.descripcion, p.precio, p.stock]
  );
  res.status(201).json(await buscarPorId(result.insertId));
});

// UPDATE
router.put('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const { data: p, error } = validarProducto(req.body);
  if (error) return res.status(400).json({ error });

  if (!(await buscarPorId(id))) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }

  await pool.execute(
    'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
    [p.nombre, p.descripcion, p.precio, p.stock, id]
  );
  res.json(await buscarPorId(id));
});

// DELETE
router.delete('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.status(204).end();
});

export default router;
