const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'presupuesto-hablado.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracion_tecnico (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nombre_empresa TEXT NOT NULL DEFAULT '',
      nif TEXT NOT NULL DEFAULT '',
      direccion TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      tipo_iva REAL NOT NULL DEFAULT 21,
      dias_validez INTEGER NOT NULL DEFAULT 30,
      condiciones_pago TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS concepto_tarifario (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      oficio TEXT NOT NULL CHECK (oficio IN ('fontaneria','electricidad','reformas','climatizacion','general')),
      nombre TEXT NOT NULL,
      sinonimos_json TEXT NOT NULL DEFAULT '[]',
      precio_unitario REAL NOT NULL DEFAULT 0,
      unidad TEXT NOT NULL DEFAULT 'unidad',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presupuesto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nombre TEXT NOT NULL DEFAULT '',
      cliente_direccion TEXT NOT NULL DEFAULT '',
      cliente_telefono TEXT NOT NULL DEFAULT '',
      cliente_email TEXT NOT NULL DEFAULT '',
      descripcion TEXT NOT NULL DEFAULT '',
      transcripcion_original TEXT NOT NULL DEFAULT '',
      iva_porcentaje REAL NOT NULL DEFAULT 21,
      estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador','enviado','aceptado','rechazado')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS linea_presupuesto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      presupuesto_id INTEGER NOT NULL,
      concepto TEXT NOT NULL DEFAULT '',
      cantidad REAL NOT NULL DEFAULT 1,
      precio_unitario REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      origen TEXT NOT NULL DEFAULT 'manual' CHECK (origen IN ('parser','tarifario','manual')),
      orden INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (presupuesto_id) REFERENCES presupuesto(id) ON DELETE CASCADE
    );
  `);

  // Garantiza que exista la fila unica de configuracion
  const cfg = db.prepare('SELECT id FROM configuracion_tecnico WHERE id = 1').get();
  if (!cfg) {
    db.prepare('INSERT INTO configuracion_tecnico (id) VALUES (1)').run();
  }
}

init();

module.exports = db;
