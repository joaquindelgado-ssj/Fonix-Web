import { neon } from '@neondatabase/serverless';
import { calcularKpis, validarRondas } from '../../lib/server/kpis';

const texto = (v, max) => String(v ?? '').trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { id_sesion, participante, rondas } = req.body || {};

  // --- Validación ---
  let p;
  try {
    p = {
      nombre: texto(participante?.nombre, 60),
      edad: parseInt(participante?.edad, 10),
      provincia: texto(participante?.provincia, 40),
      colegio: texto(participante?.colegio, 80),
    };
    if (!p.nombre) throw new Error('Falta el nombre');
    if (!Number.isInteger(p.edad) || p.edad < 3 || p.edad > 120) throw new Error('Edad inválida');
    if (typeof id_sesion !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(id_sesion)) throw new Error('id_sesion inválido');
    validarRondas(rondas);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  try {
    // --- Algoritmo (solo servidor) ---
    const k = calcularKpis(rondas);
    const sql = neon(process.env.DATABASE_URL);

    // numero_prueba lo asigna la base (correlativo global, no se reinicia al recargar).
    // id_sesion evita duplicados si el navegador reintenta un envío.
    const filas = await sql`
      INSERT INTO resultados_feria (
        id_sesion, version_prueba, numero_prueba, nombre, edad, provincia, colegio, fecha_hora,
        puntaje_global, puntaje_legacy, fallos_totales,
        kpi_m1_precision, kpi_m2_vel_seg, kpi_m3_discrim, kpi_m4_reaccion,
        kpi_m5_precision, latencia_promedio, m1_mejora_amigable_pct,
        kpi_m2_seg_por_corte, kpi_m3_tiempo, kpi_m3_crowding,
        kpi_m4_dprime, kpi_m4_hits, kpi_m4_falsas_alarmas,
        kpi_m5_congruencia, kpi_m5_facilitacion, kpi_m5_interferencia,
        kpi_m6_precision, kpi_m6_precision_incong, kpi_m6_interferencia, kpi_m6_facilitacion,
        datos_crudos
      ) VALUES (
        ${id_sesion}, 2,
        (SELECT COALESCE(MAX(numero_prueba), 0) + 1 FROM resultados_feria),
        ${p.nombre}, ${p.edad}, ${p.provincia}, ${p.colegio},
        (now() AT TIME ZONE 'America/Argentina/Buenos_Aires'),
        ${k.puntaje_legacy}, ${k.puntaje_legacy}, ${k.fallos_totales},
        ${k.kpi_m1_precision}, ${k.kpi_m2_vel_seg}, ${k.kpi_m3_discrim}, ${k.kpi_m4_reaccion},
        ${k.kpi_m5_precision}, ${k.latencia_promedio}, ${k.m1_mejora_amigable_pct},
        ${k.kpi_m2_seg_por_corte}, ${k.kpi_m3_tiempo}, ${k.kpi_m3_crowding},
        ${k.kpi_m4_dprime}, ${k.kpi_m4_hits}, ${k.kpi_m4_falsas_alarmas},
        ${k.kpi_m5_congruencia}, ${k.kpi_m5_facilitacion}, ${k.kpi_m5_interferencia},
        ${k.kpi_m6_precision}, ${k.kpi_m6_precision_incong}, ${k.kpi_m6_interferencia}, ${k.kpi_m6_facilitacion},
        ${JSON.stringify(rondas)}::jsonb
      )
      ON CONFLICT (id_sesion) DO NOTHING
      RETURNING numero_prueba
    `;

    // No devolvemos KPIs ni puntaje: el participante solo ve el agradecimiento.
    return res.status(200).json({ ok: true, numero_prueba: filas[0]?.numero_prueba ?? null });
  } catch (error) {
    console.error('Error al guardar en Neon:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
