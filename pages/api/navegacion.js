// Recibe eventos de navegación de la web y los guarda en la tabla `navegacion` de Neon.
// Data Studio los lee desde la vista `dashboard_navegacion`.
import { neon } from '@neondatabase/serverless';

const EVENTOS = new Set([
  'visita', 'inicio_prueba', 'juego_inicio', 'juego_fin', 'fin_prueba',
  'cancelacion', 'abandono', 'nueva_prueba', 'sobre_nosotros',
]);
const JUEGOS = new Set(['m1', 'm2', 'm3', 'm4', 'm5', 'm6']);
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|vercel|monitor|curl|wget|python|axios/i;

const corto = (v, max) => (v == null ? null : String(v).slice(0, max));
const entero = (v, min, max) => (Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : null);

function leerAgente(ua, tactil, ancho) {
  const so = /android/i.test(ua) ? 'Android'
    : /iphone|ipad|ipod/i.test(ua) ? 'iOS'
      : /cros/i.test(ua) ? 'ChromeOS'
        : /windows/i.test(ua) ? 'Windows'
          : /mac os x|macintosh/i.test(ua) ? (tactil ? 'iOS' : 'macOS') // iPadOS se presenta como Mac
            : /linux/i.test(ua) ? 'Linux' : 'Otro';
  const navegador = /edg\//i.test(ua) ? 'Edge'
    : /opr\/|opera/i.test(ua) ? 'Opera'
      : /samsungbrowser/i.test(ua) ? 'Samsung Internet'
        : /firefox|fxios/i.test(ua) ? 'Firefox'
          : /chrome|crios/i.test(ua) ? 'Chrome'
            : /safari/i.test(ua) ? 'Safari' : 'Otro';
  let dispositivo = 'Computadora';
  if (/ipad|tablet/i.test(ua) || (tactil && (so === 'iOS' || so === 'Android') && ancho >= 700)) dispositivo = 'Tablet';
  else if (/mobi|iphone|android/i.test(ua) || (tactil && ancho && ancho < 700)) dispositivo = 'Celular';
  return { so, navegador, dispositivo };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  const ua = String(req.headers['user-agent'] || '');

  if (!b || !EVENTOS.has(b.evento) || typeof b.id_visita !== 'string' || !/^[a-zA-Z0-9-]{8,64}$/.test(b.id_visita)) {
    return res.status(400).json({ error: 'Evento inválido' });
  }
  if (BOT.test(ua)) return res.status(204).end(); // no contamos robots

  const juego = JUEGOS.has(b.juego) ? b.juego : null;
  const ancho = entero(b.ancho, 0, 10000);
  const { so, navegador, dispositivo } = leerAgente(ua, !!b.tactil, ancho);
  // Vercel agrega estas cabeceras con la ubicación aproximada (país y provincia). La IP no se guarda.
  const pais = corto(req.headers['x-vercel-ip-country'], 2);
  const region = corto(req.headers['x-vercel-ip-country-region'], 8);

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO navegacion (id_visita, evento, juego, ms_desde_carga, dispositivo, so, navegador,
                              ancho, alto, idioma, referente, pais, region)
      VALUES (${b.id_visita}, ${b.evento}, ${juego}, ${entero(b.ms, 0, 86400000)}, ${dispositivo}, ${so}, ${navegador},
              ${ancho}, ${entero(b.alto, 0, 10000)}, ${corto(b.idioma, 16)}, ${corto(b.referente, 100)}, ${pais}, ${region})
    `;
    return res.status(204).end();
  } catch (e) {
    console.error('Error guardando navegación:', e);
    return res.status(500).json({ error: 'Error interno' });
  }
}
