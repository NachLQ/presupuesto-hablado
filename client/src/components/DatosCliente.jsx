const eur = (n) => Number(n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CAMPOS = [
  { k: 'cliente_nombre', label: 'Nombre del cliente', ph: 'María López' },
  { k: 'cliente_direccion', label: 'Dirección de la obra', ph: 'Calle Mayor 12, Madrid' },
  { k: 'cliente_telefono', label: 'Teléfono', ph: '600 000 000', tipo: 'tel' },
  { k: 'cliente_email', label: 'Email (opcional)', ph: 'cliente@email.es', tipo: 'email' },
  { k: 'descripcion', label: 'Referencia / descripción del trabajo', ph: 'Reforma baño completo' },
];

// Seccion 3 del flujo: datos del cliente, IVA, guardar y exportar PDF.
export default function DatosCliente({ datos, setDatos, totales, guardando, onGuardar, onExportarPdf, puedeExportar }) {
  const set = (k, v) => setDatos((prev) => ({ ...prev, [k]: v }));

  return (
    <section className="space-y-4">
      <h2 className="font-bold text-slate-800">Datos del cliente</h2>

      <div className="space-y-3">
        {CAMPOS.map((c) => (
          <div key={c.k}>
            <label className="block text-sm font-semibold text-slate-700 mb-1">{c.label}</label>
            <input
              type={c.tipo || 'text'}
              value={datos[c.k] || ''}
              onChange={(e) => set(c.k, e.target.value)}
              placeholder={c.ph}
              className="w-full rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-marca-500 focus:border-marca-500 outline-none"
            />
          </div>
        ))}
      </div>

      {/* IVA y estado */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">IVA</label>
          <select
            value={datos.iva_porcentaje}
            onChange={(e) => set('iva_porcentaje', Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 p-3 bg-white"
          >
            <option value={21}>21% (general)</option>
            <option value={10}>10% (reducido)</option>
            <option value={0}>Exento (0%)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Estado</label>
          <select
            value={datos.estado}
            onChange={(e) => set('estado', e.target.value)}
            className="w-full rounded-xl border border-slate-300 p-3 bg-white"
          >
            <option value="borrador">Borrador</option>
            <option value="enviado">Enviado</option>
            <option value="aceptado">Aceptado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </div>
      </div>

      {/* Totales */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
        <div className="flex justify-between text-slate-600">
          <span>Base imponible</span><span>{eur(totales.base_imponible)} €</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>IVA ({datos.iva_porcentaje}%)</span><span>{eur(totales.iva)} €</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-marca-700 border-t border-slate-200 pt-1.5">
          <span>TOTAL</span><span>{eur(totales.total_con_iva)} €</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onGuardar}
          disabled={guardando}
          className="w-full bg-pizarra-800 text-white font-bold py-4 rounded-xl shadow active:scale-[0.98] disabled:opacity-40"
        >
          {guardando ? 'Guardando…' : 'Guardar presupuesto'}
        </button>
        <button
          onClick={onExportarPdf}
          disabled={!puedeExportar}
          className="w-full bg-marca-600 text-white font-bold py-4 rounded-xl shadow active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          📄 Exportar PDF profesional
        </button>
        {!puedeExportar && (
          <p className="text-xs text-slate-400 text-center">Guarda el presupuesto para poder exportarlo.</p>
        )}
      </div>
    </section>
  );
}
