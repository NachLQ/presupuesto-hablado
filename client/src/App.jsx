import { useMemo, useState } from 'react';
import { api } from './api.js';
import { generarPdf } from './lib/pdf.js';
import NavInferior from './components/NavInferior.jsx';
import Dictado from './components/Dictado.jsx';
import RevisionLineas from './components/RevisionLineas.jsx';
import DatosCliente from './components/DatosCliente.jsx';
import Tarifario from './components/Tarifario.jsx';
import Historial from './components/Historial.jsx';
import Configuracion from './components/Configuracion.jsx';

const DATOS_INICIALES = {
  cliente_nombre: '', cliente_direccion: '', cliente_telefono: '', cliente_email: '',
  descripcion: '', iva_porcentaje: 21, estado: 'borrador',
};

const r2 = (n) => Math.round(n * 100) / 100;

export default function App() {
  const [tab, setTab] = useState('crear');

  // Estado del presupuesto en construccion
  const [texto, setTexto] = useState('');
  const [lineas, setLineas] = useState([]);
  const [noDetectado, setNoDetectado] = useState([]);
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [presupuestoId, setPresupuestoId] = useState(null);

  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Senales para recargar secciones tras cambios
  const [recargaTarifario, setRecargaTarifario] = useState(0);
  const [recargaHistorial, setRecargaHistorial] = useState(0);

  const totales = useMemo(() => {
    const base = r2(lineas.reduce((s, l) => s + Number(l.total || 0), 0));
    const iva = r2(base * (Number(datos.iva_porcentaje) / 100));
    return { base_imponible: base, iva, total_con_iva: r2(base + iva) };
  }, [lineas, datos.iva_porcentaje]);

  const aviso = (txt) => { setMensaje(txt); setTimeout(() => setMensaje(null), 3000); };

  const analizar = async () => {
    setAnalizando(true);
    try {
      const res = await api.parsear(texto);
      setLineas(res.lineas.map((l) => ({ ...l })));
      setNoDetectado(res.no_detectado || []);
      if (res.cliente_detectado && !datos.cliente_nombre) {
        setDatos((p) => ({ ...p, cliente_nombre: res.cliente_detectado.nombre }));
      }
      if (res.lineas.length === 0) aviso('No se detectaron conceptos. Revisa el texto o añade líneas a mano.');
    } catch (e) {
      aviso('Error al analizar: ' + e.message);
    } finally {
      setAnalizando(false);
    }
  };

  // Guarda (crea o actualiza) y devuelve el presupuesto completo
  const guardarInterno = async () => {
    const payload = {
      ...datos,
      transcripcion_original: texto,
      lineas: lineas.map((l, i) => ({
        concepto: l.concepto, cantidad: Number(l.cantidad) || 0,
        precio_unitario: Number(l.precio_unitario) || 0,
        origen: l.origen || 'manual', orden: i,
      })),
    };
    const saved = presupuestoId
      ? await api.actualizarPresupuesto(presupuestoId, payload)
      : await api.crearPresupuesto(payload);
    setPresupuestoId(saved.id);
    setRecargaHistorial((n) => n + 1);
    return saved;
  };

  const onGuardar = async () => {
    if (lineas.length === 0) { aviso('Añade al menos una línea.'); return; }
    setGuardando(true);
    try {
      await guardarInterno();
      aviso('Presupuesto guardado ✓');
    } catch (e) {
      aviso('Error al guardar: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const onExportarPdf = async () => {
    if (lineas.length === 0) { aviso('Añade al menos una línea.'); return; }
    setGuardando(true);
    try {
      const saved = await guardarInterno();
      const marcarEnviado = saved.estado === 'borrador';
      const exportData = await api.exportarPdf(saved.id, marcarEnviado);
      generarPdf(exportData);
      if (exportData.presupuesto.estado !== datos.estado) {
        setDatos((p) => ({ ...p, estado: exportData.presupuesto.estado }));
      }
      aviso('PDF generado ✓');
    } catch (e) {
      aviso('Error al exportar: ' + e.message);
    } finally {
      setGuardando(false);
    }
  };

  const nuevoPresupuesto = () => {
    setTexto(''); setLineas([]); setNoDetectado([]);
    setDatos(DATOS_INICIALES); setPresupuestoId(null);
    setTab('crear');
  };

  const editarPresupuesto = async (id) => {
    const p = await api.getPresupuesto(id);
    setPresupuestoId(p.id);
    setTexto(p.transcripcion_original || '');
    setLineas((p.lineas || []).map((l) => ({
      concepto: l.concepto, cantidad: l.cantidad, precio_unitario: l.precio_unitario,
      total: l.total, origen: l.origen, tarifario_id: null,
    })));
    setNoDetectado([]);
    setDatos({
      cliente_nombre: p.cliente_nombre, cliente_direccion: p.cliente_direccion,
      cliente_telefono: p.cliente_telefono, cliente_email: p.cliente_email,
      descripcion: p.descripcion, iva_porcentaje: p.iva_porcentaje, estado: p.estado,
    });
    setTab('crear');
  };

  return (
    <div className="min-h-full pb-24">
      {/* Cabecera */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-extrabold text-lg text-pizarra-900 leading-none">Presupuesto <span className="text-marca-600">Hablado</span></h1>
            <p className="text-[11px] text-slate-400">Del dictado al PDF en 2 minutos</p>
          </div>
          {tab === 'crear' && (presupuestoId || lineas.length > 0) && (
            <button onClick={nuevoPresupuesto} className="text-sm font-semibold text-marca-600 border border-marca-200 bg-marca-50 px-3 py-1.5 rounded-lg">
              + Nuevo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-8">
        {tab === 'crear' && (
          <>
            <Dictado texto={texto} setTexto={setTexto} onAnalizar={analizar} analizando={analizando} />
            {(lineas.length > 0 || noDetectado.length > 0) && (
              <>
                <RevisionLineas
                  lineas={lineas}
                  setLineas={setLineas}
                  noDetectado={noDetectado}
                  totalBase={totales.base_imponible}
                  onActualizarTarifario={() => { setRecargaTarifario((n) => n + 1); aviso('Tarifario actualizado ✓'); }}
                />
                <DatosCliente
                  datos={datos}
                  setDatos={setDatos}
                  totales={totales}
                  guardando={guardando}
                  onGuardar={onGuardar}
                  onExportarPdf={onExportarPdf}
                  puedeExportar={lineas.length > 0}
                />
              </>
            )}
          </>
        )}

        {tab === 'historial' && <Historial recargaSenal={recargaHistorial} onEditar={editarPresupuesto} />}
        {tab === 'tarifario' && <Tarifario recargaSenal={recargaTarifario} />}
        {tab === 'config' && <Configuracion />}
      </main>

      {mensaje && (
        <div className="fixed bottom-24 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="bg-pizarra-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg">
            {mensaje}
          </div>
        </div>
      )}

      <NavInferior activa={tab} onCambiar={setTab} />
    </div>
  );
}
