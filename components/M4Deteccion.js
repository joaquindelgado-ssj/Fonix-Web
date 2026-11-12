// Minijuego 4: Detección de cambios (jugar_m4_shift de FonixV1.5eco.py)
// v2: 6 rondas = 4 con cambio + 2 "trampa" sin cambio (permite calcular d′),
// palabras de 6–8 letras y transposición solo de letras interiores.
// La palabra se ve 3 s y se tapa 1 s. En las rondas con cambio, en la 1.ª o 2.ª
// tapada se intercambian dos letras; hay que avisar cuando reaparece cambiada.
// En las rondas trampa la palabra nunca cambia: lo correcto es NO avisar.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ENSAYOS, M4_FASES_SIN_CAMBIO, M4_OCULTO_MS, M4_TIMEOUT_MS, M4_VISIBLE_MS, palabraAlterada, planM4, randInt,
} from '../lib/datos';
import { ahora, r3, useTecla } from '../lib/util';
import { Exito, useRondas } from './comun';

export default function M4Deteccion({ onFin }) {
  const plan = useMemo(() => planM4(), []);
  const { ronda, exito, pausa, terminarRonda } = useRondas(onFin, ENSAYOS.m4);
  return (
    <>
      <RondaM4 key={ronda} ronda={ronda} {...plan[ronda]} bloqueado={pausa} onTerminar={terminarRonda} />
      {exito && <Exito />}
    </>
  );
}

function RondaM4({ ronda, palabra, hayCambio, bloqueado, onTerminar }) {
  const [vista, setVista] = useState({ visible: true, texto: palabra });
  const [sac, setSac] = useState(0);
  const st = useRef(null);

  if (st.current === null) {
    const t0 = ahora();
    st.current = {
      inicio: t0,
      primer: null,
      alterada: hayCambio ? palabraAlterada(palabra) : palabra,
      objetivoOculto: randInt(1, 2),
      contOculto: 0,
      contVisible: 1,
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
    onTerminar({ hay_cambio: hayCambio, ...res }, conTilde ? {} : { tilde: false, demora: 650 });
  };

  useEffect(() => {
    const id = setInterval(() => {
      const s = st.current;
      if (s.terminado) return;
      const t = ahora();
      if (t >= s.proximo) {
        if (s.visible) {
          // Ronda trampa: tras la 3.ª aparición termina sola (rechazo correcto)
          if (!hayCambio && s.contVisible >= M4_FASES_SIN_CAMBIO) {
            fin({ respondio: false, exito: true, t_primer: null, t_reaccion: null, dt_total: r3(t - s.inicio) }, true);
            return;
          }
          s.visible = false;
          s.proximo = t + M4_OCULTO_MS / 1000;
          s.contOculto += 1;
          if (hayCambio && s.contOculto === s.objetivoOculto && !s.cambio) s.cambio = true;
        } else {
          s.visible = true;
          s.contVisible += 1;
          s.proximo = t + M4_VISIBLE_MS / 1000;
          if (s.cambio && s.tReaccion === null) s.tReaccion = t;
        }
        setVista({ visible: s.visible, texto: s.cambio ? s.alterada : palabra });
      }
      if (s.tReaccion !== null && t - s.tReaccion > M4_TIMEOUT_MS / 1000) {
        fin({ respondio: false, exito: false, t_primer: r3(s.primer), t_reaccion: null, dt_total: r3(t - s.inicio) }, false);
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
      fin({ respondio: true, exito: true, t_primer: r3(s.primer), t_reaccion: r3(t - s.tReaccion), dt_total: r3(t - s.inicio) }, true);
    } else {
      // Aviso antes de tiempo, o falsa alarma en una ronda trampa
      setSac(Date.now());
      fin({ respondio: true, exito: false, t_primer: r3(s.primer), t_reaccion: null, dt_total: r3(t - s.inicio) }, false);
    }
  };

  useTecla(' ', responder, !bloqueado);

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {ENSAYOS.m4}</div>
      <p className="consigna">Si la palabra cambió cuando se va el cuadro negro, ¡avisá rápido! Si no cambia, no toques nada.</p>
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
