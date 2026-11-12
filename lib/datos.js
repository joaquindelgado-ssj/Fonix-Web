// Bancos de estímulos de FONIX — protocolo v2 (feria nacional 2026).
// Cambios respecto del Python, con fundamento en el README:
//  M1: 4 sets de igual dificultad + orden ABBA/BAAB (2 rondas amigables, 2 agresivas)
//  M2: 4 frases con exactamente 2 cortes y 13–15 letras
//  M3: 4 pares espejados; 2 rondas con letras juntas (crowding) y 2 separadas
//  M4: 6 rondas (4 con cambio + 2 "trampa" sin cambio), palabras de 6–8 letras,
//      cambio solo en letras interiores
//  M5: 20 ensayos (congruente, incongruente, neutro, puntos, empate)
//  Stroop: 32 estímulos (12 neutros, 8 congruentes, 12 incongruentes)
// El cálculo de KPIs vive solo en el servidor (lib/server/kpis.js).

export const VERSION_PRUEBA = 2;

export const ENSAYOS = { m1: 4, m2: 4, m3: 4, m4: 6, m5: 20, m6: 32 };

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

const enGrupos = (arr, n) => Array.from({ length: arr.length / n }, (_, i) => arr.slice(i * n, i * n + n));

// ---------- Minijuego 1: Unir columnas ----------
// Sets de igual dificultad: 4 letras, solo cambia la primera (vecinos ortográficos).
export const SETS_M1 = [
  ['pato', 'gato', 'dato', 'rato'],
  ['luna', 'cuna', 'puna', 'duna'],
  ['casa', 'masa', 'pasa', 'tasa'],
  ['pino', 'vino', 'lino', 'fino'],
];

// 8 tipografías "complicadas" (equivalentes web de las del Python).
// Columna izquierda usa [0..3], columna derecha usa [4..7].
export const FUENTES_COMPLICADAS = [
  { family: "'Tinos', 'Times New Roman', serif", weight: 700, size: 1.0 },
  { family: "'Gelasio', Georgia, serif", weight: 700, size: 1.0 },
  { family: "'EB Garamond', Garamond, serif", weight: 700, size: 1.08 },
  { family: "'Courier Prime', 'Courier New', monospace", weight: 700, size: 0.95 },
  { family: "'Anton', Impact, sans-serif", weight: 400, size: 1.0 },
  { family: "'Didact Gothic', 'Century Gothic', sans-serif", weight: 400, size: 0.95 },
  { family: "'Great Vibes', 'Brush Script MT', cursive", weight: 400, size: 1.25 },
  { family: "'Libre Baskerville', 'Palatino Linotype', serif", weight: 700, size: 0.95 },
];
export const FUENTE_AMIGABLE = { family: "Arial, 'Arimo', sans-serif", weight: 700, size: 1.0 };

// Orden contrabalanceado: un participante ABBA, el siguiente BAAB (A = amigable).
// Se alterna por dispositivo; los sets de palabras se asignan al azar a cada ronda.
export function planM1() {
  let n = 0;
  try {
    n = parseInt(localStorage.getItem('fonix_contrabalanceo') || '0', 10) || 0;
    localStorage.setItem('fonix_contrabalanceo', String(n + 1));
  } catch { n = randInt(0, 1); }
  const orden = n % 2 === 0 ? [true, false, false, true] : [false, true, true, false];
  const sets = mezclar(SETS_M1);
  return orden.map((amigable, i) => ({ amigable, palabras: sets[i] }));
}

// ---------- Minijuego 2: Separar palabras ----------
// spaces = índice de la letra DESPUÉS de la cual va un espacio.
export const DATOS_M2 = [
  { text: 'cuidemoselagua', spaces: [7, 9] },   // cuidemos el agua
  { text: 'separálabasura', spaces: [5, 7] },   // separá la basura
  { text: 'plantáunárbol', spaces: [5, 7] },    // plantá un árbol
  { text: 'reciclámáspapel', spaces: [6, 9] },  // reciclá más papel
];

// ---------- Minijuego 3: Explorador de símbolos ----------
const PARES_M3 = [
  { base: 'b', distinta: 'd', size: 4 },
  { base: 'p', distinta: 'q', size: 4 },
  { base: 'd', distinta: 'b', size: 5 },
  { base: 'q', distinta: 'p', size: 5 },
];
// En cada tamaño de grilla, una ronda va con letras juntas (crowding) y otra separadas.
// La intrusa se ubica a distancia controlada del centro (anillo intermedio).
export function planM3() {
  const juntas4 = randInt(0, 1);
  const juntas5 = randInt(2, 3);
  return PARES_M3.map((p, i) => {
    const s = p.size;
    const c = (s - 1) / 2;
    const candidatos = [];
    for (let k = 0; k < s * s; k++) {
      // distancia euclídea al centro entre 1 y 1,6 celdas (8 posiciones en 4x4 y en 5x5)
      const d = Math.hypot(Math.floor(k / s) - c, (k % s) - c);
      if (d >= 1 && d <= 1.6) candidatos.push(k);
    }
    return {
      ...p,
      espaciado: i === juntas4 || i === juntas5 ? 'juntas' : 'separadas',
      objetivo: candidatos[randInt(0, candidatos.length - 1)],
    };
  });
}

