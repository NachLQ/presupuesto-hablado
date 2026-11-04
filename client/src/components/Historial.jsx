import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { generarPdf } from '../lib/pdf.js';

const eur = (n) => Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ESTADOS = [
  { id: '', label: 'Todos' },
  { id: 'borrador', label: 'Borradores' },
  { id: 'enviado', label: 'Enviados' },
  { id: 'aceptado', label: 'Aceptados' },
  { id: 'rechazado', label: 'Rechazados' },
];
const COLOR_ESTADO = {
  borrador: 'bg-slate-100 text-slate-600',
  enviado: 'bg-blue-100 text-blue-700',
  aceptado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
};

function fecha(s) {
  if (!s) return '';
  return new Date(s.replace(' ', 'T')).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Historial({ recargaSenal, onEditar }) {
  const [lista, setLista] = useState([]);
  const [estado, setEstado] = useState('');
  const [cliente, setCliente] = useState('');

  const cargar = async () => {
    setLista(await api.getPresupuestos({ estado, cliente }));
  };
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [estado, recargaSenal]);

  const buscar = (e) => {
    e.preventDefault();
    cargar();
  };

  const exportar = async (id) => {
    const datos = await api.exportarPdf(id, false);
    generarPdf(datos);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este presupuesto?')) return;
    await api.eliminarPresupuesto(id);
    cargar();
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Historial</h1>

      <form onSubmit={buscar} className="flex gap-2">
        <input
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          placeholder="Buscar por cliente…"
          className="flex-1 rounded-xl border border-slate-300 p-2.5"
        />
        <button className="bg-pizarra-800 text-white px-4 rounded-xl font-medium">Buscar</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button
            key={e.id}
            onClick={() => setEstado(e.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${
              estado === e.id ? 'bg-marca-600 text-white border-marca-600' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {lista.length === 0 && (
        <p className="text-center text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5">
          No hay presupuestos.
        </p>
      )}

      <div className="space-y-2">
        {lista.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{p.cliente_nombre || 'Sin cliente'}</p>
                <p className="text-sm text-slate-500 truncate">{p.descripcion || '—'}</p>
              </div>
              <span className={`shrink-0 text-[11px] uppercase font-bold px-2 py-1 rounded-full ${COLOR_ESTADO[p.estado]}`}>
                {p.estado}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">Nº {String(p.id).padStart(4, '0')} · {fecha(p.created_at)}</span>
              <span className="font-bold text-marca-700">{eur(p.totales?.total_con_iva)} €</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => onEditar(p.id)} className="flex-1 text-sm border border-slate-300 text-slate-600 py-2 rounded-lg font-medium">Abrir / editar</button>
              <button onClick={() => exportar(p.id)} className="flex-1 text-sm bg-marca-600 text-white py-2 rounded-lg font-medium">PDF</button>
              <button onClick={() => eliminar(p.id)} className="px-3 text-sm text-red-500 border border-red-200 rounded-lg">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
