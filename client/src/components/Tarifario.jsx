import { useEffect, useState } from 'react';
import { api } from '../api.js';

const OFICIOS = [
  { id: 'fontaneria', label: 'Fontanería' },
  { id: 'electricidad', label: 'Electricidad' },
  { id: 'reformas', label: 'Reformas' },
  { id: 'climatizacion', label: 'Climatización' },
  { id: 'general', label: 'General' },
];
const UNIDADES = ['unidad', 'hora', 'm2', 'ml', 'visita', 'metro'];
const eur = (n) => Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const VACIO = { oficio: 'fontaneria', nombre: '', precio_unitario: 0, unidad: 'unidad', sinonimos: [] };

export default function Tarifario({ recargaSenal }) {
  const [oficio, setOficio] = useState('fontaneria');
  const [conceptos, setConceptos] = useState([]);
  const [editando, setEditando] = useState(null); // objeto concepto o null
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      setConceptos(await api.getTarifario(oficio));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [oficio, recargaSenal]);

  const guardar = async (c) => {
    const payload = {
      oficio: c.oficio,
      nombre: c.nombre,
      precio_unitario: Number(c.precio_unitario) || 0,
      unidad: c.unidad,
      sinonimos: typeof c.sinonimos === 'string'
        ? c.sinonimos.split(',').map((s) => s.trim()).filter(Boolean)
        : c.sinonimos || [],
    };
    if (c.id) await api.actualizarConcepto(c.id, payload);
    else await api.crearConcepto(payload);
    setEditando(null);
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este concepto del tarifario?')) return;
    await api.eliminarConcepto(id);
    cargar();
  };

  const importar = async () => {
    await api.importarOficio(oficio);
    cargar();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Tarifario</h1>
        <button onClick={() => setEditando({ ...VACIO, oficio })} className="bg-marca-600 text-white text-sm font-semibold px-3 py-2 rounded-lg">
          + Nuevo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {OFICIOS.map((o) => (
          <button
            key={o.id}
            onClick={() => setOficio(o.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${
              oficio === o.id ? 'bg-pizarra-800 text-white border-pizarra-800' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {cargando && <p className="text-slate-400 text-sm">Cargando…</p>}

      {!cargando && conceptos.length === 0 && (
        <div className="text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5">
          <p className="text-slate-500 mb-3">No hay conceptos para este oficio.</p>
          <button onClick={importar} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg">
            Cargar diccionario de {OFICIOS.find((o) => o.id === oficio)?.label}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {conceptos.map((c) => (
          <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{c.nombre}</p>
              <p className="text-xs text-slate-400">por {c.unidad}{c.sinonimos?.length ? ` · ${c.sinonimos.length} sinónimos` : ''}</p>
            </div>
            <span className="font-bold text-slate-700">{eur(c.precio_unitario)} €</span>
            <button onClick={() => setEditando({ ...c, sinonimos: (c.sinonimos || []).join(', ') })} className="text-slate-400 text-lg">✏️</button>
            <button onClick={() => eliminar(c.id)} className="text-red-400 text-lg">🗑️</button>
          </div>
        ))}
      </div>

      {editando && (
        <EditorConcepto
          concepto={editando}
          onCancelar={() => setEditando(null)}
          onGuardar={guardar}
          oficios={OFICIOS}
          unidades={UNIDADES}
        />
      )}
    </section>
  );
}

function EditorConcepto({ concepto, onCancelar, onGuardar, oficios, unidades }) {
  const [c, setC] = useState(concepto);
  const set = (k, v) => setC((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center p-4" onClick={onCancelar}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-bold text-lg text-slate-800">{c.id ? 'Editar concepto' : 'Nuevo concepto'}</h2>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
          <input value={c.nombre} onChange={(e) => set('nombre', e.target.value)} className="w-full rounded-xl border border-slate-300 p-3" placeholder="Cambio grifo monomando" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Precio (€)</label>
            <input type="number" step="any" value={c.precio_unitario} onChange={(e) => set('precio_unitario', e.target.value)} className="w-full rounded-xl border border-slate-300 p-3" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Unidad</label>
            <select value={c.unidad} onChange={(e) => set('unidad', e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 bg-white">
              {unidades.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Oficio</label>
          <select value={c.oficio} onChange={(e) => set('oficio', e.target.value)} className="w-full rounded-xl border border-slate-300 p-3 bg-white">
            {oficios.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Sinónimos (cómo lo dices al dictar)</label>
          <input value={c.sinonimos} onChange={(e) => set('sinonimos', e.target.value)} className="w-full rounded-xl border border-slate-300 p-3" placeholder="grifo, grifo monomando, grifo de cocina" />
          <p className="text-xs text-slate-400 mt-1">Separa por comas. Ayuda al parser a reconocer el concepto.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onCancelar} className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-xl">Cancelar</button>
          <button onClick={() => onGuardar(c)} disabled={!c.nombre.trim()} className="flex-1 bg-marca-600 text-white font-bold py-3 rounded-xl disabled:opacity-40">Guardar</button>
        </div>
      </div>
    </div>
  );
}
