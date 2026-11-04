// Carga datos demo: configuracion del tecnico, tarifario por oficio y 3 presupuestos.
const db = require('./db');
const { TARIFARIO } = require('./diccionario');

function limpiar() {
  db.exec(`
    DELETE FROM linea_presupuesto;
    DELETE FROM presupuesto;
    DELETE FROM concepto_tarifario;
    DELETE FROM sqlite_sequence WHERE name IN ('presupuesto','linea_presupuesto','concepto_tarifario');
  `);
}

function seedConfiguracion() {
  db.prepare(`
    UPDATE configuracion_tecnico SET
      nombre_empresa = @nombre_empresa,
      nif = @nif,
      direccion = @direccion,
      telefono = @telefono,
      email = @email,
      tipo_iva = @tipo_iva,
      dias_validez = @dias_validez,
      condiciones_pago = @condiciones_pago
    WHERE id = 1
  `).run({
    nombre_empresa: 'Instalaciones García SL',
    nif: 'B12345678',
    direccion: 'Calle del Oficio 24, 28015 Madrid',
    telefono: '600 123 456',
    email: 'contacto@instalacionesgarcia.es',
    tipo_iva: 21,
    dias_validez: 30,
    condiciones_pago: 'Pago: 50% al aceptar el presupuesto, 50% a la finalización del trabajo. Materiales no incluidos salvo indicación expresa.',
  });
}

function seedTarifario() {
  const insert = db.prepare(`
    INSERT INTO concepto_tarifario (oficio, nombre, sinonimos_json, precio_unitario, unidad)
    VALUES (@oficio, @nombre, @sinonimos_json, @precio_unitario, @unidad)
  `);
  const tx = db.transaction(() => {
    for (const [oficio, conceptos] of Object.entries(TARIFARIO)) {
      for (const c of conceptos) {
        insert.run({
          oficio,
          nombre: c.nombre,
          sinonimos_json: JSON.stringify(c.sinonimos || []),
          precio_unitario: c.precio_unitario,
          unidad: c.unidad,
        });
      }
    }
  });
  tx();
}

function diasAtras(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function seedPresupuestos() {
  const insP = db.prepare(`
    INSERT INTO presupuesto (cliente_nombre, cliente_direccion, cliente_telefono, cliente_email,
      descripcion, transcripcion_original, iva_porcentaje, estado, created_at, updated_at)
    VALUES (@cliente_nombre, @cliente_direccion, @cliente_telefono, @cliente_email,
      @descripcion, @transcripcion_original, @iva_porcentaje, @estado, @created_at, @updated_at)
  `);
  const insL = db.prepare(`
    INSERT INTO linea_presupuesto (presupuesto_id, concepto, cantidad, precio_unitario, total, origen, orden)
    VALUES (@presupuesto_id, @concepto, @cantidad, @precio_unitario, @total, @origen, @orden)
  `);

  const presupuestos = [
    {
      p: {
        cliente_nombre: 'Antonio Ruiz', cliente_direccion: 'Av. de la Constitución 8, 3ºB, Getafe',
        cliente_telefono: '655 778 990', cliente_email: 'antonio.ruiz@email.es',
        descripcion: 'Cambio de grifo y mano de obra en cocina',
        transcripcion_original: 'Cambio de grifo de cocina monomando a cuarenta y cinco euros, dos horas de mano de obra a 35 la hora, desplazamiento 15 euros',
        iva_porcentaje: 21, estado: 'aceptado', created_at: diasAtras(14), updated_at: diasAtras(13),
      },
      lineas: [
        { concepto: 'Cambio grifo monomando', cantidad: 1, precio_unitario: 45, origen: 'parser' },
        { concepto: 'Hora mano de obra fontaneria', cantidad: 2, precio_unitario: 35, origen: 'parser' },
        { concepto: 'Desplazamiento a obra', cantidad: 1, precio_unitario: 15, origen: 'parser' },
      ],
    },
    {
      p: {
        cliente_nombre: 'Lucía Fernández', cliente_direccion: 'Calle Mayor 112, 1ºA, Alcorcón',
        cliente_telefono: '622 334 556', cliente_email: '',
        descripcion: 'Instalación de puntos de luz y revisión de cuadro',
        transcripcion_original: 'Tres puntos de luz, instalación de dos enchufes y un interruptor, cuadro eléctrico revisión',
        iva_porcentaje: 21, estado: 'enviado', created_at: diasAtras(3), updated_at: diasAtras(3),
      },
      lineas: [
        { concepto: 'Punto de luz (enchufe)', cantidad: 3, precio_unitario: 35, origen: 'tarifario' },
        { concepto: 'Punto de luz (enchufe)', cantidad: 2, precio_unitario: 35, origen: 'tarifario' },
        { concepto: 'Punto de luz (interruptor)', cantidad: 1, precio_unitario: 35, origen: 'tarifario' },
        { concepto: 'Cuadro electrico (revision)', cantidad: 1, precio_unitario: 60, origen: 'tarifario' },
      ],
    },
    {
      p: {
        cliente_nombre: 'María López', cliente_direccion: 'Plaza España 3, bajo, Leganés',
        cliente_telefono: '699 001 122', cliente_email: 'maria.lopez@email.es',
        descripcion: 'Reforma de baño (borrador en proceso)',
        transcripcion_original: 'Cuarto de baño completo, cambio WC, cambio ducha, alicatado 8 metros cuadrados, pintura, dos horas de peón',
        iva_porcentaje: 21, estado: 'borrador', created_at: diasAtras(1), updated_at: diasAtras(0),
      },
      lineas: [
        { concepto: 'Sustitucion WC completo', cantidad: 1, precio_unitario: 180, origen: 'tarifario' },
        { concepto: 'Cambio ducha completa', cantidad: 1, precio_unitario: 250, origen: 'tarifario' },
        { concepto: 'Metro cuadrado alicatado', cantidad: 8, precio_unitario: 35, origen: 'tarifario' },
        { concepto: 'Metro cuadrado pintura', cantidad: 1, precio_unitario: 12, origen: 'tarifario' },
        { concepto: 'Hora peon', cantidad: 2, precio_unitario: 20, origen: 'tarifario' },
      ],
    },
  ];

  const tx = db.transaction(() => {
    for (const item of presupuestos) {
      const r = insP.run(item.p);
      const id = r.lastInsertRowid;
      item.lineas.forEach((l, i) => {
        insL.run({
          presupuesto_id: id,
          concepto: l.concepto,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
          total: Math.round(l.cantidad * l.precio_unitario * 100) / 100,
          origen: l.origen,
          orden: i,
        });
      });
    }
  });
  tx();
}

function main() {
  limpiar();
  seedConfiguracion();
  seedTarifario();
  seedPresupuestos();

  const nConceptos = db.prepare('SELECT COUNT(*) n FROM concepto_tarifario').get().n;
  const nPres = db.prepare('SELECT COUNT(*) n FROM presupuesto').get().n;
  console.log(`Seed completado: ${nConceptos} conceptos de tarifario, ${nPres} presupuestos demo.`);
}

main();
