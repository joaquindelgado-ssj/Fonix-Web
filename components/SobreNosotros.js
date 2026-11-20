import { useState } from 'react';
import { FOTOS_EQUIPO } from '../lib/equipo';
import Modal from './Modal';

// Burbuja flotante a la izquierda de la pantalla principal. Al tocarla abre el
// sobre-pantalla "Sobre nosotros" con las fotos del equipo, CABA y los dos logos.
export default function SobreNosotros() {
  const [abierto, setAbierto] = useState(false);
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
            <h2 id="sn-titulo" className="titulo">Sobre nosotros</h2>
            <div className="sn-caba">CABA</div>
          </header>

          <Fotos />

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
          </div>
        </Modal>
      )}
    </>
  );
}

function Fotos() {
  const [rotas, setRotas] = useState({});
  const fotos = FOTOS_EQUIPO.filter((f) => !rotas[f.src]);
  if (!fotos.length) {
    // Todavía no hay fotos cargadas: marcos de ejemplo
    return (
      <div className="sn-fotos" aria-label="Fotos del equipo">
        {[0, 1, 2].map((i) => (
          <div key={i} className="sn-foto vacia"><span>Foto del equipo</span></div>
        ))}
      </div>
    );
  }
  return (
    <div className="sn-fotos" aria-label="Fotos del equipo">
      {fotos.map((f) => (
        <div key={f.src} className="sn-foto">
          <img
            src={f.src}
            alt={f.alt || 'Foto del equipo'}
            loading="lazy"
            decoding="async"
            draggable="false"
            onError={() => setRotas((r) => ({ ...r, [f.src]: true }))}
          />
        </div>
      ))}
    </div>
  );
}
