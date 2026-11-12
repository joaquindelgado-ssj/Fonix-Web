// Minijuego 4: Detección de cambios (jugar_m4_shift de FonixV1.5eco.py)
// La palabra se muestra 3 s, se tapa 1 s, y en la 1.ª o 2.ª tapada se
// intercambian dos letras contiguas. Hay que avisar cuando reaparece cambiada.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  M4_OCULTO_MS, M4_TIMEOUT_MS, M4_VISIBLE_MS, POOL_M4, RONDAS, mezclar, palabraAlterada, randInt,
} from '../lib/datos';
import { ahora, r3, useTecla } from '../lib/util';
import { Exito, useRondas } from './comun';

export default function M4Deteccion({ onFin }) {
  const palabras = useMemo(() => mezclar(POOL_M4).slice(0, RONDAS), []);
  const { ronda, exito, pausa, terminarRonda } = useRondas(onFin);
  return (
    <>
      <RondaM4 key={ronda} ronda={ronda} palabra={palabras[ronda]} bloqueado={pausa} onTerminar={terminarRonda} />
      {exito && <Exito />}
    </>
  );
}

function RondaM4({ ronda, palabra, bloqueado, onTerminar }) {
  const [vista, setVista] = useState({ visible: true, texto: palabra });
  const [sac, setSac] = useState(0);
  const st = useRef(null);

  if (st.current === null) {
    const t0 = ahora();
    st.current = {
      inicio: t0,
      primer: null,
      alterada: palabraAlterada(palabra),
      objetivoOculto: randInt(1, 2),
      contOculto: 0,
      cambio: false,
      visible: true,
      proximo: t0 + M4_VISIBLE_MS / 1000,
      tReaccion: null,
      terminado: false,
    };
  }

  const fin = (res, conTilde) => {
    const s = st.current;
    if (s.terminado) return;
    s.terminado = true;
    onTerminar(res, conTilde ? {} : { tilde: false, demora: 650 });
  };

  // Reloj del parpadeo (misma máquina de estados que el while del Python)
  useEffect(() => {
    const id = setInterval(() => {
      const s = st.current;
      if (s.terminado) return;
      const t = ahora();
      if (t >= s.proximo) {
        if (s.visible) {
          s.visible = false;
          s.proximo = t + M4_OCULTO_MS / 1000;
          s.contOculto += 1;
          if (s.contOculto === s.objetivoOculto && !s.cambio) s.cambio = true;
        } else {
          s.visible = true;
          s.proximo = t + M4_VISIBLE_MS / 1000;
          if (s.cambio && s.tReaccion === null) s.tReaccion = t;
        }
        setVista({ visible: s.visible, texto: s.cambio ? s.alterada : palabra });
      }
      if (s.tReaccion !== null && t - s.tReaccion > M4_TIMEOUT_MS / 1000) {
        fin({ exito: false, t_primer: r3(s.primer), t_reaccion: null, dt_total: r3(t - s.inicio) }, false);
      }
    }, 16);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const responder = () => {
    const s = st.current;
    if (bloqueado || s.terminado) return;
    const t = ahora();
    if (s.primer === null) s.primer = t - s.inicio;
    if (s.cambio && s.tReaccion !== null && t >= s.tReaccion) {
      fin({ exito: true, t_primer: r3(s.primer), t_reaccion: r3(t - s.tReaccion), dt_total: r3(t - s.inicio) }, true);
    } else {
      setSac(Date.now());
      fin({ exito: false, t_primer: r3(s.primer), t_reaccion: null, dt_total: r3(t - s.inicio) }, false);
    }
  };

  useTecla(' ', responder, !bloqueado);

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {RONDAS}</div>
      <p className="consigna">Si la palabra cambió cuando se va el cuadro negro, ¡avisá rápido!</p>
      <div key={sac} className={`m4-papel ${sac ? 'sacudir' : ''}`}>
        {vista.visible
          ? <span className="m4-palabra" data-testid="m4-palabra">{vista.texto}</span>
          : <div className="m4-tapa" />}
      </div>
      <button type="button" className="btn primario grande m4-boton" onClick={responder}>¡Cambió!</button>
      <div className="ayuda-tecla">o presioná la barra ESPACIO</div>
    </div>
  );
}
