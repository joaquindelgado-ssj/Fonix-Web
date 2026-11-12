// Buscador de escuelas del padrón oficial (data.educacion.gob.ar), cargado en la tabla `escuelas` de Neon.
// GET /api/escuelas?provincia=Córdoba&q=ipet 392
import { neon } from '@neondatabase/serverless';

const PROVINCIA_PADRON = { CABA: 'Ciudad de Buenos Aires' };
const normalizar = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  const provincia = PROVINCIA_PADRON[req.query.provincia] || String(req.query.provincia || '').slice(0, 40);
  const palabras = normalizar(req.query.q).split(' ').filter((w) => w.length >= 2 || /\d/.test(w)).slice(0, 5);
  if (!provincia || palabras.join('').length < 3) return res.status(200).json({ escuelas: [] });

  try {
    const sql = neon(process.env.DATABASE_URL);
    const params = [provincia];
    const filtros = palabras.map((w) => { params.push(`%${w}%`); return `busqueda LIKE $${params.length}`; });
    const enNombre = palabras.map((w, i) => `(nombre_busqueda LIKE $${i + 2})::int`).join(' + ');
    params.push(palabras.join(' '));
    const filas = await sql(
      `SELECT cue, nombre, localidad, domicilio, sector
         FROM escuelas
        WHERE provincia = $1 AND ${filtros.join(' AND ')}
        ORDER BY (${enNombre}) DESC, similarity(nombre_busqueda, $${params.length}) DESC, nombre
        LIMIT 8`,
      params,
    );
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({ escuelas: filas });
  } catch (e) {
    console.error('Error buscando escuelas:', e);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
