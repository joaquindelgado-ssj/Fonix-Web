// ALGORITMO DE FONIX — se ejecuta SOLO en el servidor.
// Lo importa únicamente pages/api/guardar-resultados.js, así que Next.js nunca
// lo incluye en el JavaScript que descarga el navegador.
//
// Protocolo v2. Se calculan:
//  - los KPIs originales de V4 (para continuidad),
//  - KPIs nuevos con fundamento experimental (d′, crowding, efectos Stroop),
//  - puntaje_legacy: la fórmula de V4 aplicada a los datos v2 (solo referencia).
// La interpretación clínica NO se hace acá: la vista `resultados_normados` de Neon
// convierte cada dominio en puntaje z contra chicos de la misma edad.

export const ENSAYOS = { m1: 4, m2: 4, m3: 4, m4: 6, m5: 20, m6: 32 };
const T_MAX = 600;
const RT_MIN = 0.2;  // respuestas anticipadas (< 200 ms) se descartan del promedio de tiempos
const RT_MAX = 10;   // respuestas muy lentas (> 10 s) también

const prom = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const red = (x, d) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 10 ** d) / 10 ** d);
const dif = (a, b) => (a == null || b == null ? null : a - b);
const rtValidos = (l) => l.filter((x) => x >= RT_MIN && x <= RT_MAX);

// ---------- validación del payload crudo ----------
const esT = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= T_MAX;
const esTN = (x) => x === null || esT(x);
const esN = (x) => Number.isInteger(x) && x >= 0 && x <= 500;
const esB = (x) => typeof x === 'boolean';
function exigir(c, msg) { if (!c) throw new Error(`Payload inválido: ${msg}`); }

export function validarRondas(r) {
  exigir(r && typeof r === 'object', 'rondas');
  for (const [k, n] of Object.entries(ENSAYOS)) {
    exigir(Array.isArray(r[k]) && r[k].length === n, `${k} debe tener ${n} ensayos`);
  }
  r.m1.forEach((x) => exigir(esN(x.aciertos) && esN(x.fallos) && esTN(x.t_primer) && esT(x.dt_total) && esB(x.amigable), 'm1'));
  exigir(r.m1.filter((x) => x.amigable).length === 2, 'm1 debe tener 2 rondas amigables');
  r.m2.forEach((x) => exigir(esN(x.aciertos) && esN(x.fallos) && esTN(x.t_primer) && Array.isArray(x.tiempos_correctos) && x.tiempos_correctos.every(esT) && esT(x.dt_total), 'm2'));
  r.m3.forEach((x) => exigir(esN(x.fallos) && esTN(x.t_primer) && esT(x.dt_total) && ['juntas', 'separadas'].includes(x.espaciado), 'm3'));
  r.m4.forEach((x) => exigir(esB(x.hay_cambio) && esB(x.respondio) && esB(x.exito) && esTN(x.t_primer) && esTN(x.t_reaccion) && esT(x.dt_total), 'm4'));
  exigir(r.m4.filter((x) => !x.hay_cambio).length === 2, 'm4 debe tener 2 rondas sin cambio');
  const casosM5 = ['congruente', 'incongruente', 'neutro', 'puntos', 'empate'];
  r.m5.forEach((x) => exigir(casosM5.includes(x.caso) && esB(x.exito) && esT(x.t_reaccion), 'm5'));
  r.m6.forEach((x) => exigir(['neutro', 'congruente', 'incongruente'].includes(x.cond) && esB(x.correcto) && esT(x.rt), 'm6'));
}

// ---------- inversa de la normal estándar (algoritmo de Acklam) ----------
function zInv(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pl) return -zInv(1 - p);
  const q = p - 0.5;
  const rr = q * q;
  return (((((a[0] * rr + a[1]) * rr + a[2]) * rr + a[3]) * rr + a[4]) * rr + a[5]) * q / (((((b[0] * rr + b[1]) * rr + b[2]) * rr + b[3]) * rr + b[4]) * rr + 1);
}

