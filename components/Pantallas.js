import { useEffect, useState } from 'react';
import { PROVINCIAS } from '../lib/datos';
import { pendientes, vaciarCola } from '../lib/envio';

const CLAVE_STAND = 'fonix_stand'; // recuerda provincia/colegio entre participantes

export function Registro({ onListo }) {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('CABA');
  const [colegio, setColegio] = useState('');
  const [enCola, setEnCola] = useState(0);

  useEffect(() => {
    try {
      const g = JSON.parse(localStorage.getItem(CLAVE_STAND) || '{}');
      if (g.provincia) setProvincia(g.provincia);
      if (g.colegio) setColegio(g.colegio);
    } catch { /* nada */ }
    setEnCola(pendientes());
    vaciarCola().then(setEnCola);
  }, []);

  const enviar = (e) => {
    e.preventDefault();
    try { localStorage.setItem(CLAVE_STAND, JSON.stringify({ provincia, colegio })); } catch { /* nada */ }
    onListo({ nombre: nombre.trim(), edad: parseInt(edad, 10), provincia, colegio: colegio.trim() });
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
            <select value={provincia} onChange={(e) => setProvincia(e.target.value)} name="provincia">
              {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
        <label>
          Escuela <small style={{ opacity: 0.6 }}>(opcional)</small>
          <input value={colegio} onChange={(e) => setColegio(e.target.value.slice(0, 80))} autoComplete="off" name="colegio" />
        </label>
        <button type="submit" className="btn primario grande">¡A jugar!</button>
      </form>
      {enCola > 0 && (
        <div className="estado-envio">{enCola} prueba(s) esperando conexión para guardarse</div>
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
