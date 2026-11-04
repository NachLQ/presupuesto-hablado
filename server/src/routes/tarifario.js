const express = require('express');
const db = require('../db');
const { TARIFARIO } = require('../diccionario');

const router = express.Router();

function parseSinonimos(row) {
  let sinonimos = [];
  try { sinonimos = JSON.parse(row.sinonimos_json || '[]'); } catch { sinonimos = []; }
  return { ...row, sinonimos };
}

// GET /api/tarifario?oficio=fontaneria
router.get('/', (req, res) => {
  const { oficio } = req.query;
  let rows;
  if (oficio) {
    rows = db.prepare('SELECT * FROM concepto_tarifario WHERE oficio = ? ORDER BY nombre').all(oficio);
  } else {
    rows = db.prepare('SELECT * FROM concepto_tarifario ORDER BY oficio, nombre').all();
  }
  res.json(rows.map(parseSinonimos));
});

// POST /api/tarifario
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.nombre || !b.oficio) return res.status(400).json({ error: 'nombre y oficio son obligatorios' });
  const r = db.prepare(`
    INSERT INTO concepto_tarifario (oficio, nombre, sinonimos_json, precio_unitario, unidad, updated_at)
    VALUES (@oficio, @nombre, @sinonimos_json, @precio_unitario, @unidad, datetime('now'))
  `).run({
    oficio: b.oficio,
    nombre: b.nombre,
    sinonimos_json: JSON.stringify(b.sinonimos || []),
    precio_unitario: Number(b.precio_unitario) || 0,
    unidad: b.unidad || 'unidad',
  });
  const row = db.prepare('SELECT * FROM concepto_tarifario WHERE id = ?').get(r.lastInsertRowid);
  res.status(201).json(parseSinonimos(row));
});

// PUT /api/tarifario/:id
router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const actual = db.prepare('SELECT * FROM concepto_tarifario WHERE id = ?').get(id);
  if (!actual) return res.status(404).json({ error: 'concepto no encontrado' });
  const b = req.body || {};
  const sinonimos_json = b.sinonimos !== undefined ? JSON.stringify(b.sinonimos) : actual.sinonimos_json;
  db.prepare(`
    UPDATE concepto_tarifario SET
      oficio=@oficio, nombre=@nombre, sinonimos_json=@sinonimos_json,
      precio_unitario=@precio_unitario, unidad=@unidad, updated_at=datetime('now')
    WHERE id=@id
  `).run({
    id,
    oficio: b.oficio ?? actual.oficio,
    nombre: b.nombre ?? actual.nombre,
    sinonimos_json,
    precio_unitario: b.precio_unitario ?? actual.precio_unitario,
    unidad: b.unidad ?? actual.unidad,
  });
  res.json(parseSinonimos(db.prepare('SELECT * FROM concepto_tarifario WHERE id = ?').get(id)));
});

// DELETE /api/tarifario/:id
router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = db.prepare('DELETE FROM concepto_tarifario WHERE id = ?').run(id);
  if (r.changes === 0) return res.status(404).json({ error: 'concepto no encontrado' });
  res.json({ ok: true });
});

// POST /api/tarifario/importar-oficio  { oficio }
// Carga el diccionario inicial de un oficio (sin duplicar los que ya existan por nombre).
router.post('/importar-oficio', (req, res) => {
  const { oficio } = req.body || {};
  const conceptos = TARIFARIO[oficio];
  if (!conceptos) return res.status(400).json({ error: 'oficio no valido' });
  const existe = db.prepare('SELECT nombre FROM concepto_tarifario WHERE oficio = ?').all(oficio).map((r) => r.nombre);
  const insert = db.prepare(`
    INSERT INTO concepto_tarifario (oficio, nombre, sinonimos_json, precio_unitario, unidad)
    VALUES (@oficio, @nombre, @sinonimos_json, @precio_unitario, @unidad)
  `);
  let añadidos = 0;
  const tx = db.transaction(() => {
    for (const c of conceptos) {
      if (existe.includes(c.nombre)) continue;
      insert.run({
        oficio,
        nombre: c.nombre,
        sinonimos_json: JSON.stringify(c.sinonimos || []),
        precio_unitario: c.precio_unitario,
        unidad: c.unidad,
      });
      añadidos++;
    }
  });
  tx();
  res.json({ ok: true, añadidos });
});

module.exports = router;
