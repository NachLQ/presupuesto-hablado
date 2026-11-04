import { useState } from 'react';
import { api } from '../api.js';

const eur = (n) => Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const BADGE = {
  parser: { txt: 'voz', clase: 'bg-marca-100 text-marca-700' },
  tarifario: { txt: 'tarifario', clase: 'bg-blue-100 text-blue-700' },
  manual: { txt: 'manual', clase: 'bg-slate-100 text-slate-600' },
};

// Seccion 2 del flujo: tabla editable de lineas.
export default function RevisionLineas({ lineas, setLineas, noDetectado, totalBase, onActualizarTarifario }) {
  const [avisoTarifario, setAvisoTarifario] = useState(null); // { idx, tarifario_id, precio }

  const editar = (idx, campo, valor) => {
    setLineas((prev) => {
      const next = prev.map((l, i) => {
        if (i !== idx) return l;
        const actualizado = { ...l, [campo]: valor };
        const cant = Number(campo === 'cantidad' ? valor : actualizado.cantidad) || 0;
        const pu = Number(campo === 'precio_unitario' ? valor : actualizado.precio_unitario) || 0;
        actualizado.total = Math.round(cant * pu * 100) / 100;
        return actualizado;
      });
      return next;
    });
    // Si se corrige el precio de una linea que vino del tarifario, ofrece actualizarlo
    if (campo === 'precio_unitario') {
      const l = lineas[idx];
      if (l.origen === 'tarifario' && l.tarifario_id && Number(valor) !== Number(l.precio_unitario)) {
        setAvisoTarifario({ idx, tarifario_id: l.tarifario_id, precio: Number(valor), concepto: l.concepto });
      }
    }
  };

  const eliminar = (idx) => setLineas((prev) => prev.filter((_, i) => i !== idx));

  const mover = (idx, dir) => {
    setLineas((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const añadirLinea = () =>
    setLineas((prev) => [...prev, { concepto: '', cantidad: 1, precio_unitario: 0, total: 0, origen: 'manual', tarifario_id: null }]);

  const confirmarTarifario = async () => {
    try {
      await api.actualizarConcepto(avisoTarifario.tarifario_id, { precio_unitario: avisoTarifario.precio });
      onActualizarTarifario && onActualizarTarifario();
    } catch (e) {
      console.error(e);
    }
    setAvisoTarifario(null);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Líneas del presupuesto</h2>
        <span className="text-sm text-slate-500">{lineas.length} concepto(s)</span>
      </div>

      {lineas.length === 0 && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
          Aún no hay líneas. Dicta o escribe el trabajo, o añade una línea manualmente.
        </p>
      )}

      <div className="space-y-2">
        {lineas.map((l, idx) => {
          const badge = BADGE[l.origen] || BADGE.manual;
          return (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <input
                  value={l.concepto}
                  onChange={(e) => editar(idx, 'concepto', e.target.value)}
                  placeholder="Concepto"
                  className="flex-1 font-medium text-slate-800 border-b border-transparent focus:border-marca-400 outline-none py-1"
                />
                <span className={`shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badge.clase}`}>
                  {badge.txt}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number" inputMode="decimal" step="any" min="0"
                    value={l.cantidad}
                    onChange={(e) => editar(idx, 'cantidad', e.target.value)}
                    className="w-16 text-center rounded-lg border border-slate-300 py-1.5"
                  />
                  <span className="text-slate-400 text-sm">×</span>
                  <div className="relative">
                    <input
                      type="number" inputMode="decimal" step="any" min="0"
                      value={l.precio_unitario}
                      onChange={(e) => editar(idx, 'precio_unitario', e.target.value)}
                      className="w-20 text-right rounded-lg border border-slate-300 py-1.5 pr-5"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-bold text-slate-800">{eur(l.total)} €</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 text-slate-400">
                <button onClick={() => mover(idx, -1)} className="text-lg leading-none" aria-label="subir">↑</button>
                <button onClick={() => mover(idx, 1)} className="text-lg leading-none" aria-label="bajar">↓</button>
                <button onClick={() => eliminar(idx)} className="ml-auto text-sm text-red-500 font-medium">Eliminar</button>
              </div>

              {avisoTarifario && avisoTarifario.idx === idx && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900">
                    ¿Actualizar «{avisoTarifario.concepto}» a <strong>{eur(avisoTarifario.precio)} €</strong> en el tarifario?
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={confirmarTarifario} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium">
                      Sí, actualizar
                    </button>
                    <button onClick={() => setAvisoTarifario(null)} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600">
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={añadirLinea}
        className="w-full border-2 border-dashed border-slate-300 text-slate-500 font-medium rounded-xl py-3 active:scale-[0.99]"
      >
        + Añadir línea
      </button>

      {noDetectado && noDetectado.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
          <p className="font-semibold text-amber-800 mb-1">No reconocido en el texto:</p>
          <ul className="list-disc list-inside text-amber-700 space-y-0.5">
            {noDetectado.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
          <p className="text-amber-600 mt-1 text-xs">Añádelos como línea manual si hacen falta.</p>
        </div>
      )}

      <div className="flex items-center justify-between bg-pizarra-800 text-white rounded-xl px-4 py-3">
        <span className="font-medium">Base (sin IVA)</span>
        <span className="text-xl font-bold">{eur(totalBase)} €</span>
      </div>
    </section>
  );
}
