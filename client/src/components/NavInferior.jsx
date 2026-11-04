const TABS = [
  { id: 'crear', label: 'Presupuesto', icono: '🎤' },
  { id: 'historial', label: 'Historial', icono: '📋' },
  { id: 'tarifario', label: 'Tarifario', icono: '💶' },
  { id: 'config', label: 'Ajustes', icono: '⚙️' },
];

export default function NavInferior({ activa, onCambiar }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-30 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-xl mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const activo = activa === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onCambiar(t.id)}
              className={`flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
                activo ? 'text-marca-600' : 'text-slate-400'
              }`}
            >
              <span className="text-xl leading-none">{t.icono}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