// ---------- Minijuego 4: Detección de cambios ----------
export const POOL_M4 = ['PLANETA', 'RECICLAR', 'BASURA', 'SEMILLA', 'BOSQUE', 'NATURAL', 'COMPOST', 'PAISAJE'];
export const M4_VISIBLE_MS = 3000;
export const M4_OCULTO_MS = 1000;
export const M4_TIMEOUT_MS = 30000;
export const M4_FASES_SIN_CAMBIO = 3; // las rondas trampa terminan tras 3 apariciones (~11 s)

export function planM4() {
  const palabras = mezclar(POOL_M4).slice(0, ENSAYOS.m4);
  const tipos = mezclar([true, true, true, true, false, false]); // true = hay cambio
  return palabras.map((palabra, i) => ({ palabra, hayCambio: tipos[i] }));
}

// Intercambia dos letras contiguas DISTINTAS y solo en el interior de la palabra
// (la primera y la última no se tocan, como en la dislexia de posición de letras).
export function palabraAlterada(palabra) {
  const candidatos = [];
  for (let i = 1; i <= palabra.length - 3; i++) {
    if (palabra[i] !== palabra[i + 1]) candidatos.push(i);
  }
  const i = candidatos[randInt(0, candidatos.length - 1)];
  const l = palabra.split('');
  [l[i], l[i + 1]] = [l[i + 1], l[i]];
  return l.join('');
}

// ---------- Minijuego 5: Números y cantidades (Stroop numérico) ----------
// 5 congruentes + 5 incongruentes con las MISMAS parejas (controla la distancia),
// 5 neutros (mismo tamaño), 3 puntos vs número, 2 empates. 4 rondas de 5.
function parejaConDistancia(d) {
  const a = randInt(1, 9 - d);
  return mezclar([a, a + d]);
}
const lado = (valor, formato) => ({ valor, formato, puntos: formato === 'puntos' ? posicionesPuntos(valor) : [] });

export function planM5() {
  const distancias = [1, 2, 3, 4, 6];
  const ensayos = [];
  distancias.forEach((d) => {
    const [a, b] = parejaConDistancia(d);
    const mayorIzq = a > b;
    // congruente: el mayor valor se ve más grande
    ensayos.push({ caso: 'congruente', distancia: d, izq: lado(a, mayorIzq ? 'grande' : 'pequeno'), der: lado(b, mayorIzq ? 'pequeno' : 'grande') });
    // incongruente (misma pareja): el mayor valor se ve más chico
    const [c, e] = mezclar([a, b]);
    ensayos.push({ caso: 'incongruente', distancia: d, izq: lado(c, c > e ? 'pequeno' : 'grande'), der: lado(e, c > e ? 'grande' : 'pequeno') });
    const [n1, n2] = parejaConDistancia(d);
    ensayos.push({ caso: 'neutro', distancia: d, izq: lado(n1, 'neutral'), der: lado(n2, 'neutral') });
  });
  [2, 3, 5].forEach((d) => {
    const [a, b] = parejaConDistancia(d);
    const [fa, fb] = mezclar(['puntos', 'neutral']);
    ensayos.push({ caso: 'puntos', distancia: d, izq: lado(a, fa), der: lado(b, fb) });
  });
  for (let k = 0; k < 2; k++) {
    const v = randInt(3, 9);
    const [fa, fb] = mezclar(['puntos', 'neutral']);
    ensayos.push({ caso: 'empate', distancia: 0, izq: lado(v, fa), der: lado(v, fb) });
  }
  return enGrupos(mezclar(ensayos), 5);
}

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

// ---------- Minijuego Stroop (color-palabra) ----------
export const COLORES_STROOP = [
  { id: 'rojo', palabra: 'ROJO', hex: '#d62828' },
  { id: 'azul', palabra: 'AZUL', hex: '#1d4ed8' },
  { id: 'negro', palabra: 'NEGRO', hex: '#111111' },
  { id: 'amarillo', palabra: 'AMARILLO', hex: '#d9a400' },
];

// 12 neutros (XXXX), 8 congruentes, 12 incongruentes; mezclados en 4 rondas de 8.
// Se evita repetir la misma tinta en dos estímulos seguidos.
export function planStroop() {
  const C = COLORES_STROOP;
  const ensayos = [];
  for (let k = 0; k < 12; k++) {
    const tinta = C[k % 4];
    ensayos.push({ cond: 'neutro', texto: 'X'.repeat(tinta.palabra.length), tinta: tinta.id });
  }
  for (let k = 0; k < 8; k++) {
    const t = C[k % 4];
    ensayos.push({ cond: 'congruente', texto: t.palabra, tinta: t.id });
  }
  for (let k = 0; k < 12; k++) {
    const tinta = C[k % 4];
    const otras = C.filter((c) => c.id !== tinta.id);
    ensayos.push({ cond: 'incongruente', texto: otras[k % 3].palabra, tinta: tinta.id });
  }
  let orden;
  for (let intento = 0; intento < 200; intento++) {
    orden = mezclar(ensayos);
    if (orden.every((e, i) => i === 0 || e.tinta !== orden[i - 1].tinta)) break;
  }
  return enGrupos(orden, 8);
}

export const PROVINCIAS = [
  'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];
