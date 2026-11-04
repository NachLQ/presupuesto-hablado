import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CAMPOS = [
  { k: 'nombre_empresa', label: 'Nombre / empresa', ph: 'Instalaciones García SL' },
  { k: 'nif', label: 'NIF / CIF', ph: 'B12345678' },
  { k: 'direccion', label: 'Dirección', ph: 'Calle del Oficio 24, Madrid' },
  { k: 'telefono', label: 'Teléfono', ph: '600 123 456' },
  { k: 'email', label: 'Email', ph: 'contacto@empresa.es' },
];

export default function Configuracion() {
  const [cfg, setCfg] = useState(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => { api.getConfiguracion().then(setCfg); }, []);

  if (!cfg) return <p className="text-slate-400">Cargando…</p>;

  const set = (k, v) => { setCfg((p) => ({ ...p, [k]: v })); setGuardado(false); };

  const guardar = async () => {
    await api.guardarConfiguracion(cfg);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Ajustes del técnico</h1>
      <p className="text-sm text-slate-500">Estos datos aparecen en la cabecera del PDF.</p>

      <div className="space-y-3">
        {CAMPOS.map((c) => (
          <div key={c.k}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{c.label}</label>
            <input
              value={cfg[c.k] || ''}
              onChange={(e) => set(c.k, e.target.value)}
              placeholder={c.ph}
              className="w-full rounded-xl border border-slate-300 p-3"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">IVA por defecto (%)</label>
            <input type="number" step="any" value={cfg.tipo_iva} onChange={(e) => set('tipo_iva', Number(e.target.value))} className="w-full rounded-xl border border-slate-300 p-3" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Validez (días)</label>
            <input type="number" value={cfg.dias_validez} onChange={(e) => set('dias_validez', Number(e.target.value))} className="w-full rounded-xl border border-slate-300 p-3" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Condiciones de pago</label>
          <textarea
            rows={4}
            value={cfg.condiciones_pago || ''}
            onChange={(e) => set('condiciones_pago', e.target.value)}
            placeholder="Pago: 50% al aceptar, 50% a la finalización…"
            className="w-full rounded-xl border border-slate-300 p-3"
          />
        </div>
      </div>

      <button onClick={guardar} className="w-full bg-marca-600 text-white font-bold py-4 rounded-xl shadow active:scale-[0.98]">
        {guardado ? '✓ Guardado' : 'Guardar ajustes'}
      </button>
    </section>
  );
}
