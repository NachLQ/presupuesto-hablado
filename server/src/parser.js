// Parser por reglas: texto libre -> lineas de presupuesto.
// No usa IA externa. Reconoce:
//   - Concepto + precio fijo:        "cambio de grifo a 45 euros", "desplazamiento 15"
//   - Concepto + cantidad + precio:  "dos horas de mano de obra a 35 la hora"
//   - Concepto sin precio:           usa el precio del tarifario (origen = 'tarifario')
// Acepta numeros en cifra y en letra (hasta 1000): "cuarenta y cinco euros".

// ---------------------------------------------------------------------------
// 1. Numeros en letra -> cifra
// ---------------------------------------------------------------------------
const UNIDADES = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9 };
const ESPECIALES = {
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29,
};
const DECENAS = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const CENTENAS = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300, cuatrocientos: 400,
  quinientos: 500, seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
};

function esPalabraNumero(w) {
  return w in UNIDADES || w in ESPECIALES || w in DECENAS || w in CENTENAS || w === 'mil';
}

function palabrasANumero(words) {
  let total = 0;
  let current = 0;
  for (const w of words) {
    if (w === 'y') continue;
    if (w === 'mil') {
      current = (current === 0 ? 1 : current) * 1000;
      total += current;
      current = 0;
    } else if (w in CENTENAS) current += CENTENAS[w];
    else if (w in DECENAS) current += DECENAS[w];
    else if (w in ESPECIALES) current += ESPECIALES[w];
    else if (w in UNIDADES) current += UNIDADES[w];
  }
  return total + current;
}

// Sustituye secuencias de numeros en letra por su cifra. "cuarenta y cinco" -> "45".
// La "y" solo se considera parte del numero si va entre dos palabras-numero.
function normalizarNumeros(texto) {
  const tokens = texto.split(/\s+/);
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    if (esPalabraNumero(tokens[i])) {
      const run = [];
      let j = i;
      while (j < tokens.length) {
        if (esPalabraNumero(tokens[j])) {
          run.push(tokens[j]);
          j++;
        } else if (tokens[j] === 'y' && j + 1 < tokens.length && esPalabraNumero(tokens[j + 1])) {
          run.push('y');
          j++;
        } else break;
      }
      out.push(String(palabrasANumero(run)));
      i = j;
    } else {
      out.push(tokens[i]);
      i++;
    }
  }
  return out.join(' ');
}

