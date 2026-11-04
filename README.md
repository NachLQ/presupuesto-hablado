# Presupuesto Hablado

**Del dictado al presupuesto en 2 minutos.**

App mobile-first para técnicos y oficios en España (fontanería, electricidad, reformas,
climatización). El técnico dicta el trabajo al salir de la visita, el parser detecta
conceptos, cantidades y precios, revisa las líneas en pantalla, añade los datos del
cliente y exporta un PDF profesional listo para enviar.

> *"Dicta el trabajo al salir de la visita y el presupuesto llega antes que tú al coche."*

---

## ¿Qué es y para quién?

- **Usuario:** fontaneros, electricistas, reformistas y técnicos de clima que odian
  sentarse a redactar presupuestos. Lo usan en la furgoneta o en el portal del cliente,
  con el móvil y con una mano.
- **Idea clave:** el técnico ya sabe qué hay que hacer y cuánto cuesta. Solo necesita
  *hablar*. El resto lo hace la app.

---

## Instalación y arranque

Requisitos: **Node.js 18+** (probado con Node 24) y npm.

```bash
# 1. Instalar dependencias (raíz, server y client)
npm run install:all
# (equivale a: npm install && npm --prefix server install && npm --prefix client install)

# 2. Cargar datos demo (tarifario + 3 presupuestos de ejemplo)
npm run seed

# 3. Arrancar server (API :4000) y client (Vite :5173) a la vez
npm run dev
```

Abre **http://localhost:5173** en el navegador.

- API REST: `http://localhost:4000/api`
- El cliente hace *proxy* de `/api` al server, así que no hay que configurar nada.
- Base de datos: SQLite en `server/data/presupuesto-hablado.db` (se crea sola).

Para arrancar por separado: `npm run dev:server` y `npm run dev:client`.

---

## Cómo usar el dictado (navegadores compatibles)

El dictado usa la **Web Speech API** del navegador (reconocimiento de voz nativo, sin
ninguna API externa ni coste).

- ✅ **Chrome en Android** (el caso de uso principal) y Chrome/Edge en escritorio.
- ⚠️ Firefox y Safari tienen soporte parcial o nulo: en ese caso la app lo detecta y
  muestra un aviso. **La entrada por texto escrito siempre está disponible** y produce
  exactamente el mismo resultado.

