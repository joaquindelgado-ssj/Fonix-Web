// Minijuego 5: Cribado de discalculia (jugar_m5_discalculia de FonixVersionPruebaFeriaV4.py)
// Casos: congruente, puntos vs número, incongruente (trampa) y empate.
import { useMemo, useRef } from 'react';
import { RONDAS, generarRondasM5 } from '../lib/datos';
import { ahora, r3, useTecla } from '../lib/util';
import { Exito, useRondas } from './comun';

export default function M5Discalculia({ onFin }) {
  const estimulos = useMemo(() => generarRondasM5(), []);
  const { ronda, exito, pausa, terminarRonda } = useRondas(onFin);
  return (
    <>
      {!pausa && <RondaM5 key={ronda} ronda={ronda} est={estimulos[ronda]} onTerminar={terminarRonda} />}
      {exito && <Exito />}
    </>
  );
}

function RondaM5({ ronda, est, onTerminar }) {
  const m = useRef({ inicio: ahora(), listo: false });
  const { izq, der, caso } = est;

  const responder = (eleccion) => {
    const s = m.current;
    if (s.listo) return;
    s.listo = true;
    let exito;
    if (eleccion === 'iguales') exito = izq.valor === der.valor;
    else if (izq.valor === der.valor) exito = false;
    else exito = eleccion === (izq.valor > der.valor ? 'izq' : 'der');
    // Como en el Python: sin tilde entre rondas (pantalla en blanco 0,3 s), tilde al final
    onTerminar(
      { caso, exito, t_reaccion: r3(ahora() - s.inicio) },
      ronda === RONDAS - 1 ? {} : { tilde: false, demora: 300 },
    );
  };

  useTecla(' ', () => responder('iguales'));

  const lado = 'min(330px, calc((100vw - 140px) / 2), calc(100vh - 360px))';

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="ronda-label">Ronda {ronda + 1} de {RONDAS}</div>
      <p className="consigna">Tocá el cuadro que vale MÁS. Si valen lo mismo, tocá “Son iguales”.</p>
      <div className="m5" style={{ '--lado': lado }}>
        <Caja d={izq} onClick={() => responder('izq')} lado="izq" />
        <Caja d={der} onClick={() => responder('der')} lado="der" />
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
        ? d.puntos.map((p, i) => <span key={i} className="m5-punto" style={{ left: `${p.x}%`, top: `${p.y}%` }} />)
        : d.valor}
    </button>
  );
}
