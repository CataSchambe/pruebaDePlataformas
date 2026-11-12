import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();
const TABLE = 'productos';
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
  if (typeof descripcion !== 'string') {
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
      descripcion: descripcion.trim(),
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

// READ - listar todos (con búsqueda opcional ?q=texto)
router.get('/', async (req, res) => {
  let query = supabase.from(TABLE).select(COLUMNS).order('id', { ascending: true });

  const q = (req.query.q || '').toString().trim();
  if (q) query = query.ilike('nombre', `%${q}%`);

  const { data, error } = await query;
  if (error) throw error;
  res.json(data);
});

// READ - obtener uno
router.get('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const { data, error } = await supabase.from(TABLE).select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(data);
});

// CREATE
router.post('/', async (req, res) => {
  const { data: producto, error: validationError } = validarProducto(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { data, error } = await supabase.from(TABLE).insert(producto).select(COLUMNS).single();
  if (error) throw error;
  res.status(201).json(data);
});

// UPDATE
router.put('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const { data: producto, error: validationError } = validarProducto(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { data, error } = await supabase
    .from(TABLE)
    .update(producto)
    .eq('id', id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.json(data);
});

// DELETE
router.delete('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;

  const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) return res.status(404).json({ error: 'Producto no encontrado.' });
  res.status(204).end();
});

export default router;
