import { useSpeech } from '../lib/useSpeech.js';

// Seccion 1 del flujo: entrada por voz (Web Speech API) o por texto escrito.
export default function Dictado({ texto, setTexto, onAnalizar, analizando }) {
  const { soportado, escuchando, parcial, error, iniciar, detener } = useSpeech();

  const alternarDictado = () => {
    if (escuchando) {
      detener();
    } else {
      iniciar((fragmentoFinal) => {
        setTexto((prev) => (prev ? prev.trim() + ' ' : '') + fragmentoFinal);
      });
    }
  };

  return (
    <section className="space-y-4">
      {/* BOTON ENORME DE DICTADO (~40% de pantalla) */}
      <button
        onClick={alternarDictado}
        disabled={!soportado}
        className={`w-full h-[38vh] min-h-[230px] rounded-3xl flex flex-col items-center justify-center gap-3 text-white shadow-lg transition-all active:scale-[0.98] ${
          escuchando ? 'bg-red-500 escuchando' : 'bg-marca-600'
        } ${!soportado ? 'opacity-50' : ''}`}
      >
        <span className="text-7xl">{escuchando ? '⏹️' : '🎤'}</span>
        <span className="text-xl font-bold">
          {escuchando ? 'Escuchando… toca para parar' : 'Toca y dicta el trabajo'}
        </span>
        <span className="text-sm opacity-90 px-6 text-center">
          {escuchando
            ? 'Habla con naturalidad: concepto, cantidad y precio'
            : 'Ej.: «Cambio de grifo a 45 euros, dos horas de mano de obra a 35 la hora»'}
        </span>
      </button>

      {escuchando && parcial && (
        <p className="text-center text-slate-500 italic text-sm">“{parcial}”</p>
      )}

      {!soportado && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Tu navegador no soporta dictado por voz. Usa <strong>Chrome</strong> (Android o escritorio) o
          escribe el trabajo a mano abajo — el resultado es idéntico.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          No se pudo usar el micrófono ({error}). Revisa los permisos o escribe el trabajo a mano.
        </p>
      )}

      {/* ENTRADA POR TEXTO (siempre disponible) */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1">
          O escribe / corrige el texto
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Cambio de grifo de cocina monomando a 45 euros, dos horas de mano de obra a 35 la hora, desplazamiento 15 euros"
          className="w-full rounded-xl border border-slate-300 p-3 text-base focus:ring-2 focus:ring-marca-500 focus:border-marca-500 outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAnalizar}
          disabled={!texto.trim() || analizando}
          className="flex-1 bg-pizarra-800 text-white font-bold py-4 rounded-xl shadow active:scale-[0.98] disabled:opacity-40"
        >
          {analizando ? 'Analizando…' : 'Analizar y crear líneas →'}
        </button>
        {texto && (
          <button
            onClick={() => setTexto('')}
            className="px-4 py-4 rounded-xl border border-slate-300 text-slate-500 font-medium"
          >
            Borrar
          </button>
        )}
      </div>
    </section>
  );
}
