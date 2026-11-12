// Minijuego 3: Explorador de símbolos (jugar_m3_simbolos de FonixV1.5eco.py)
// v2: 4 pares espejados (b/d, p/q, d/b, q/p). En cada tamaño de grilla una ronda
// tiene las letras juntas (crowding, Zorzi et al. 2012) y otra separadas.
import { useMemo, useRef, useState } from 'react';
import { ENSAYOS, planM3 } from '../lib/datos';
import { ahora, r3 } from '../lib/util';
import { Exito, useRondas } from './comun';

export default function M3Simbolos({ onFin }) {
  const plan = useMemo(() => planM3(), []);
  const { ronda, exito, pausa, terminarRonda } = useRondas(onFin, ENSAYOS.m3);
  return (
    <>
      <RondaM3 key={ronda} ronda={ronda} r={plan[ronda]} bloqueado={pausa} onTerminar={terminarRonda} />
      {exito && <Exito />}
    </>
  );
}

function RondaM3({ ronda, r, bloqueado, onTerminar }) {
  const { base, distinta, size, objetivo, espaciado } = r;
  const [sac, setSac] = useState(null); // { i, n }
  const m = useRef({ inicio: ahora(), primer: null, fallos: 0 });

  const tocar = (i) => {
    if (bloqueado) return;
    const s = m.current;
    if (s.primer === null) s.primer = ahora() - s.inicio;
    if (i === objetivo) {
      onTerminar({ fallos: s.fallos, t_primer: r3(s.primer), dt_total: r3(ahora() - s.inicio), espaciado });
    } else {
      s.fallos += 1;
      setSac({ i, n: Date.now() });
    }
  };

  const juntas = espaciado === 'juntas';
  const cel = `min(${size === 4 ? 92 : 78}px, calc((100vh - 330px) / ${size}), calc((100vw - 120px) / ${size}))`;

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {ENSAYOS.m3}</div>
      <p className="consigna">Una letra está espejada. ¡Encontrala!</p>
      <div
        className={`m3-grilla ${juntas ? 'juntas' : ''}`}
        data-espaciado={espaciado}
        style={{ gridTemplateColumns: `repeat(${size}, auto)`, '--cel': cel }}
      >
        {Array.from({ length: size * size }, (_, i) => {
          const s = sac && sac.i === i;
          return (
            <button
              type="button"
              key={s ? `${i}-${sac.n}` : i}
              className={`m3-celda ${s ? 'sacudir' : ''}`}
              onClick={() => tocar(i)}
            >
              {i === objetivo ? distinta : base}
            </button>
          );
        })}
      </div>
    </div>
  );
}
