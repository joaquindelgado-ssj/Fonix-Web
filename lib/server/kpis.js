// ALGORITMO DE FONIX — se ejecuta SOLO en el servidor.
// Este archivo únicamente lo importa pages/api/guardar-resultados.js, así que
// Next.js nunca lo incluye en el JavaScript que descarga el navegador.
// Fórmulas trasladadas 1:1 desde EvaluadorMetricas.calcular_kpis()
// de FonixVersionPruebaFeriaV4.py, extendidas a 4 rondas por minijuego.

const RONDAS = 4;
const T_MAX = 600; // segundos: cualquier tiempo mayor se considera inválido

const promedio = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
const redondear = (x, d) => Math.round(x * 10 ** d) / 10 ** d;

// ---------- validación del payload crudo ----------
const esTiempo = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0 && x <= T_MAX;
const esTiempoONulo = (x) => x === null || esTiempo(x);
const esConteo = (x) => Number.isInteger(x) && x >= 0 && x <= 500;

function exigir(cond, msg) {
  if (!cond) throw new Error(`Payload inválido: ${msg}`);
}

export function validarRondas(r) {
  exigir(r && typeof r === 'object', 'rondas');
  for (const k of ['m1', 'm2', 'm3', 'm4', 'm5']) {
    exigir(Array.isArray(r[k]) && r[k].length === RONDAS, `${k} debe tener ${RONDAS} rondas`);
  }
  r.m1.forEach((x) => exigir(esConteo(x.aciertos) && esConteo(x.fallos) && esTiempoONulo(x.t_primer) && esTiempo(x.dt_total) && typeof x.amigable === 'boolean', 'm1'));
  exigir(r.m1.filter((x) => x.amigable).length === 1, 'm1 debe tener exactamente una ronda amigable');
  r.m2.forEach((x) => exigir(esConteo(x.aciertos) && esConteo(x.fallos) && esTiempoONulo(x.t_primer) && Array.isArray(x.tiempos_correctos) && x.tiempos_correctos.every(esTiempo) && esTiempo(x.dt_total), 'm2'));
  r.m3.forEach((x) => exigir(esConteo(x.fallos) && esTiempoONulo(x.t_primer) && esTiempo(x.dt_total), 'm3'));
  r.m4.forEach((x) => exigir(typeof x.exito === 'boolean' && esTiempoONulo(x.t_primer) && esTiempoONulo(x.t_reaccion) && esTiempo(x.dt_total), 'm4'));
  r.m5.forEach((x) => exigir(typeof x.exito === 'boolean' && esTiempo(x.t_reaccion), 'm5'));
}

// ---------- cálculo ----------
export function calcularKpis(r) {
  // Agregación igual a los registrar_ronda_mX del Python
  const m1 = {
    aciertos: 0, fallos: 0, t_primer: [], agresivas: [], amigable: null,
  };
  r.m1.forEach((x) => {
    m1.aciertos += x.aciertos;
    m1.fallos += x.fallos;
    if (x.t_primer) m1.t_primer.push(x.t_primer);
    if (x.amigable) m1.amigable = x.dt_total; else m1.agresivas.push(x.dt_total);
  });

  const m2 = { aciertos: 0, fallos: 0, t_primer: [], correctos: [] };
  r.m2.forEach((x) => {
    m2.aciertos += x.aciertos;
    m2.fallos += x.fallos;
    m2.correctos.push(...x.tiempos_correctos);
    if (x.t_primer) m2.t_primer.push(x.t_primer);
  });

  const m3 = { fallos: 0, t_primer: [], perfectas: 0 };
  r.m3.forEach((x) => {
    m3.fallos += x.fallos;
    if (x.fallos === 0) m3.perfectas += 1;
    if (x.t_primer) m3.t_primer.push(x.t_primer);
  });

  const m4 = { aciertos: 0, fallos: 0, t_primer: [], reaccion: [] };
  r.m4.forEach((x) => {
    if (x.exito) {
      m4.aciertos += 1;
      if (x.t_reaccion) m4.reaccion.push(x.t_reaccion);
    } else {
      m4.fallos += 1;
    }
    if (x.t_primer) m4.t_primer.push(x.t_primer);
  });

  const m5 = { aciertos: 0, fallos: 0 };
  r.m5.forEach((x) => { if (x.exito) m5.aciertos += 1; else m5.fallos += 1; });

  // KPIs (V4)
  const totM1 = m1.aciertos + m1.fallos;
  const kpi_m1_precision = totM1 > 0 ? (m1.aciertos / totM1) * 100 : 0;
  const kpi_m2_vel_seg = promedio(m2.correctos);
  const kpi_m3_discrim = (m3.perfectas / RONDAS) * 100;
  const kpi_m4_reaccion = promedio(m4.reaccion);
  const totM5 = m5.aciertos + m5.fallos;
  const kpi_m5_precision = totM5 > 0 ? (m5.aciertos / totM5) * 100 : 0;

  const lat_m1 = promedio(m1.t_primer);
  const lat_m2 = promedio(m2.t_primer);
  const lat_m3 = promedio(m3.t_primer);
  const lat_m4 = promedio(m4.t_primer);

  const fallos_totales = m1.fallos + m2.fallos + m3.fallos + m4.fallos + m5.fallos;
  const penalidad = fallos_totales * 2.5 + lat_m2 * 1.5 + kpi_m4_reaccion * 3.5;
  const puntaje_global = Math.max(1.0, Math.min(100.0, redondear(100.0 - penalidad, 1)));

  // Extra de V1.5: comparación tipografía amigable vs agresiva (M1)
  const promAgresivas = promedio(m1.agresivas);
  const mejora_amigable_pct = promAgresivas > 0
    ? ((promAgresivas - (m1.amigable ?? 0)) / promAgresivas) * 100
    : 0;

  return {
    puntaje_global,
    fallos_totales,
    kpi_m1_precision: redondear(kpi_m1_precision, 2),
    kpi_m2_vel_seg: redondear(kpi_m2_vel_seg, 3),
    kpi_m3_discrim: redondear(kpi_m3_discrim, 2),
    kpi_m4_reaccion: redondear(kpi_m4_reaccion, 3),
    kpi_m5_precision: redondear(kpi_m5_precision, 2),
    latencia_promedio: redondear(promedio([lat_m1, lat_m2, lat_m3, lat_m4]), 3),
    m1_mejora_amigable_pct: redondear(mejora_amigable_pct, 2),
  };
}
