// Minijuego 5: Números y cantidades — Stroop numérico (efecto de congruencia de tamaño)
// v2: 20 ensayos en 4 rondas de 5: congruente, incongruente (mismas parejas),
// neutro (mismo tamaño), puntos vs número y empate. Henik & Tzelgov (1982);
// Rubinsten & Henik (2005); Ashkenazi, Rubinsten & Henik (2009).
import { useCallback, useMemo, useRef, useState } from 'react';
import { ENSAYOS, planM5 } from '../lib/datos';
import { ahora, esperar, r3, useTecla } from '../lib/util';
import { Exito, useRondas } from './comun';

const POR_RONDA = 5;

export default function M5Discalculia({ onFin }) {
  const plan = useMemo(() => planM5(), []);
  const fin = useCallback((rondas) => onFin(rondas.flat()), [onFin]);
  const { ronda, exito, pausa, terminarRonda } = useRondas(fin, ENSAYOS.m5 / POR_RONDA);
  return (
    <>
      {!pausa && <RondaM5 key={ronda} ronda={ronda} ensayos={plan[ronda]} onTerminar={terminarRonda} />}
      {exito && <Exito />}
    </>
  );
}

function RondaM5({ ronda, ensayos, onTerminar }) {
  const [i, setI] = useState(0);
  const [blanco, setBlanco] = useState(false);
  const m = useRef({ inicio: ahora(), listo: false, res: [] });
  const est = ensayos[i];

  const responder = async (eleccion) => {
    const s = m.current;
    if (s.listo || blanco) return;
    s.listo = true;
    const { izq, der, caso, distancia } = est;
    let exito;
    if (eleccion === 'iguales') exito = izq.valor === der.valor;
    else if (izq.valor === der.valor) exito = false;
    else exito = eleccion === (izq.valor > der.valor ? 'izq' : 'der');
    s.res.push({ caso, distancia, exito, t_reaccion: r3(ahora() - s.inicio) });

    if (i < ensayos.length - 1) {
      setBlanco(true);
      await esperar(300); // pantalla en blanco entre ensayos, como en el Python
      setI(i + 1);
      setBlanco(false);
      s.inicio = ahora();
      s.listo = false;
    } else {
      onTerminar(s.res);
    }
  };

  useTecla(' ', () => responder('iguales'));

  const lado = 'min(330px, calc((100vw - 140px) / 2), calc(100vh - 380px))';

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {ENSAYOS.m5 / POR_RONDA}</div>
      <p className="consigna">Tocá el cuadro que vale MÁS. Si valen lo mismo, tocá “Son iguales”.</p>
      <div className="m5" style={{ '--lado': lado, visibility: blanco ? 'hidden' : 'visible' }}>
        <Caja d={est.izq} onClick={() => responder('izq')} lado="izq" />
        <Caja d={est.der} onClick={() => responder('der')} lado="der" />
      </div>
      <button type="button" className="btn m5-iguales" onClick={() => responder('iguales')}>= Son iguales</button>
      <div className="ayuda-tecla">o presioná la barra ESPACIO si son iguales</div>
    </div>
  );
}

function Caja({ d, onClick, lado }) {
  return (
    <button type="button" className={`m5-caja ${d.formato}`} onClick={onClick} data-lado={lado}>
      {d.formato === 'puntos'
        ? d.puntos.map((p, k) => <span key={k} className="m5-punto" style={{ left: `${p.x}%`, top: `${p.y}%` }} />)
        : d.valor}
    </button>
  );
}
