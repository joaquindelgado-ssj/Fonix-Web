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
//
// Pensado para el dedo: la lista de resultados se dibuja DENTRO del formulario (en el flujo,
// no flotando), así que con el teclado abierto se puede scrollear hasta ella y nunca queda
// tapada ni recortada. Se elige con un toque en cualquier parte de la fila; no depende de
// que el campo pierda el foco (antes un temporizador de blur podía cerrar la lista justo
// antes de registrar el toque).
function BuscadorEscuela({ provincia, colegio, cue, onElegir }) {
  const [texto, setTexto] = useState(colegio);
  const [opciones, setOpciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);
  const [manual, setManual] = useState(false);
  const [escribio, setEscribio] = useState(false); // la búsqueda arranca solo si la persona tipeó
  const pedido = useRef(0);
  const caja = useRef(null);
  const campo = useRef(null);
  const lista = useRef(null);

  useEffect(() => { setTexto(colegio); }, [colegio]);

  // Búsqueda con demora; cada letra nueva cancela el pedido anterior
  useEffect(() => {
    const id = ++pedido.current;
    if (cue || manual || !escribio || texto.trim().length < 3) {
      setOpciones([]); setBuscando(false); setSinConexion(false);
      return undefined;
    }
    setBuscando(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/escuelas?provincia=${encodeURIComponent(provincia)}&q=${encodeURIComponent(texto)}`, { signal: ctrl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (id !== pedido.current) return;
        setOpciones(j.escuelas || []); setAbierto(true); setSinConexion(false); setBuscando(false);
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        if (id !== pedido.current) return;
        setOpciones([]); setAbierto(true); setSinConexion(true); setBuscando(false); // queda como texto libre
      }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [texto, provincia, cue, manual, escribio]);

  // Tocar fuera del buscador cierra la lista (reemplaza al onBlur con temporizador)
  useEffect(() => {
    if (!abierto) return undefined;
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  // Cuando aparecen resultados, la lista se acerca a la vista (teclado abierto en el celular)
  useEffect(() => {
    if (abierto && lista.current) lista.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [abierto, opciones]);

  const elegir = (nombreEsc, codigo) => {
    pedido.current += 1; // descarta cualquier búsqueda en vuelo
    onElegir(nombreEsc, codigo);
    setAbierto(false);
    setOpciones([]);
    campo.current?.blur(); // baja el teclado
  };

  if (cue) {
    return (
      <div className="campo">
        <span className="campo-etq">Escuela</span>
        <div className="esc-elegida">
          <span>{colegio}</span>
          <button
            type="button"
            className="esc-cambiar"
            onClick={() => { onElegir('', null); setTexto(''); setManual(false); setEscribio(false); }}
          >
            cambiar
          </button>
        </div>
      </div>
    );
  }

  const puedeBuscar = !manual && texto.trim().length >= 3;
  return (
    <div className="campo" ref={caja}>
      <label htmlFor="campo-escuela" className="campo-etq">
        Escuela <small style={{ opacity: 0.6 }}>(opcional: escribí parte del nombre o el número)</small>
      </label>
      <input
        id="campo-escuela"
        ref={campo}
        value={texto}
        onChange={(e) => {
          const v = e.target.value.slice(0, 80);
          setTexto(v); setManual(false); setEscribio(true); onElegir(v, null);
        }}
        onFocus={() => {
          if (opciones.length) setAbierto(true);
          // con el teclado abierto, deja el campo a la vista
          setTimeout(() => campo.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="done"
        name="colegio"
      />
      {puedeBuscar && buscando && !abierto && <div className="esc-estado">Buscando…</div>}
      {abierto && puedeBuscar && (
        <div className="esc-lista" role="listbox" aria-label="Escuelas encontradas" ref={lista}>
          {opciones.map((o) => (
            <button
              type="button"
              role="option"
              aria-selected="false"
              key={o.cue}
              className="esc-op"
              onClick={() => elegir(o.nombre, o.cue)}
            >
              <b>{o.nombre}</b>
              <small>{[o.localidad, o.domicilio].filter(Boolean).join(' · ')}</small>
            </button>
          ))}
          <button
            type="button"
            className="esc-op esc-manual"
            onClick={() => { setManual(true); onElegir(texto.trim(), null); setAbierto(false); campo.current?.blur(); }}
          >
            {opciones.length
              ? 'Mi escuela no está en la lista'
              : sinConexion
                ? 'Sin conexión: usar lo que escribí'
                : 'No encontramos esa escuela: usar lo que escribí'}
          </button>
        </div>
      )}
    </div>
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