Flujo: toca el **botón naranja enorme** → habla con naturalidad ("cambio de grifo a 45
euros, dos horas de mano de obra a 35 la hora…") → toca de nuevo para parar → pulsa
**"Analizar y crear líneas"**.

> En la primera visita el navegador pedirá permiso de micrófono. Hay que aceptarlo.

---

## Cómo funciona el parser (explicación llana)

El parser es **por reglas + diccionario del oficio**, no usa IA. Hace 4 cosas:

1. **Convierte números en letra a cifra** hasta 1000: "cuarenta y cinco" → 45,
   "doscientos cincuenta" → 250.
2. **Separa el texto en conceptos** por comas y por la "y" que une dos conceptos
   (la "y" interna de un número, como "cuarenta y cinco", no rompe el número).
3. **Detecta precio y cantidad** en cada concepto:
   - Precio con moneda: `"a 45 euros"`, `"45€"`, `"15 eur"`.
   - Precio por unidad: `"a 35 la hora"`, `"a 12 el metro"`.
   - Cantidad: un número al inicio o seguido de una unidad de conteo
     (`"2 horas"`, `"3 puntos"`, `"8 metros cuadrados"`).
4. **Busca el concepto en el tarifario** por nombre o sinónimos:
   - Si el texto trae precio → usa ese precio (origen **voz**).
   - Si no trae precio pero el concepto está en el tarifario → usa el precio del
     tarifario (origen **tarifario**, con su distintivo visual).
   - Si no se reconoce y no hay precio → se muestra aparte como "no reconocido".

Cada línea resultante es `{ concepto, cantidad, precio_unitario, total, origen }`.

---

## Cómo gestionar el tarifario

Pestaña **Tarifario** (nav inferior):

- Filtra por oficio (fontanería, electricidad, reformas, climatización, general).
- Añade / edita / elimina conceptos: nombre, precio, unidad y **sinónimos** (las formas
  en que lo dirías al dictar — cuantos más, mejor reconoce el parser).
- Si un oficio está vacío, un botón **carga su diccionario inicial** completo.

**Actualización en un toque:** si en la revisión corriges el precio de una línea que vino
del tarifario, la app te pregunta *"¿Actualizar precio en el tarifario?"*. Un toque y
queda guardado para la próxima.

---

## Las 5 transcripciones de prueba y qué genera cada una

Puedes probarlas escribiéndolas en el campo de texto. También hay un test automático:

```bash
npm run seed                 # asegúrate de tener el tarifario cargado
node server/src/test-parser.js
```

| # | Transcripción | Resultado |
|---|---------------|-----------|
| 1 | *Cambio de grifo de cocina monomando a cuarenta y cinco euros, dos horas de mano de obra a 35 la hora, desplazamiento 15 euros* | **3 líneas** (origen voz): grifo monomando 45 €, 2 h MO 70 €, desplazamiento 15 €. **Total base 130 €.** |
| 2 | *Tres puntos de luz, instalación de dos enchufes y un interruptor, cuadro eléctrico revisión* | **4 líneas, todas desde el tarifario** (sin precio en el texto): 3× punto de luz (enchufe), 2× enchufe, 1× interruptor, 1× cuadro eléctrico revisión. |
| 3 | *Cuarto de baño completo, cambio WC, cambio ducha, alicatado 8 metros cuadrados, pintura, dos horas de peón* | **5 líneas** mezclando fontanería y reformas (WC, ducha, 8 m² alicatado, pintura, 2 h peón). "Cuarto de baño completo" se marca como no reconocido (es un encabezado, no un concepto). |
| 4 | *Presupuesto para María López, cambio calentador eléctrico 50 litros, incluye materiales* | **1 línea** (calentador eléctrico 50L desde tarifario) **+ cliente detectado: "María López"** (se rellena solo). |
| 5 | Texto largo con conceptos reconocibles y desconocidos | Detecta lo que reconoce (sifón, enchufes, caldera, pintura…) y **lista aparte lo que no** (saludos, "estantería flotante", "persiana"…) para que decidas. |

> Nota honesta sobre el caso 2: el enunciado original hablaba de "6 líneas". El parser
> produce **4 líneas** reales (una por concepto detectado), todas con origen *tarifario*,
> que es el criterio clave (ningún precio venía en el texto). La tabla documenta la salida
> real, que es contra la que se valida.

---

## Cómo exportar el PDF

En la sección de datos del cliente, pulsa **"Exportar PDF profesional"**. El PDF se genera
**en el navegador** (jsPDF + autoTable, sin servidor de PDF) e incluye:

- Cabecera con los datos del técnico/empresa (configurables en **Ajustes**).
- Datos del cliente y descripción del trabajo.
- Tabla de líneas con cantidades y precios.
- **Base imponible, IVA (21% / 10% / exento) y total.**
- Validez de la oferta, condiciones de pago y espacio para firma de ambas partes.

Al exportar, el presupuesto se **guarda** automáticamente y, si estaba en borrador, pasa a
**enviado**. Desde el **Historial** puedes reexportar el PDF de cualquier presupuesto.

---

## Qué incluye el seed

- **Configuración demo** de un técnico ("Instalaciones García SL").
- **45 conceptos de tarifario**: 15 de fontanería, 15 de electricidad, 15 de reformas,
  cada uno con sinónimos y precio realista.
- **3 presupuestos** en el historial:
  - 1 **aceptado** (fontanería, hace 2 semanas).
  - 1 **enviado** sin respuesta (electricidad, hace 3 días).
  - 1 **borrador** en proceso (reformas).

---

## Estructura del proyecto

```
presupuesto-hablado/
├── package.json            # scripts raíz (install:all, seed, dev)
├── server/                 # API Node + Express + SQLite (better-sqlite3)
│   └── src/
│       ├── index.js        # arranque Express (:4000)
│       ├── db.js           # esquema y conexión SQLite
│       ├── diccionario.js  # tarifario inicial por oficio
│       ├── parser.js       # parser por reglas (núcleo del producto)
│       ├── seed.js         # datos demo
│       ├── test-parser.js  # prueba de las 5 transcripciones
│       └── routes/         # configuracion, tarifario, parser, presupuestos
└── client/                 # React 18 + Vite + Tailwind (mobile-first)
    └── src/
        ├── App.jsx         # orquesta el flujo dictado→revisión→cliente→PDF
        ├── api.js          # cliente REST
        ├── lib/
        │   ├── useSpeech.js  # hook Web Speech API
        │   └── pdf.js        # generación del PDF (jsPDF)
        └── components/     # Dictado, RevisionLineas, DatosCliente,
                            # Tarifario, Historial, Configuracion, NavInferior
```

---

## API REST

```
GET  /api/health

GET  /api/configuracion
PUT  /api/configuracion

GET    /api/tarifario[?oficio=]
POST   /api/tarifario
PUT    /api/tarifario/:id
DELETE /api/tarifario/:id
POST   /api/tarifario/importar-oficio   { oficio }

POST /api/parser                         { texto } -> { lineas, no_detectado, cliente_detectado }

GET    /api/presupuestos[?estado=&cliente=]
POST   /api/presupuestos
GET    /api/presupuestos/:id
PUT    /api/presupuestos/:id
DELETE /api/presupuestos/:id
POST   /api/presupuestos/:id/exportar-pdf   -> devuelve datos para el PDF y marca enviado
```

---

## Qué queda fuera del MVP

- Transcripción con IA externa (Whisper o similar) para mejorar el parser.
- Envío directo por WhatsApp / email.
- Firma digital.
- Multiusuario y autenticación.
- Sincronización con facturación / contabilidad.

> Las integraciones externas están pensadas como punto de conexión limpio: el endpoint
> `exportar-pdf` ya separa "datos del presupuesto" de "render", de modo que enchufar un
> envío por email o WhatsApp en fase 2 no toca el núcleo.
