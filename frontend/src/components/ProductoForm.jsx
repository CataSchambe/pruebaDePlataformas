import { useState } from 'react';

const VACIO = { nombre: '', descripcion: '', precio: '', stock: '' };

export default function ProductoForm({ inicial, guardando, onGuardar, onCancelar }) {
  const [form, setForm] = useState(
    inicial
      ? {
          nombre: inicial.nombre,
          descripcion: inicial.descripcion ?? '',
          precio: String(inicial.precio),
          stock: String(inicial.stock),
        }
      : VACIO
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await onGuardar({
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
      stock: Number(form.stock),
    });
    if (ok && !inicial) setForm(VACIO);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Nombre *
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          maxLength={120}
          required
          placeholder="Ej: Teclado mecánico"
        />
      </label>

      <label>
        Descripción
        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          rows={3}
          placeholder="Detalles del producto"
        />
      </label>

      <div className="form-row">
        <label>
          Precio *
          <input
            name="precio"
            type="number"
            min="0"
            step="0.01"
            value={form.precio}
            onChange={handleChange}
            required
            placeholder="0.00"
          />
        </label>
        <label>
          Stock *
          <input
            name="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={handleChange}
            required
            placeholder="0"
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Crear producto'}
        </button>
        {inicial && (
          <button type="button" className="btn btn-ghost" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
