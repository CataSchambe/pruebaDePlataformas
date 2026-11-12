import { useCallback, useEffect, useState } from 'react';
import { productosApi } from './api.js';
import ProductoForm from './components/ProductoForm.jsx';
import ProductoTabla from './components/ProductoTabla.jsx';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [editando, setEditando] = useState(null); // producto en edición o null
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async (q = '') => {
    setCargando(true);
    setError('');
    try {
      setProductos(await productosApi.listar(q));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial + búsqueda con "debounce"
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda.trim()), 300);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  // El aviso de éxito desaparece solo
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 3000);
    return () => clearTimeout(t);
  }, [aviso]);

  async function handleGuardar(datos) {
    setGuardando(true);
    setError('');
    try {
      if (editando) {
        const actualizado = await productosApi.actualizar(editando.id, datos);
        setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
        setAviso(`"${actualizado.nombre}" actualizado correctamente.`);
        setEditando(null);
      } else {
        const nuevo = await productosApi.crear(datos);
        setProductos((prev) => [...prev, nuevo]);
        setAviso(`"${nuevo.nombre}" creado correctamente.`);
      }
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return;
    setError('');
    try {
      await productosApi.eliminar(producto.id);
      setProductos((prev) => prev.filter((p) => p.id !== producto.id));
      if (editando?.id === producto.id) setEditando(null);
      setAviso(`"${producto.nombre}" eliminado.`);
    } catch (e) {
      setError(e.message);
    }
  }

  const valorInventario = productos.reduce((acc, p) => acc + Number(p.precio) * p.stock, 0);

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>📦 Gestión de Productos</h1>
          <p className="subtitle">React · Node.js en Cloud Run · TiDB Cloud</p>
        </div>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{productos.length}</span>
            <span className="stat-label">Productos</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {valorInventario.toLocaleString('es', { style: 'currency', currency: 'USD' })}
            </span>
            <span className="stat-label">Valor inventario</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>⚠️ {error}</span>
          <button className="alert-close" onClick={() => setError('')} aria-label="Cerrar">
            ×
          </button>
        </div>
      )}
      {aviso && (
        <div className="alert alert-success" role="status">
          ✅ {aviso}
        </div>
      )}

      <main className="layout">
        <section className="card">
          <h2>{editando ? '✏️ Editar producto' : '➕ Nuevo producto'}</h2>
          <ProductoForm
            key={editando?.id ?? 'nuevo'}
            inicial={editando}
            guardando={guardando}
            onGuardar={handleGuardar}
            onCancelar={() => setEditando(null)}
          />
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Listado</h2>
            <input
              type="search"
              className="search"
              placeholder="Buscar por nombre…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <ProductoTabla
            productos={productos}
            cargando={cargando}
            editandoId={editando?.id}
            onEditar={setEditando}
            onEliminar={handleEliminar}
          />
        </section>
      </main>
    </div>
  );
}
