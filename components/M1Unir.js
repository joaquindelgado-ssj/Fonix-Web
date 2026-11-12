// Minijuego 1: Unir columnas (jugar_m1_unir de FonixV1.5eco.py)
import { useMemo, useRef, useState } from 'react';
import { ENSAYOS, FUENTES_COMPLICADAS, FUENTE_AMIGABLE, mezclar, planM1 } from '../lib/datos';
import { ahora, r3 } from '../lib/util';
import { Exito, useRondas } from './comun';

export default function M1Unir({ onFin }) {
  // 2 rondas con tipografía amigable y 2 con tipografías complicadas, en orden
  // contrabalanceado ABBA / BAAB, con sets de palabras de igual dificultad.
  const plan = useMemo(() => planM1(), []);
  const { ronda, exito, pausa, terminarRonda } = useRondas(onFin, ENSAYOS.m1);
  return (
    <>
      <RondaM1
        key={ronda}
        ronda={ronda}
        palabras={plan[ronda].palabras}
        amigable={plan[ronda].amigable}
        bloqueado={pausa}
        onTerminar={terminarRonda}
      />
      {exito && <Exito />}
    </>
  );
}

function RondaM1({ ronda, palabras, amigable, bloqueado, onTerminar }) {
  const [izq] = useState(() => mezclar(palabras));
  const [der] = useState(() => mezclar(palabras));
  const [sel, setSel] = useState(null); // { lado: 'izq'|'der', i }
  const [completados, setCompletados] = useState({}); // idxIzq -> idxDer
  const [sacudir, setSacudir] = useState(null); // { lado, i, n }
  const m = useRef({ inicio: ahora(), primer: null, aciertos: 0, fallos: 0 });

  const derUsados = new Set(Object.values(completados));

  const tocar = (lado, i) => {
    if (bloqueado) return;
    if (lado === 'izq' && i in completados) return;
    if (lado === 'der' && derUsados.has(i)) return;
    const s = m.current;
    if (s.primer === null) s.primer = ahora() - s.inicio;

    if (!sel || sel.lado === lado) { setSel({ lado, i }); return; }

    const iIzq = lado === 'izq' ? i : sel.i;
    const iDer = lado === 'der' ? i : sel.i;
    setSel(null);
    if (izq[iIzq] === der[iDer]) {
      s.aciertos += 1;
      const nuevos = { ...completados, [iIzq]: iDer };
      setCompletados(nuevos);
      if (Object.keys(nuevos).length === palabras.length) {
        onTerminar({
          aciertos: s.aciertos,
          fallos: s.fallos,
          t_primer: r3(s.primer),
          dt_total: r3(ahora() - s.inicio),
          amigable,
        });
      }
    } else {
      s.fallos += 1;
      setSacudir({ lado, i, n: Date.now() });
    }
  };

  const fuente = (lado, i) => {
    const x = amigable ? FUENTE_AMIGABLE : FUENTES_COMPLICADAS[lado === 'izq' ? i : 4 + i];
    return { fontFamily: x.family, fontWeight: x.weight, fontSize: `calc(clamp(24px, 3vw, 34px) * ${x.size})` };
  };

  const caja = (lado, palabra, i) => {
    const ok = lado === 'izq' ? i in completados : derUsados.has(i);
    const esSel = sel && sel.lado === lado && sel.i === i;
    const sac = sacudir && sacudir.lado === lado && sacudir.i === i;
    return (
      <div className="celda" key={i}>
        <button
          type="button"
          key={sac ? sacudir.n : 'x'}
          className={`caja ${esSel ? 'sel' : ''} ${ok ? 'ok' : ''} ${sac ? 'sacudir' : ''}`}
          style={fuente(lado, i)}
          onClick={() => tocar(lado, i)}
          data-palabra={palabra}
          data-lado={lado}
        >
          {palabra}
        </button>
      </div>
    );
  };

  return (
    <div className="aparecer" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {ENSAYOS.m1}</div>
      <p className="consigna">Uní cada palabra con su pareja igual</p>
      <div className="m1">
        <div className="col">{izq.map((p, i) => caja('izq', p, i))}</div>
        <div className="m1-medio">
          <svg viewBox="0 0 100 400" preserveAspectRatio="none" aria-hidden="true">
            {Object.entries(completados).map(([a, b]) => (
              <line key={a} x1="0" y1={(+a + 0.5) * 100} x2="100" y2={(b + 0.5) * 100} />
            ))}
          </svg>
        </div>
        <div className="col">{der.map((p, i) => caja('der', p, i))}</div>
      </div>
    </div>
  );
}
