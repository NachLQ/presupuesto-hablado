const express = require('express');
const cors = require('cors');

const db = require('./db'); // inicializa el esquema

// Primera ejecución: si no hay ningún concepto de tarifario, cargar la demo
// automáticamente (así el pack muestra los datos de ejemplo sin `npm run seed` manual).
if (db.prepare('SELECT COUNT(*) AS c FROM concepto_tarifario').get().c === 0) {
  require('./seed');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api/configuracion', require('./routes/configuracion'));
app.use('/api/tarifario', require('./routes/tarifario'));
app.use('/api/parser', require('./routes/parser'));
app.use('/api/presupuestos', require('./routes/presupuestos'));

app.get('/api/health', (req, res) => res.json({ ok: true, servicio: 'presupuesto-hablado' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'error interno', detalle: err.message });
});

// Usa SERVER_PORT (no PORT) para no colisionar con el puerto del cliente Vite
const PORT = process.env.SERVER_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Presupuesto Hablado API escuchando en http://localhost:${PORT}`);
});
