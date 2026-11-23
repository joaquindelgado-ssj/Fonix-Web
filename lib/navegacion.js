// Registro de navegación propio de FONIX (alternativa a Google Analytics).
// - Sin cookies: la "visita" es un id aleatorio que vive solo mientras la pestaña está abierta (sessionStorage).
// - No se guarda la IP ni el nombre del chico: solo eventos de navegación, dispositivo y región aproximada.
// - Si falla (sin conexión), se pierde el evento y el juego sigue normalmente.
import { nuevoId } from './util';

const CLAVE = 'fonix_visita';
let visita = null;

function idVisita() {
  if (visita) return visita;
  try { visita = sessionStorage.getItem(CLAVE); } catch { /* modo privado */ }
  if (!visita) {
    visita = nuevoId();
    try { sessionStorage.setItem(CLAVE, visita); } catch { /* nada */ }
  }
  return visita;
}

function referente() {
  try {
    if (!document.referrer) return null;
    const h = new URL(document.referrer).hostname;
    return h === window.location.hostname ? null : h;
  } catch { return null; }
}

// evento: 'visita' | 'inicio_prueba' | 'juego_inicio' | 'juego_fin' | 'fin_prueba'
//         | 'cancelacion' | 'abandono' | 'nueva_prueba' | 'sobre_nosotros'
export function registrar(evento, { juego = null } = {}) {
  if (typeof window === 'undefined') return;
  const cuerpo = JSON.stringify({
    id_visita: idVisita(),
    evento,
    juego,
    ms: Math.round(performance.now()),
    ancho: window.innerWidth,
    alto: window.innerHeight,
    tactil: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    idioma: navigator.language || null,
    referente: referente(),
  });
  // sendBeacon sobrevive al cierre de la pestaña (necesario para registrar los abandonos)
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/navegacion', new Blob([cuerpo], { type: 'application/json' }))) return;
  } catch { /* sigue con fetch */ }
  fetch('/api/navegacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true })
    .catch(() => {});
}
