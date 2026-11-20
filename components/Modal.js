import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Sobre-pantalla genérico (se usa en "Sobre nosotros" y en la confirmación de salir).
// - Se dibuja en <body> para que ningún contenedor con overflow lo recorte.
// - Se cierra tocando el fondo, con la X o con ESC.
// - Devuelve el foco al elemento que lo abrió.
// Solo se monta después de un toque, por eso es seguro usar `document` acá.
export default function Modal({ titulo, idTitulo, onCerrar, children, className = '' }) {
  const panel = useRef(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    const previo = document.activeElement;
    const botonCerrar = panel.current?.querySelector('[data-cerrar]');
    botonCerrar?.focus({ preventScroll: true });

    const alTeclear = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); cerrar.current(); return; }
      if (e.key === 'Tab') { // el foco queda dentro del sobre-pantalla
        const foco = panel.current?.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])');
        if (!foco || !foco.length) return;
        const primero = foco[0];
        const ultimo = foco[foco.length - 1];
        if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
        else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      if (previo && previo.focus) previo.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className="modal-fondo" onClick={onCerrar}>
      <section
        ref={panel}
        className={`modal-panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-label={idTitulo ? undefined : titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-cerrar" data-cerrar aria-label="Cerrar" onClick={onCerrar}>✕</button>
        {/* el cuerpo scrollea; la X queda fija arriba a la derecha */}
        <div className="modal-cuerpo">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
