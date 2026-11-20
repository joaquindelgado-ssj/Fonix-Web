import { useEffect, useState } from 'react';
import { INTEGRANTES, PROFESOR } from '../lib/equipo';
import Modal from './Modal';

const LOGOS = ['/logos/otto-krause.png', '/logos/direccion-tecnica.png'];

// Burbuja de tiza a la izquierda de la pantalla principal. Al tocarla abre el sobre-pantalla
// "Sobre nosotros": CABA en la esquina, título arriba al medio, logos debajo, los integrantes con su nombre y el profesor abajo.
export default function SobreNosotros() {
  const [abierto, setAbierto] = useState(false);

  // Baja las imágenes en segundo plano para que el pop up abra ya con todo cargado
  // (en la feria el Wi-Fi puede ser lento).
  useEffect(() => {
    const t = setTimeout(() => {
      [...LOGOS, ...INTEGRANTES.map((p) => p.src), PROFESOR.src].forEach((src) => { const i = new Image(); i.src = src; });
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <button
        type="button"
        className="burbuja-nosotros"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
      >
        Sobre nosotros
      </button>
      {abierto && (
        <Modal idTitulo="sn-titulo" onCerrar={() => setAbierto(false)} className="sn-panel">
          <div className="sn-grilla">
            <header className="sn-cabecera">
              <div className="sn-caba">CABA</div>
              <h2 id="sn-titulo" className="titulo">Sobre nosotros</h2>
            </header>

            <div className="sn-logos">
              <figure className="sn-logo">
                <div className="sn-logo-papel">
                  <img src="/logos/otto-krause.png" alt="Escudo de la Escuela Técnica Otto Krause" width="250" height="262" draggable="false" decoding="async" />
                </div>
                <figcaption>Otto Krause</figcaption>
              </figure>
              <figure className="sn-logo">
                <div className="sn-logo-papel">
                  <img src="/logos/direccion-tecnica.png" alt="Logo de la Dirección de Educación Técnica de la Ciudad de Buenos Aires" width="640" height="640" draggable="false" decoding="async" />
                </div>
                <figcaption>Dirección de Educación Técnica</figcaption>
              </figure>
            </div>

            <div className="sn-equipo">
              {INTEGRANTES.map((p, i) => <Persona key={p.nombre} persona={p} indice={i} />)}
            </div>

            <div className="sn-profe">
              <Persona persona={PROFESOR} indice={1} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function Persona({ persona, indice }) {
  return (
    <figure className={`sn-foto ${indice % 2 ? 'par' : ''}`}>
      <img src={persona.src} alt={persona.nombre} width="520" height="520" draggable="false" decoding="async" />
      <figcaption>
        {persona.nombre}
        {persona.correo && <span className="sn-correo">{persona.correo}</span>}
      </figcaption>
    </figure>
  );
}
