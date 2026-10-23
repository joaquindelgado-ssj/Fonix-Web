import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, edad, provincia, colegio, numero_prueba, datos_crudos } = req.body;

  try {
    // Inicializamos el cliente serverless de Neon usando la variable de entorno de Vercel
    const sql = neon(process.env.DATABASE_URL);

    // --- CÁLCULOS Y FÓRMULAS MATEMÁTICAS ---
    const totM1 = (datos_crudos.m1_aciertos || 0) + (datos_crudos.m1_fallos || 0);
    const kpi_m1_precision = totM1 > 0 ? parseFloat(((datos_crudos.m1_aciertos / totM1) * 100).toFixed(2)) : 0;

    const lenM2 = datos_crudos.m2_tiempos ? datos_crudos.m2_tiempos.length : 0;
    const kpi_m2_vel_seg = lenM2 > 0 ? parseFloat((datos_crudos.m2_tiempos.reduce((a, b) => a + b, 0) / lenM2).toFixed(3)) : 0;

    const kpi_m3_discrim = datos_crudos.m3_rondas_totales > 0 
      ? parseFloat(((datos_crudos.m3_rondas_perfectas / datos_crudos.m3_rondas_totales) * 100).toFixed(2)) 
      : 100;

    const lenM4 = datos_crudos.m4_tiempos_reaccion ? datos_crudos.m4_tiempos_reaccion.length : 0;
    const kpi_m4_reaccion = lenM4 > 0 ? parseFloat((datos_crudos.m4_tiempos_reaccion.reduce((a, b) => a + b, 0) / lenM4).toFixed(3)) : 0;

    const totM5 = (datos_crudos.m5_aciertos || 0) + (datos_crudos.m5_fallos || 0);
    const kpi_m5_precision = totM5 > 0 ? parseFloat(((datos_crudos.m5_aciertos / totM5) * 100).toFixed(2)) : 0;

    const latencias = [
      datos_crudos.lat_m1 || 0,
      datos_crudos.lat_m2 || 0,
      datos_crudos.lat_m3 || 0,
      datos_crudos.lat_m4 || 0
    ].filter(v => v > 0);
    const latencia_promedio = latencias.length > 0 ? parseFloat((latencias.reduce((a, b) => a + b, 0) / latencias.length).toFixed(3)) : 0;

    const fallos_totales = 
      (datos_crudos.m1_fallos || 0) + 
      (datos_crudos.m2_fallos || 0) + 
      (datos_crudos.m3_fallos || 0) + 
      (datos_crudos.m4_fallos || 0) + 
      (datos_crudos.m5_fallos || 0);

    const penalidad = (fallos_totales * 2.5) + (datos_crudos.lat_m2 || kpi_m2_vel_seg) * 1.5 + (kpi_m4_reaccion * 3.5);
    const puntaje_global = Math.max(1.0, Math.min(100.0, parseFloat((100.0 - penalidad).toFixed(1))));

    const fecha_hora = new Date().toISOString();

    // --- INSERCIÓN EN NEON ---
    await sql`
      INSERT INTO resultados_feria (
        numero_prueba, nombre, edad, provincia, colegio, fecha_hora, puntaje_global, fallos_totales,
        kpi_m1_precision, kpi_m2_vel_seg, kpi_m3_discrim, kpi_m4_reaccion,
        kpi_m5_precision, latencia_promedio
      ) VALUES (
        ${numero_prueba}, ${nombre}, ${edad}, ${provincia}, ${colegio}, ${fecha_hora}, ${puntaje_global}, ${fallos_totales},
        ${kpi_m1_precision}, ${kpi_m2_vel_seg}, ${kpi_m3_discrim}, ${kpi_m4_reaccion},
        ${kpi_m5_precision}, ${latencia_promedio}
      )
    `;

    return res.status(200).json({ success: true, puntaje_global });
  } catch (error) {
    console.error('Error al guardar en Neon:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
