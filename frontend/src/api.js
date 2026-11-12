const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está el backend en ejecución?');
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  return data;
}

export const productosApi = {
  listar: (q = '') => request(`/productos${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  obtener: (id) => request(`/productos/${id}`),
  crear: (producto) => request('/productos', { method: 'POST', body: JSON.stringify(producto) }),
  actualizar: (id, producto) =>
    request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(producto) }),
  eliminar: (id) => request(`/productos/${id}`, { method: 'DELETE' }),
};
