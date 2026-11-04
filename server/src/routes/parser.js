const express = require('express');
const db = require('../db');
const { parsear } = require('../parser');

const router = express.Router();

// POST /api/parser  { texto }  -> { lineas, no_detectado, cliente_detectado }
router.post('/', (req, res) => {
  const { texto } = req.body || {};
  if (!texto || !texto.trim()) {
    return res.json({ lineas: [], no_detectado: [], cliente_detectado: null });
  }
  const conceptos = db.prepare('SELECT * FROM concepto_tarifario').all();
  const resultado = parsear(texto, conceptos);
  res.json(resultado);
});

module.exports = router;
