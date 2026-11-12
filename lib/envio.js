// Envío de resultados con cola local: si en la feria se corta el Wi-Fi,
// la prueba queda guardada en el navegador y se reenvía sola al volver la conexión.
const CLAVE = 'fonix_pendientes';

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE) || '[]'); } catch { return []; }
}
function escribir(lista) {
  try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch { /* modo privado */ }
}

export function pendientes() { return leer().length; }

let enCurso = null;

// Intenta enviar todo lo pendiente. Devuelve cuántos quedaron sin enviar.
export function vaciarCola() {
  if (enCurso) return enCurso;
  enCurso = (async () => {
    let lista = leer();
    for (const payload of [...lista]) {
      try {
        const res = await fetch('/api/guardar-resultados', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        // 200 = guardado; 400 = datos inválidos (no tiene sentido reintentar)
        if (res.ok || res.status === 400) {
          lista = lista.filter((p) => p.id_sesion !== payload.id_sesion);
          escribir(lista);
        }
      } catch { /* sin conexión: queda en la cola */ }
    }
    return lista.length;
  })().finally(() => { enCurso = null; });
  return enCurso;
}

export async function enviarResultados(payload) {
  const lista = leer().filter((p) => p.id_sesion !== payload.id_sesion);
  lista.push(payload);
  escribir(lista);
  const sigue = () => leer().some((p) => p.id_sesion === payload.id_sesion);
  await vaciarCola();
  if (sigue()) await vaciarCola(); // por si había un envío anterior en curso
  return sigue() ? 'pendiente' : 'ok';
}
