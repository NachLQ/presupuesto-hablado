// Prueba manual del parser contra las 5 transcripciones del prompt.
const db = require('./db');
const { parsear } = require('./parser');

const conceptos = db.prepare('SELECT * FROM concepto_tarifario').all();
if (conceptos.length === 0) {
  console.error('No hay tarifario cargado. Ejecuta `npm run seed` primero.');
  process.exit(1);
}

const casos = [
  'Cambio de grifo de cocina monomando a cuarenta y cinco euros, dos horas de mano de obra a 35 la hora, desplazamiento 15 euros',
  'Tres puntos de luz, instalación de dos enchufes y un interruptor, cuadro eléctrico revisión',
  'Cuarto de baño completo, cambio WC, cambio ducha, alicatado 8 metros cuadrados, pintura, dos horas de peón',
  'Presupuesto para María López, cambio calentador eléctrico 50 litros, incluye materiales',
  'Hola buenas, vengo de casa de un cliente: hay que cambiar el sifón del fregadero, poner dos enchufes nuevos, revisar la caldera de gas, montar una estantería flotante en el salón y arreglar la persiana del dormitorio. También me preguntan por pintar el pasillo, unos 10 metros cuadrados.',
];

let n = 1;
for (const texto of casos) {
  const r = parsear(texto, conceptos);
  const totalBase = r.lineas.reduce((s, l) => s + l.total, 0);
  console.log(`\n===== CASO ${n} =====`);
  console.log('TEXTO:', texto);
  console.log('LINEAS:');
  r.lineas.forEach((l) =>
    console.log(`  - ${l.concepto} | x${l.cantidad} | ${l.precio_unitario}€ | total ${l.total}€ | [${l.origen}]`)
  );
  console.log(`TOTAL BASE: ${Math.round(totalBase * 100) / 100}€`);
  if (r.cliente_detectado) console.log('CLIENTE DETECTADO:', r.cliente_detectado.nombre);
  if (r.no_detectado.length) console.log('NO DETECTADO:', r.no_detectado.join(' | '));
  n++;
}
