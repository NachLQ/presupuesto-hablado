// Cliente REST minimo. Vite hace proxy de /api -> http://localhost:4000
async function req(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    let detalle = '';
    try { detalle = (await res.json()).error || ''; } catch {}
    throw new Error(`${res.status} ${detalle}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Configuracion
  getConfiguracion: () => req('GET', '/api/configuracion'),
  guardarConfiguracion: (cfg) => req('PUT', '/api/configuracion', cfg),

  // Tarifario
  getTarifario: (oficio) => req('GET', `/api/tarifario${oficio ? `?oficio=${oficio}` : ''}`),
  crearConcepto: (c) => req('POST', '/api/tarifario', c),
  actualizarConcepto: (id, c) => req('PUT', `/api/tarifario/${id}`, c),
  eliminarConcepto: (id) => req('DELETE', `/api/tarifario/${id}`),
  importarOficio: (oficio) => req('POST', '/api/tarifario/importar-oficio', { oficio }),

  // Parser
  parsear: (texto) => req('POST', '/api/parser', { texto }),

  // Presupuestos
  getPresupuestos: (filtros = {}) => {
    const qs = new URLSearchParams();
    if (filtros.estado) qs.set('estado', filtros.estado);
    if (filtros.cliente) qs.set('cliente', filtros.cliente);
    const s = qs.toString();
    return req('GET', `/api/presupuestos${s ? `?${s}` : ''}`);
  },
  getPresupuesto: (id) => req('GET', `/api/presupuestos/${id}`),
  crearPresupuesto: (p) => req('POST', '/api/presupuestos', p),
  actualizarPresupuesto: (id, p) => req('PUT', `/api/presupuestos/${id}`, p),
  eliminarPresupuesto: (id) => req('DELETE', `/api/presupuestos/${id}`),
  exportarPdf: (id, marcar_enviado) => req('POST', `/api/presupuestos/${id}/exportar-pdf`, { marcar_enviado }),
};