// ---------- cálculo ----------
export function calcularKpis(r) {
  // M1 — unir columnas
  const m1A = r.m1.reduce((s, x) => s + x.aciertos, 0);
  const m1F = r.m1.reduce((s, x) => s + x.fallos, 0);
  const tAmig = prom(r.m1.filter((x) => x.amigable).map((x) => x.dt_total));
  const tAgr = prom(r.m1.filter((x) => !x.amigable).map((x) => x.dt_total));
  const lat_m1 = prom(r.m1.map((x) => x.t_primer).filter(Boolean)) ?? 0;

  // M2 — separar palabras
  const m2F = r.m2.reduce((s, x) => s + x.fallos, 0);
  const tiemposCorrectos = r.m2.flatMap((x) => x.tiempos_correctos);
  const intervalos = r.m2.flatMap((x) => x.tiempos_correctos.map((t, i) => t - (i ? x.tiempos_correctos[i - 1] : 0)));
  const lat_m2 = prom(r.m2.map((x) => x.t_primer).filter(Boolean)) ?? 0;

  // M3 — símbolos espejados + crowding
  const m3F = r.m3.reduce((s, x) => s + x.fallos, 0);
  const m3Perf = r.m3.filter((x) => x.fallos === 0).length;
  const tJuntas = prom(r.m3.filter((x) => x.espaciado === 'juntas').map((x) => x.dt_total));
  const tSep = prom(r.m3.filter((x) => x.espaciado === 'separadas').map((x) => x.dt_total));
  const lat_m3 = prom(r.m3.map((x) => x.t_primer).filter(Boolean)) ?? 0;

  // M4 — detección de cambios con rondas trampa (teoría de detección de señales)
  const conCambio = r.m4.filter((x) => x.hay_cambio);
  const sinCambio = r.m4.filter((x) => !x.hay_cambio);
  const hits = conCambio.filter((x) => x.exito).length;
  const falsasAlarmas = sinCambio.filter((x) => x.respondio).length;
  // corrección log-lineal (Hautus, 1995) para evitar tasas de 0 o 1
  const H = (hits + 0.5) / (conCambio.length + 1);
  const F = (falsasAlarmas + 0.5) / (sinCambio.length + 1);
  const dprime = zInv(H) - zInv(F);
  const m4Reac = prom(conCambio.filter((x) => x.exito && x.t_reaccion).map((x) => x.t_reaccion)) ?? 0;
  const m4F = r.m4.filter((x) => !x.exito).length;
  const lat_m4 = prom(r.m4.map((x) => x.t_primer).filter(Boolean)) ?? 0;

  // M5 — Stroop numérico (solo respuestas correctas para los tiempos)
  const rtM5 = (caso) => prom(rtValidos(r.m5.filter((x) => x.caso === caso && x.exito).map((x) => x.t_reaccion)));
  const m5Ok = r.m5.filter((x) => x.exito).length;
  const m5Cong = rtM5('congruente'), m5Inc = rtM5('incongruente'), m5Neu = rtM5('neutro');

  // M6 — Stroop color-palabra
  const rtM6 = (cond) => prom(rtValidos(r.m6.filter((x) => x.cond === cond && x.correcto).map((x) => x.rt)));
  const m6Ok = r.m6.filter((x) => x.correcto).length;
  const m6Neu = rtM6('neutro'), m6Cong = rtM6('congruente'), m6Inc = rtM6('incongruente');
  const m6IncOk = r.m6.filter((x) => x.cond === 'incongruente');

  // Fórmula de V4 aplicada a los datos v2 (referencia histórica, no comparable entre versiones)
  const fallosV4 = m1F + m2F + m3F + m4F + (r.m5.length - m5Ok);
  const puntaje_legacy = Math.max(1.0, Math.min(100.0, red(100.0 - (fallosV4 * 2.5 + lat_m2 * 1.5 + m4Reac * 3.5), 1)));

  return {
    // continuidad con V4
    puntaje_legacy,
    fallos_totales: fallosV4,
    kpi_m1_precision: red(m1A + m1F ? (m1A / (m1A + m1F)) * 100 : 0, 2),
    kpi_m2_vel_seg: red(prom(tiemposCorrectos) ?? 0, 3),
    kpi_m3_discrim: red((m3Perf / ENSAYOS.m3) * 100, 2),
    kpi_m4_reaccion: red(m4Reac, 3),
    kpi_m5_precision: red((m5Ok / r.m5.length) * 100, 2),
    latencia_promedio: red(prom([lat_m1, lat_m2, lat_m3, lat_m4]), 3),
    m1_mejora_amigable_pct: red(tAgr ? ((tAgr - tAmig) / tAgr) * 100 : null, 2),
    // nuevos (v2)
    kpi_m2_seg_por_corte: red(prom(intervalos), 3),
    kpi_m3_tiempo: red(prom(r.m3.map((x) => x.dt_total)), 3),
    kpi_m3_crowding: red(dif(tJuntas, tSep), 3),
    kpi_m4_dprime: red(dprime, 3),
    kpi_m4_hits: hits,
    kpi_m4_falsas_alarmas: falsasAlarmas,
    kpi_m5_congruencia: red(dif(m5Inc, m5Cong), 3),
    kpi_m5_facilitacion: red(dif(m5Neu, m5Cong), 3),
    kpi_m5_interferencia: red(dif(m5Inc, m5Neu), 3),
    kpi_m6_precision: red((m6Ok / r.m6.length) * 100, 2),
    kpi_m6_precision_incong: red((m6IncOk.filter((x) => x.correcto).length / m6IncOk.length) * 100, 2),
    kpi_m6_interferencia: red(dif(m6Inc, m6Neu), 3),
    kpi_m6_facilitacion: red(dif(m6Neu, m6Cong), 3),
  };
}
