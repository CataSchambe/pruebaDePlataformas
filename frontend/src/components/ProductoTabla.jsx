const formatoPrecio = (n) =>
  Number(n).toLocaleString('es', { style: 'currency', currency: 'USD' });

export default function ProductoTabla({ productos, cargando, editandoId, onEditar, onEliminar }) {
  if (cargando && productos.length === 0) {
    return <p className="empty">Cargando productos…</p>;
  }

  if (productos.length === 0) {
    return <p className="empty">No hay productos. ¡Crea el primero!</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th className="num">Precio</th>
            <th className="num">Stock</th>
            <th className="actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className={p.id === editandoId ? 'row-active' : ''}>
              <td className="muted">{p.id}</td>
              <td>
                <div className="name">{p.nombre}</div>
                {p.descripcion && <div className="desc">{p.descripcion}</div>}
              </td>
              <td className="num">{formatoPrecio(p.precio)}</td>
              <td className="num">
                <span className={`badge ${p.stock === 0 ? 'badge-out' : p.stock < 10 ? 'badge-low' : 'badge-ok'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="actions">
                <button className="btn btn-small" onClick={() => onEditar(p)}>
                  Editar
                </button>
                <button className="btn btn-small btn-danger" onClick={() => onEliminar(p)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
