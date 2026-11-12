import { useCallback, useRef, useState } from 'react';
import { esperar, useTecla } from '../lib/util';

const NOMBRES = ['Unir', 'Separar', 'Símbolos', 'Cambios', 'Colores', 'Números'];

export function Pizarron({ juegoActual = -1, onSalir, children }) {
  const pantallaCompleta = () => {
    const d = document;
    if (!d.fullscreenElement) d.documentElement.requestFullscreen?.().catch(() => {});
    else d.exitFullscreen?.();
  };
  return (
    <div className="marco">
      <div className="pizarra">
        <header className="encabezado">
          <div className="logo tiza">F<span>O</span>NIX</div>
          {juegoActual >= 0 && (
            <div className="progreso" aria-label="Progreso">
              {NOMBRES.map((n, i) => (
                <div
                  key={n}
                  title={n}
                  className={`punto ${i < juegoActual ? 'hecho' : ''} ${i === juegoActual ? 'actual' : ''}`}
                >
                  {i < juegoActual ? '✓' : i + 1}
                </div>
              ))}
            </div>
          )}
          <div className="acciones-top">
            {onSalir && (
              <button className="btn-icono" title="Cancelar prueba" onClick={onSalir}>✕</button>
            )}
            <button className="btn-icono" title="Pantalla completa" onClick={pantallaCompleta}>⛶</button>
          </div>
        </header>
        <main className="escena">{children}</main>
        <div className="repisa" aria-hidden="true">
          <div className="tizita" style={{ left: '14%', width: 46, background: '#f5f3ea' }} />
          <div className="tizita" style={{ left: '20%', width: 34, background: '#f7e27c' }} />
          <div className="tizita" style={{ left: '24.5%', width: 28, background: '#f7a8bd' }} />
          <div className="borrador" />
        </div>
      </div>
    </div>
  );
}

export function Exito() {
  return (
    <div className="exito-capa" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="48" />
        <path d="M38 62 L54 77 L84 44" />
      </svg>
    </div>
  );
}

// Controla las 4 rondas de un minijuego: guarda cada resultado, muestra el
// tilde (si corresponde) y avanza. Al terminar llama a onFin(resultados).
export function useRondas(onFin, total = 4) {
  const [ronda, setRonda] = useState(0);
  const [exito, setExito] = useState(false);
  const [pausa, setPausa] = useState(false);
  const resultados = useRef([]);
  const cerrando = useRef(false);

  const terminarRonda = useCallback(async (res, { tilde = true, demora = 300 } = {}) => {
    if (cerrando.current) return;
    cerrando.current = true;
    resultados.current.push(res);
    setPausa(true);
    if (tilde) { setExito(true); await esperar(520); setExito(false); } else { await esperar(demora); }
    if (resultados.current.length >= total) {
      onFin(resultados.current);
    } else {
      setRonda((r) => r + 1);
      setPausa(false);
      cerrando.current = false;
    }
  }, [onFin, total]);

  return { ronda, exito, pausa, terminarRonda };
}

export function Instrucciones({ numero, titulo, lineas, demo, onComenzar }) {
  useTecla(' ', onComenzar);
  return (
    <div className="instr aparecer">
      <div className="texto">
        <h1 className="titulo"><span className="numero">{numero}.</span> {titulo}</h1>
        {lineas.map((l) => <p key={l} className="tiza">{l}</p>)}
      </div>
      <div className="demo">
        <div className="etq">Ejemplo</div>
        {demo}
      </div>
      <div className="instr-pie">
        <button className="btn primario grande" onClick={onComenzar}>¡Empezar!</button>
        <div className="ayuda-tecla">o presioná la barra ESPACIO</div>
      </div>
    </div>
  );
}
