// Bancos de estímulos de FONIX (versión completa: 4 rondas por minijuego).
// Origen: FonixV1.5eco.py (M1 a M4) y FonixVersionPruebaFeriaV4.py (M5).
// Estos datos son los estímulos que se muestran en pantalla; el cálculo de
// KPIs y del puntaje vive solo en el servidor (lib/server/kpis.js).

export const RONDAS = 4;

// --- Minijuego 1: Unir columnas ---
export const DATOS_M1 = [
  ['hoja', 'rojo', 'fosa', 'boca'],
  ['clima', 'prima', 'firma', 'rima'],
  ['tierra', 'sierra', 'fiera', 'hierra'],
  ['planta', 'manta', 'llanta', 'canta'],
];

// 8 tipografías "complicadas" (equivalentes web de las del Python, cargadas
// desde Google Fonts para que se vean igual en cualquier tablet o PC).
// Columna izquierda usa [0..3], columna derecha usa [4..7], igual que V1.5.
export const FUENTES_COMPLICADAS = [
  { family: "'Tinos', 'Times New Roman', serif", weight: 700, size: 1.0 },          // Times New Roman
  { family: "'Gelasio', Georgia, serif", weight: 700, size: 1.0 },                  // Georgia
  { family: "'EB Garamond', Garamond, serif", weight: 700, size: 1.08 },            // Garamond
  { family: "'Courier Prime', 'Courier New', monospace", weight: 700, size: 0.95 }, // Courier New
  { family: "'Anton', Impact, sans-serif", weight: 400, size: 1.0 },                // Impact
  { family: "'Didact Gothic', 'Century Gothic', sans-serif", weight: 400, size: 0.95 }, // Century Gothic
  { family: "'Great Vibes', 'Brush Script MT', cursive", weight: 400, size: 1.25 }, // Brush Script
  { family: "'Libre Baskerville', 'Palatino Linotype', serif", weight: 700, size: 0.95 }, // Palatino
];
// Fuente amigable: Arial bold (Arimo es métricamente idéntica a Arial).
export const FUENTE_AMIGABLE = { family: "Arial, 'Arimo', sans-serif", weight: 700, size: 1.0 };

// --- Minijuego 2: Separar palabras ---
// spaces = índice de la letra DESPUÉS de la cual va un espacio.
export const DATOS_M2 = [
  { text: 'cuidemoselplaneta', spaces: [7, 9] },
  { text: 'evitausarplastico', spaces: [4, 8] },
  { text: 'ahorraaguahoy', spaces: [5, 9] },
  { text: 'usabici', spaces: [2] },
];

// --- Minijuego 3: Explorador de símbolos ---
export const DATOS_M3 = [
  { base: 'd', distinta: 'b', size: 4 },
  { base: 'p', distinta: 'q', size: 4 },
  { base: 'm', distinta: 'n', size: 5 },
  { base: 'b', distinta: 'd', size: 5 },
];

// --- Minijuego 4: Detección de cambios ---
export const POOL_M4 = [
  'BIODEGRADABLE', 'SUSTENTABILIDAD', 'REUTILIZACION', 'CONTAMINACION',
  'CORRESPONSABILIDAD', 'INTERCAMBIABILIDAD', 'INSTITUCIONALIZACION',
  'BIOCONCENTRACION', 'RECICLABILIDAD', 'RESPONSABILIDAD', 'REAPROVECHAMIENTO',
];
export const M4_VISIBLE_MS = 3000;   // palabra visible
export const M4_OCULTO_MS = 1000;    // cuadro negro
export const M4_TIMEOUT_MS = 30000;  // sin respuesta tras el cambio = fallo

// --- Minijuego 5: Cribado de discalculia ---
export const SECUENCIA_M5 = ['congruente', 'puntos', 'incongruente', 'empate'];

// ---------- utilidades de aleatorización ----------
export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Intercambia dos letras contiguas DISTINTAS (si fueran iguales, como la "RR"
// de CORRESPONSABILIDAD, la palabra no cambiaría y la ronda sería imposible).
export function palabraAlterada(palabra) {
  const candidatos = [];
  for (let i = 0; i < palabra.length - 1; i++) {
    if (palabra[i] !== palabra[i + 1]) candidatos.push(i);
  }
  const i = candidatos[randInt(0, candidatos.length - 1)];
  const l = palabra.split('');
  [l[i], l[i + 1]] = [l[i + 1], l[i]];
  return l.join('');
}

function valoresDistintos() {
  const a = randInt(1, 9);
  let b = randInt(1, 9);
  while (a === b) b = randInt(1, 9);
  return [a, b];
}

// Genera los 4 estímulos del M5, igual que jugar_m5_discalculia en V4.
export function generarRondasM5() {
  return SECUENCIA_M5.map((caso) => {
    let izq, der, fIzq, fDer;
    if (caso === 'congruente') {
      [izq, der] = valoresDistintos();
      [fIzq, fDer] = izq > der ? ['grande', 'pequeno'] : ['pequeno', 'grande'];
    } else if (caso === 'puntos') {
      [izq, der] = valoresDistintos();
      [fIzq, fDer] = mezclar(['puntos', 'neutral']);
    } else if (caso === 'incongruente') {
      [izq, der] = valoresDistintos();
      [fIzq, fDer] = izq > der ? ['pequeno', 'grande'] : ['grande', 'pequeno'];
    } else {
      izq = der = randInt(3, 9);
      [fIzq, fDer] = mezclar(['puntos', 'neutral']);
    }
    return {
      caso,
      izq: { valor: izq, formato: fIzq, puntos: fIzq === 'puntos' ? posicionesPuntos(izq) : [] },
      der: { valor: der, formato: fDer, puntos: fDer === 'puntos' ? posicionesPuntos(der) : [] },
    };
  });
}

// Puntos repartidos sin superponerse (en % del recuadro).
function posicionesPuntos(n) {
  const pts = [];
  let intentos = 0;
  while (pts.length < n && intentos < 2000) {
    intentos++;
    const p = { x: randInt(12, 88), y: randInt(12, 88) };
    if (pts.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 16)) pts.push(p);
  }
  return pts;
}

export const PROVINCIAS = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];
