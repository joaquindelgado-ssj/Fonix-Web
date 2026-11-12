// Minijuego Stroop (color-palabra). Mide automatización lectora y control inhibitorio.
// Protopapas, Archonti & Skaloumbakas (2007): peores lectores muestran MÁS interferencia.
// 32 estímulos en 4 rondas de 8: 12 neutros (XXXX), 8 congruentes, 12 incongruentes.
// Se responde tocando botones de color SIN texto, para no leer en la respuesta.
import { useCallback, useMemo, useRef, useState } from 'react';
import { COLORES_STROOP, ENSAYOS, planStroop } from '../lib/datos';
import { ahora, esperar, r3 } from '../lib/util';
import { Exito, useRondas } from './comun';

const POR_RONDA = 8;
const HEX = Object.fromEntries(COLORES_STROOP.map((c) => [c.id, c.hex]));

export default function M6Stroop({ onFin }) {
  const plan = useMemo(() => planStroop(), []);
  const fin = useCallback((rondas) => onFin(rondas.flat()), [onFin]);
  const { ronda, exito, pausa, terminarRonda } = useRondas(fin, ENSAYOS.m6 / POR_RONDA);
  return (
    <>
      {!pausa && <RondaStroop key={ronda} ronda={ronda} ensayos={plan[ronda]} onTerminar={terminarRonda} />}
      {exito && <Exito />}
    </>
  );
}

function RondaStroop({ ronda, ensayos, onTerminar }) {
  const [i, setI] = useState(0);
  const [blanco, setBlanco] = useState(false);
  const m = useRef({ inicio: ahora(), listo: false, res: [] });
  const est = ensayos[i];

  const responder = async (color) => {
    const s = m.current;
    if (s.listo || blanco) return;
    s.listo = true;
    s.res.push({ cond: est.cond, tinta: est.tinta, respuesta: color, correcto: color === est.tinta, rt: r3(ahora() - s.inicio) });
    if (i < ensayos.length - 1) {
      setBlanco(true);
      await esperar(350); // cruz de fijación entre estímulos
      setI(i + 1);
      setBlanco(false);
      s.inicio = ahora();
      s.listo = false;
    } else {
      onTerminar(s.res);
    }
  };

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {ENSAYOS.m6 / POR_RONDA}</div>
      <p className="consigna">Tocá el COLOR de la tinta, no lo que dice la palabra</p>
      <div className="st-tarjeta">
        {blanco
          ? <span className="st-cruz">+</span>
          : <span className="st-palabra" data-testid="st-palabra" data-tinta={est.tinta} style={{ color: HEX[est.tinta] }}>{est.texto}</span>}
      </div>
      <div className="st-botones">
        {COLORES_STROOP.map((c) => (
          <button
            key={c.id}
            type="button"
            className="st-boton"
            aria-label={c.id}
            data-color={c.id}
            style={{ background: c.hex }}
            onClick={() => responder(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
