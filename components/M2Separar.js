// Minijuego 2: Separar palabras (jugar_m2_separar de FonixV1.5eco.py)
import { useRef, useState } from 'react';
import { DATOS_M2, ENSAYOS } from '../lib/datos';
import { ahora, r3 } from '../lib/util';
import { Exito, useRondas } from './comun';

export default function M2Separar({ onFin }) {
  const { ronda, exito, pausa, terminarRonda } = useRondas(onFin, ENSAYOS.m2);
  return (
    <>
      <RondaM2 key={ronda} ronda={ronda} bloqueado={pausa} onTerminar={terminarRonda} />
      {exito && <Exito />}
    </>
  );
}

function RondaM2({ ronda, bloqueado, onTerminar }) {
  const { text, spaces } = DATOS_M2[ronda];
  const [marcados, setMarcados] = useState([]);
  const [sac, setSac] = useState(0);
  const m = useRef({ inicio: ahora(), primer: null, aciertos: 0, fallos: 0, tiempos: [] });

  const registrarPrimer = (dt) => { if (m.current.primer === null) m.current.primer = dt; };

  const tocarHueco = (g, e) => {
    e.stopPropagation();
    if (bloqueado) return;
    const s = m.current;
    const dt = ahora() - s.inicio;
    registrarPrimer(dt);
    if (spaces.includes(g)) {
      if (marcados.includes(g)) return; // ya marcado: no suma ni resta (igual que el Python)
      s.aciertos += 1;
      s.tiempos.push(r3(dt));
      const nuevos = [...marcados, g];
      setMarcados(nuevos);
      if (nuevos.length === spaces.length) {
        onTerminar({
          aciertos: s.aciertos,
          fallos: s.fallos,
          t_primer: r3(s.primer),
          tiempos_correctos: s.tiempos,
          dt_total: r3(ahora() - s.inicio),
        });
      }
    } else {
      s.fallos += 1;
      setSac(Date.now());
    }
  };

  // Tocar sobre una letra (fuera de los huecos) cuenta como error, como en el Python
  const tocarLetra = () => {
    if (bloqueado) return;
    const s = m.current;
    registrarPrimer(ahora() - s.inicio);
    s.fallos += 1;
    setSac(Date.now());
  };

  const cw = `min(58px, calc((100vw - 90px) / ${text.length}))`;

  return (
    <div className="aparecer">
      <div className="ronda-label">Ronda {ronda + 1} de {ENSAYOS.m2}</div>
      <p className="consigna">Tocá los espacios donde termina cada palabra</p>
      <div key={sac} className={`m2-frase tiza ${sac ? 'sacudir' : ''}`} style={{ '--cw': cw }}>
        {text.split('').map((letra, i) => (
          <div key={i} className="m2-letra" onClick={tocarLetra} data-i={i}>
            {letra}
            {i < text.length - 1 && (
              <button
                type="button"
                aria-label={`espacio después de la letra ${i + 1}`}
                className={`m2-hueco ${marcados.includes(i) ? 'marcado' : ''}`}
                data-hueco={i}
                onClick={(e) => tocarHueco(i, e)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
