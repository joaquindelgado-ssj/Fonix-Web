import { useEffect, useRef } from 'react';

// Tiempo en segundos con precisión de milisegundos (equivale a time.time() del Python)
export const ahora = () => performance.now() / 1000;
export const r3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);
export const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

// Escucha una tecla (por ejemplo ' ' para ESPACIO) mientras `activo` sea true
export function useTecla(tecla, accion, activo = true) {
  const ref = useRef(accion);
  ref.current = accion;
  useEffect(() => {
    if (!activo) return undefined;
    const h = (e) => {
      if (e.key === tecla || (tecla === ' ' && e.code === 'Space')) {
        const tag = e.target?.tagName;
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        if (!e.repeat) ref.current(e);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [tecla, activo]);
}

export function nuevoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
