// Ejemplos animados (en loop) que acompañan las instrucciones de cada minijuego.
import { FUENTES_COMPLICADAS, FUENTE_AMIGABLE } from '../lib/datos';

const f = (x) => ({ fontFamily: x.family, fontWeight: x.weight });

export function DemoM1() {
  return (
    <div className="d1">
      <div className="d1-caja" style={f(FUENTES_COMPLICADAS[0])}>hoja</div>
      <svg className="d1-linea" viewBox="0 0 100 10" preserveAspectRatio="none"><line x1="0" y1="5" x2="100" y2="5" /></svg>
      <div className="d1-caja b" style={f(FUENTE_AMIGABLE)}>hoja</div>
      <div className="d1-dedo">👆</div>
    </div>
  );
}

export function DemoM2() {
  return (
    <div className="d2">
      {'usabici'.split('').map((l, i) => (
        <span key={i} className={i === 2 ? 'd2-l corte' : 'd2-l'}>{l}</span>
      ))}
    </div>
  );
}

export function DemoM3() {
  return (
    <div className="d3">
      {['d', 'd', 'b', 'd', 'd', 'd', 'd', 'd', 'd'].map((l, i) => (
        <div key={i} className={i === 2 ? 'd3-c intruso' : 'd3-c'}>{l}</div>
      ))}
    </div>
  );
}

export function DemoM4() {
  return (
    <div className="d4">
      <div className="d4-papel">
        <span className="d4-a">BIOMASA</span>
        <span className="d4-b">BIOAMSA</span>
        <span className="d4-tapa" />
      </div>
      <div className="d4-btn">¡Cambió!</div>
    </div>
  );
}

export function DemoM5() {
  return (
    <div className="d5">
      <div className="d5-fila">
        <div className="d5-caja chico">3</div>
        <div className="d5-caja grande elegida">7</div>
      </div>
      <div className="d5-fila">
        <div className="d5-caja puntos">
          {[[25, 30], [65, 22], [45, 55], [22, 75], [72, 70]].map(([x, y], i) => (
            <i key={i} style={{ left: `${x}%`, top: `${y}%` }} />
          ))}
        </div>
        <div className="d5-caja medio">5</div>
      </div>
      <div className="d5-iguales">= Son iguales</div>
    </div>
  );
}

export function DemoM6() {
  return (
    <div className="d6">
      <div className="d6-t">ROJO</div>
      <div className="d6-b">
        <i style={{ background: '#d62828' }} />
        <i className="ok" style={{ background: '#1d4ed8' }} />
        <i style={{ background: '#111' }} />
        <i style={{ background: '#d9a400' }} />
      </div>
      <div style={{ fontSize: 18, color: 'var(--celeste)' }}>Dice ROJO, pero está pintada de AZUL → tocás azul</div>
    </div>
  );
}