// ---------------------------------------------------------------------------
// 2. Utilidades de texto
// ---------------------------------------------------------------------------
function quitarAcentos(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizar(s) {
  return quitarAcentos(String(s).toLowerCase())
    .replace(/[€]/g, ' euros ')
    .replace(/[^a-z0-9.,\s/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Palabras de relleno que no aportan al concepto (se limpian de los bordes)
const RELLENO = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'a', 'con', 'y', 'e', 'para', 'por', 'en', 'incluye', 'mas', 'instalacion']);

function limpiarConcepto(s) {
  let palabras = s.split(/\s+/).filter(Boolean);
  // quita relleno por la izquierda y por la derecha
  while (palabras.length && RELLENO.has(palabras[0])) palabras.shift();
  while (palabras.length && RELLENO.has(palabras[palabras.length - 1])) palabras.pop();
  return palabras.join(' ').trim();
}

// Unidades de conteo que confirman que un numero es CANTIDAD (no precio)
const UNIDADES_CONTEO = ['horas', 'hora', 'puntos', 'punto', 'enchufes', 'enchufe', 'interruptores', 'interruptor', 'metros', 'metro', 'unidades', 'unidad', 'visitas', 'visita', 'puertas', 'puerta', 'ventanas', 'ventana', 'luminarias', 'luminaria', 'm2'];

// ---------------------------------------------------------------------------
// 3. Indice de conceptos del tarifario para matching
// ---------------------------------------------------------------------------
// conceptos: filas { id, oficio, nombre, sinonimos_json, precio_unitario, unidad }
function construirIndice(conceptos) {
  const entradas = [];
  for (const c of conceptos) {
    let sinonimos = [];
    try { sinonimos = JSON.parse(c.sinonimos_json || '[]'); } catch { sinonimos = []; }
    const claves = [c.nombre, ...sinonimos].map((x) => normalizar(x));
    for (const clave of claves) {
      if (clave) entradas.push({ clave, concepto: c, longitud: clave.length });
    }
  }
  // las claves mas largas se prueban primero (match mas especifico)
  entradas.sort((a, b) => b.longitud - a.longitud);
  return entradas;
}

function buscarConcepto(textoConcepto, indice) {
  const t = ' ' + normalizar(textoConcepto) + ' ';
  for (const e of indice) {
    if (t.includes(' ' + e.clave + ' ') || t.includes(e.clave)) {
      return e.concepto;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Deteccion de cliente
// ---------------------------------------------------------------------------
function detectarCliente(textoOriginal) {
  // "presupuesto para Maria Lopez", "para Juan Garcia,"
  const m = textoOriginal.match(/\bpara\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/);
  if (m) return { nombre: m[1].trim() };
  return null;
}

// ---------------------------------------------------------------------------
// 5. Parseo de un sub-segmento (un concepto) -> linea
// ---------------------------------------------------------------------------
function parsearSubSegmento(raw, indice) {
  let s = ' ' + normalizar(raw) + ' ';
  if (!s.trim()) return null;

  let precio = null;
  let cantidad = 1;

  // (a) precio con unidad: "a 35 la hora", "a 35 euros la hora", "a 12 el metro"
  let m = s.match(/\ba?\s*(\d+(?:[.,]\d+)?)\s*(?:euros?|eur)?\s*(?:la|el|por|al)\s+(hora|unidad|metro|m2|punto|visita|dia)/);
  if (m) {
    precio = parseFloat(m[1].replace(',', '.'));
    s = s.replace(m[0], ' ');
  }

  // (b) precio con moneda explicita: "a 45 euros", "45 euros", "45 eur"
  if (precio === null) {
    m = s.match(/\b(?:a\s+)?(\d+(?:[.,]\d+)?)\s*(?:euros?|eur)\b/);
    if (m) {
      precio = parseFloat(m[1].replace(',', '.'));
      s = s.replace(m[0], ' ');
    }
  }

  // (c) cantidad: numero al inicio o numero seguido de unidad de conteo
  const tokens = s.trim().split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    if (/^\d+(?:[.,]\d+)?$/.test(tokens[i])) {
      const siguiente = tokens[i + 1] || '';
      const esInicio = i === 0;
      const seguidoDeUnidad = UNIDADES_CONTEO.includes(siguiente);
      if (esInicio || seguidoDeUnidad) {
        cantidad = parseFloat(tokens[i].replace(',', '.'));
        tokens.splice(i, 1); // elimina el numero del texto del concepto
        break;
      }
    }
  }
  s = tokens.join(' ');

  const conceptoTexto = limpiarConcepto(s);
  if (!conceptoTexto && precio === null) return null;

  const match = buscarConcepto(conceptoTexto, indice);

  // Caso 1: hay precio en el texto -> linea (origen parser)
  if (precio !== null) {
    const nombre = match ? match.nombre : capitalizar(conceptoTexto || 'Concepto');
    return {
      concepto: nombre,
      cantidad,
      precio_unitario: precio,
      total: redondear(cantidad * precio),
      origen: 'parser',
      tarifario_id: match ? match.id : null,
    };
  }

  // Caso 2: sin precio pero hay match en tarifario -> usa precio tarifario
  if (match) {
    return {
      concepto: match.nombre,
      cantidad,
      precio_unitario: match.precio_unitario,
      total: redondear(cantidad * match.precio_unitario),
      origen: 'tarifario',
      tarifario_id: match.id,
    };
  }

  // Caso 3: sin precio y sin match -> no detectado
  return { no_detectado: conceptoTexto || raw.trim() };
}

function capitalizar(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function redondear(n) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// 6. Parser principal
// ---------------------------------------------------------------------------
function parsear(texto, conceptos) {
  const indice = construirIndice(conceptos);
  const cliente = detectarCliente(texto);

  // normaliza numeros en letra primero, sobre el texto en minusculas sin acentos
  const base = normalizarNumeros(normalizar(texto));

  // separa por comas y por " y " (la "y" entre numeros ya fue absorbida)
  const segmentos = [];
  for (const trozo of base.split(/[,;.]| y /)) {
    const t = trozo.trim();
    if (t) segmentos.push(t);
  }

  const lineas = [];
  const noDetectado = [];
  const clienteNorm = cliente ? normalizar(cliente.nombre) : '';
  for (const seg of segmentos) {
    const r = parsearSubSegmento(seg, indice);
    if (!r) continue;
    if (r.no_detectado) {
      if (esRuido(r.no_detectado, clienteNorm)) continue;
      noDetectado.push(r.no_detectado);
    } else {
      r.orden = lineas.length;
      lineas.push(r);
    }
  }

  return { lineas, no_detectado: noDetectado, cliente_detectado: cliente };
}

// Segmentos que no aportan informacion util al tecnico (saludos, frase de cliente)
const RUIDO = ['hola', 'buenas', 'hola buenas', 'materiales', 'vengo', 'cliente', 'tambien'];
function esRuido(texto, clienteNorm) {
  const t = normalizar(texto);
  if (!t) return true;
  if (clienteNorm && t.includes(clienteNorm)) return true;
  if (t.startsWith('presupuesto')) return true;
  return RUIDO.includes(t);
}

module.exports = { parsear, normalizarNumeros, palabrasANumero, construirIndice, buscarConcepto };
