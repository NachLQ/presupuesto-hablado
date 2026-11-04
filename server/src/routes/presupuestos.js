const express = require('express');
const db = require('../db');

const router = express.Router();

function getLineas(presupuestoId) {
  return db.prepare('SELECT * FROM linea_presupuesto WHERE presupuesto_id = ? ORDER BY orden, id').all(presupuestoId);
}

function calcularTotales(lineas, ivaPorcentaje) {
  const base = lineas.reduce((s, l) => s + Number(l.total || 0), 0);
  const iva = Math.round(base * (Number(ivaPorcentaje) / 100) * 100) / 100;
  return {
    base_imponible: Math.round(base * 100) / 100,
    iva,
    total_con_iva: Math.round((base + iva) * 100) / 100,
  };
}

function presupuestoCompleto(row) {
  const lineas = getLineas(row.id);
  return { ...row, lineas, totales: calcularTotales(lineas, row.iva_porcentaje) };
}

function guardarLineas(presupuestoId, lineas) {
  db.prepare('DELETE FROM linea_presupuesto WHERE presupuesto_id = ?').run(presupuestoId);
  const ins = db.prepare(`
    INSERT INTO linea_presupuesto (presupuesto_id, concepto, cantidad, precio_unitario, total, origen, orden)
    VALUES (@presupuesto_id, @concepto, @cantidad, @precio_unitario, @total, @origen, @orden)
  `);
  (lineas || []).forEach((l, i) => {
    const cantidad = Number(l.cantidad) || 0;
    const precio = Number(l.precio_unitario) || 0;
    ins.run({
      presupuesto_id: presupuestoId,
      concepto: l.concepto || '',
      cantidad,
      precio_unitario: precio,
      total: Math.round(cantidad * precio * 100) / 100,
      origen: ['parser', 'tarifario', 'manual'].includes(l.origen) ? l.origen : 'manual',
      orden: l.orden ?? i,
    });
  });
}

// GET /api/presupuestos?estado=&cliente=
router.get('/', (req, res) => {
  const { estado, cliente } = req.query;
  let sql = 'SELECT * FROM presupuesto WHERE 1=1';
  const params = [];
  if (estado) { sql += ' AND estado = ?'; params.push(estado); }
  if (cliente) { sql += ' AND cliente_nombre LIKE ?'; params.push(`%${cliente}%`); }
  sql += ' ORDER BY datetime(created_at) DESC, id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(presupuestoCompleto));
});

// GET /api/presupuestos/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM presupuesto WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'presupuesto no encontrado' });
  res.json(presupuestoCompleto(row));
});

// POST /api/presupuestos
router.post('/', (req, res) => {
  const b = req.body || {};
  const cfg = db.prepare('SELECT tipo_iva FROM configuracion_tecnico WHERE id = 1').get();
  const r = db.prepare(`
    INSERT INTO presupuesto (cliente_nombre, cliente_direccion, cliente_telefono, cliente_email,
      descripcion, transcripcion_original, iva_porcentaje, estado)
    VALUES (@cliente_nombre, @cliente_direccion, @cliente_telefono, @cliente_email,
      @descripcion, @transcripcion_original, @iva_porcentaje, @estado)
  `).run({
    cliente_nombre: b.cliente_nombre || '',
    cliente_direccion: b.cliente_direccion || '',
    cliente_telefono: b.cliente_telefono || '',
    cliente_email: b.cliente_email || '',
    descripcion: b.descripcion || '',
    transcripcion_original: b.transcripcion_original || '',
    iva_porcentaje: b.iva_porcentaje ?? cfg.tipo_iva,
    estado: ['borrador', 'enviado', 'aceptado', 'rechazado'].includes(b.estado) ? b.estado : 'borrador',
  });
  const id = r.lastInsertRowid;
  if (b.lineas) guardarLineas(id, b.lineas);
  res.status(201).json(presupuestoCompleto(db.prepare('SELECT * FROM presupuesto WHERE id = ?').get(id)));
});

// PUT /api/presupuestos/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const actual = db.prepare('SELECT * FROM presupuesto WHERE id = ?').get(id);
  if (!actual) return res.status(404).json({ error: 'presupuesto no encontrado' });
  const b = req.body || {};
  db.prepare(`
    UPDATE presupuesto SET
      cliente_nombre=@cliente_nombre, cliente_direccion=@cliente_direccion,
      cliente_telefono=@cliente_telefono, cliente_email=@cliente_email,
      descripcion=@descripcion, transcripcion_original=@transcripcion_original,
      iva_porcentaje=@iva_porcentaje, estado=@estado, updated_at=datetime('now')
    WHERE id=@id
  `).run({
    id,
    cliente_nombre: b.cliente_nombre ?? actual.cliente_nombre,
    cliente_direccion: b.cliente_direccion ?? actual.cliente_direccion,
    cliente_telefono: b.cliente_telefono ?? actual.cliente_telefono,
    cliente_email: b.cliente_email ?? actual.cliente_email,
    descripcion: b.descripcion ?? actual.descripcion,
    transcripcion_original: b.transcripcion_original ?? actual.transcripcion_original,
    iva_porcentaje: b.iva_porcentaje ?? actual.iva_porcentaje,
    estado: b.estado ?? actual.estado,
  });
  if (b.lineas !== undefined) guardarLineas(id, b.lineas);
  res.json(presupuestoCompleto(db.prepare('SELECT * FROM presupuesto WHERE id = ?').get(id)));
});

// DELETE /api/presupuestos/:id
router.delete('/:id', (req, res) => {
  const r = db.prepare('DELETE FROM presupuesto WHERE id = ?').run(Number(req.params.id));
  if (r.changes === 0) return res.status(404).json({ error: 'presupuesto no encontrado' });
  res.json({ ok: true });
});

// POST /api/presupuestos/:id/exportar-pdf
// El PDF se genera en el navegador (jsPDF). Este endpoint devuelve todos los
// datos necesarios para renderizarlo y marca el presupuesto como 'enviado'
// si estaba en 'borrador'. Sirve de "contrato" limpio entre server y cliente.
router.post('/:id/exportar-pdf', (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare('SELECT * FROM presupuesto WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'presupuesto no encontrado' });
  const cfg = db.prepare('SELECT * FROM configuracion_tecnico WHERE id = 1').get();
  if (row.estado === 'borrador' && req.body && req.body.marcar_enviado) {
    db.prepare("UPDATE presupuesto SET estado='enviado', updated_at=datetime('now') WHERE id=?").run(id);
    row.estado = 'enviado';
  }
  res.json({ configuracion: cfg, presupuesto: presupuestoCompleto(row) });
});

module.exports = router;
