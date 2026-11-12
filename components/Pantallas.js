import { useEffect, useRef, useState } from 'react';
import { PROVINCIAS } from '../lib/datos';
import { pendientes, vaciarCola } from '../lib/envio';

const CLAVE_STAND = 'fonix_stand'; // recuerda provincia/colegio entre participantes

export function Registro({ onListo }) {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('CABA');
  const [colegio, setColegio] = useState('');
  const [escuelaCue, setEscuelaCue] = useState(null);
  const [enCola, setEnCola] = useState(0);

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_STAND) || '{}');
      if (g.provincia) setProvincia(g.provincia);
      if (g.colegio) setColegio(g.colegio);
      if (g.escuelaCue) setEscuelaCue(g.escuelaCue);
    } catch { /* nada */ }
    setEnCola(pendientes());
    vaciarCola().then(setEnCola);
  }, []);

  const enviar = (e) => {
    e.preventDefault();
    try { localStorage.setItem(CLAVE_STAND, JSON.stringify({ provincia, colegio, escuelaCue })); } catch { /* nada */ }
    onListo({ nombre: nombre.trim(), edad: parseInt(edad, 10), provincia, colegio: colegio.trim(), escuela_cue: escuelaCue });
  };

  return (
    <div className="aparecer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1 className="titulo" style={{ fontSize: 'clamp(46px, 8vw, 96px)', letterSpacing: '.1em' }}>
        F<span style={{ color: 'var(--amarillo)' }}>O</span>NIX
      </h1>
      <p className="consigna" style={{ marginBottom: 'clamp(12px, 2.5vw, 28px)' }}>¡Hola! Antes de jugar, contanos quién sos</p>
      <form className="form" onSubmit={enviar}>
        <label>
          Tu nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value.slice(0, 30))}
            required
            autoComplete="off"
            name="nombre"
          />
        </label>
        <div className="fila">
          <label>
            Edad
            <input
              type="number" inputMode="numeric" min="4" max="99"
              value={edad}
              onChange={(e) => setEdad(e.target.value.replace(/\D/g, '').slice(0, 2))}
              required
              name="edad"
            />
          </label>
          <label>
            Provincia
            <select value={provincia} onChange={(e) => { setProvincia(e.target.value); setColegio(''); setEscuelaCue(null); }} name="provincia">
              {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <BuscadorEscuela
          provincia={provincia}
          colegio={colegio}
          cue={escuelaCue}
          onElegir={(nombreEsc, cue) => { setColegio(nombreEsc); setEscuelaCue(cue); }}
        />
        <button type="submit" className="btn primario grande">¡A jugar!</button>
      </form>
      {enCola > 0 && (
        <div className="estado-envio">{enCola} prueba(s) esperando conexión para guardarse</div>
      )}
    </div>
  );
}

// Autocompletado contra el padrón oficial de escuelas (tabla `escuelas` en Neon).
function BuscadorEscuela({ provincia, colegio, cue, onElegir }) {
  const [texto, setTexto] = useState(colegio);
  const [opciones, setOpciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [manual, setManual] = useState(false);
  const pedido = useRef(0);

  useEffect(() => { setTexto(colegio); }, [colegio]);

  useEffect(() => {
    if (cue || manual || texto.trim().length < 3) { setOpciones([]); return undefined; }
    const id = ++pedido.current;
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/escuelas?provincia=${encodeURIComponent(provincia)}&q=${encodeURIComponent(texto)}`);
        const j = await r.json();
        if (id === pedido.current) { setOpciones(j.escuelas || []); setAbierto(true); }
      } catch { /* sin conexión: queda como texto libre */ }
    }, 250);
    return () => clearTimeout(t);
  }, [texto, provincia, cue, manual]);

  if (cue) {
    return (
      <label>
        Escuela
        <div className="esc-elegida">
          <span>{colegio}</span>
          <button type="button" className="esc-cambiar" onClick={() => { onElegir('', null); setTexto(''); }}>cambiar</button>
        </div>
      </label>
    );
  }

  return (
    <label style={{ position: 'relative' }}>
      Escuela <small style={{ opacity: 0.6 }}>(opcional: escribí parte del nombre o el número)</small>
      <input
        value={texto}
        onChange={(e) => { const v = e.target.value.slice(0, 80); setTexto(v); onElegir(v, null); }}
        onFocus={() => opciones.length && setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 200)}
        autoComplete="off"
        name="colegio"
      />
      {abierto && !manual && texto.trim().length >= 3 && (
        <div className="esc-lista" role="listbox">
          {opciones.map((o) => (
            <button type="button" key={o.cue} className="esc-op" onMouseDown={(e) => e.preventDefault()} onClick={() => { onElegir(o.nombre, o.cue); setAbierto(false); }}>
              <b>{o.nombre}</b>
              <small>{[o.localidad, o.domicilio].filter(Boolean).join(' · ')}</small>
            </button>
          ))}
          <button type="button" className="esc-op esc-manual" onMouseDown={(e) => e.preventDefault()} onClick={() => { setManual(true); onElegir(texto.trim(), null); setAbierto(false); }}>
            {opciones.length ? 'Mi escuela no está en la lista' : 'No encontramos esa escuela: usar lo que escribí'}
          </button>
        </div>
      )}
    </label>
  );
}

export function Final({ nombre, estado, onNueva }) {
  const nombrePila = nombre.split(' ')[0];
  return (
    <div className="final aparecer">
      <div className="estrellas">★ ★ ★</div>
      <h1 className="titulo">¡Muchas gracias, {nombrePila}!</h1>
      <p className="sub">¡Lo hiciste genial!</p>
      <p className="consigna" style={{ marginTop: 10 }}>Terminaste los 6 juegos de FONIX</p>
      <button className="btn grande" onClick={onNueva} style={{ marginTop: 16 }}>Nuevo jugador</button>
      <div className="estado-envio">
        {estado === 'enviando' && 'Guardando respuestas…'}
        {estado === 'ok' && '✓ Respuestas guardadas'}
        {estado === 'pendiente' && 'Sin conexión: las respuestas se guardarán apenas vuelva internet'}
      </div>
    </div>
  );
}
