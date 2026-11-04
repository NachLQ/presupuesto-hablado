const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const cfg = db.prepare('SELECT * FROM configuracion_tecnico WHERE id = 1').get();
  res.json(cfg);
});

router.put('/', (req, res) => {
  const b = req.body || {};
  const actual = db.prepare('SELECT * FROM configuracion_tecnico WHERE id = 1').get();
  const merged = {
    nombre_empresa: b.nombre_empresa ?? actual.nombre_empresa,
    nif: b.nif ?? actual.nif,
    direccion: b.direccion ?? actual.direccion,
    telefono: b.telefono ?? actual.telefono,
    email: b.email ?? actual.email,
    tipo_iva: b.tipo_iva ?? actual.tipo_iva,
    dias_validez: b.dias_validez ?? actual.dias_validez,
    condiciones_pago: b.condiciones_pago ?? actual.condiciones_pago,
  };
  db.prepare(`
    UPDATE configuracion_tecnico SET
      nombre_empresa=@nombre_empresa, nif=@nif, direccion=@direccion, telefono=@telefono,
      email=@email, tipo_iva=@tipo_iva, dias_validez=@dias_validez, condiciones_pago=@condiciones_pago
    WHERE id = 1
  `).run(merged);
  res.json(db.prepare('SELECT * FROM configuracion_tecnico WHERE id = 1').get());
});

module.exports = router;
