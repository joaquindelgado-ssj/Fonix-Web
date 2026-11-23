import { useCallback, useEffect, useRef, useState } from 'react';
import { Instrucciones, Pizarron } from '../components/comun';
import Modal from '../components/Modal';
import { DemoM1, DemoM2, DemoM3, DemoM4, DemoM5, DemoM6 } from '../components/demos';
import M1Unir from '../components/M1Unir';
import M2Separar from '../components/M2Separar';
import M3Simbolos from '../components/M3Simbolos';
import M4Deteccion from '../components/M4Deteccion';
import M5Discalculia from '../components/M5Discalculia';
import M6Stroop from '../components/M6Stroop';
import { Final, Registro } from '../components/Pantallas';
import { enviarResultados, vaciarCola } from '../lib/envio';
import { nuevoId } from '../lib/util';
import { VERSION_PRUEBA } from '../lib/datos';
import { registrar } from '../lib/navegacion';

const JUEGOS = [
  {
    clave: 'm1', Comp: M1Unir, demo: <DemoM1 />, titulo: 'Unir columnas',
    lineas: [
      'Vas a ver dos columnas de palabras.',
      'Cada palabra tiene una pareja igual del otro lado.',
      'Tocá una palabra y después su pareja para unirlas.',
      'Son 4 rondas.',
    ],
  },
  {
    clave: 'm2', Comp: M2Separar, demo: <DemoM2 />, titulo: 'Separar palabras',
    lineas: [
      'Aparece una frase con todas las palabras pegadas.',
      'Tocá el espacio entre las letras donde termina cada palabra.',
      'Son 4 frases.',
    ],
  },
  {
    clave: 'm3', Comp: M3Simbolos, demo: <DemoM3 />, titulo: 'Explorador de símbolos',
    lineas: [
      'Vas a ver una grilla de letras casi iguales.',
      'Una sola está espejada: es la intrusa.',
      'A veces las letras van a estar muy juntas.',
      'Encontrala y tocala lo más rápido que puedas.',
    ],
  },
  {
    clave: 'm4', Comp: M4Deteccion, demo: <DemoM4 />, titulo: 'Detectar cambios',
    lineas: [
      'Una palabra aparece y se tapa con un cuadro negro.',
      'A veces, mientras está tapada, dos letras cambian de lugar.',
      'Cuando vuelva a aparecer cambiada, tocá “¡Cambió!”.',
      'En algunas rondas la palabra NO cambia: ahí no toques nada.',
      'Son 6 rondas.',
    ],
  },
  {
    clave: 'm6', Comp: M6Stroop, demo: <DemoM6 />, titulo: 'Colores',
    lineas: [
      'Vas a ver palabras pintadas de un color.',
      'Tocá el botón del COLOR DE LA TINTA, no lo que dice la palabra.',
      'Si ves XXXX, también tocás su color.',
      'Respondé rápido, pero tratando de no equivocarte.',
    ],
  },
  {
    clave: 'm5', Comp: M5Discalculia, demo: <DemoM5 />, titulo: 'Números y cantidades',
    lineas: [
      'Vas a ver dos cuadros con números o puntitos.',
      'Tocá el cuadro que vale MÁS (no el que se ve más grande).',
      'Si valen lo mismo, tocá “Son iguales”.',
      'Son 4 rondas de 5 cuadros cada una.',
    ],
  },
];

const inicial = () => ({ fase: 'registro', juego: 0, paso: 'instr', participante: null, rondas: {}, id: null });
// Orden: m1 m2 m3 m4 m6(Stroop) m5(Números): los juegos de lectura juntos y la discalculia al final.

export default function Home() {
  const [e, setE] = useState(inicial);
  const [estadoEnvio, setEstadoEnvio] = useState(null);
  const [confirmandoSalir, setConfirmandoSalir] = useState(false);
  const eRef = useRef(e);
  eRef.current = e;
  const juegoActual = () => JUEGOS[eRef.current.juego]?.clave;

  // Registro de navegación: una visita al cargar y un abandono si cierran la pestaña a mitad de la prueba
  useEffect(() => {
    registrar('visita');
    const alSalir = () => { if (eRef.current.fase === 'juego') registrar('abandono', { juego: juegoActual() }); };
    window.addEventListener('pagehide', alSalir);
    return () => window.removeEventListener('pagehide', alSalir);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mantiene la pantalla encendida mientras se juega (en la feria nadie toca el celular
  // entre consigna y consigna y se apagaría). Si el navegador no lo soporta, no pasa nada.
  useEffect(() => {
    let candado = null;
    const pedir = async () => {
      try {
        if (document.visibilityState === 'visible' && navigator.wakeLock) candado = await navigator.wakeLock.request('screen');
      } catch { /* sin permiso o sin soporte */ }
    };
    pedir();
    document.addEventListener('visibilitychange', pedir);
    return () => {
      document.removeEventListener('visibilitychange', pedir);
      try { candado?.release(); } catch { /* nada */ }
    };
  }, []);

  // Reintenta envíos pendientes cada 30 s
  useEffect(() => {
    const id = setInterval(() => { vaciarCola(); }, 30000);
    return () => clearInterval(id);
  }, []);

  const empezar = (participante) => {
    registrar('inicio_prueba');
    setE({ ...inicial(), fase: 'juego', participante, id: nuevoId() });
  };

  const terminarJuego = useCallback((resultados) => {
    registrar('juego_fin', { juego: juegoActual() });
    setE((prev) => {
      const juego = JUEGOS[prev.juego];
      const rondas = { ...prev.rondas, [juego.clave]: resultados };
      if (prev.juego < JUEGOS.length - 1) {
        return { ...prev, rondas, juego: prev.juego + 1, paso: 'instr' };
      }
      return { ...prev, rondas, fase: 'final' };
    });
  }, []);

  // Al llegar a la pantalla final se envían los datos crudos al servidor
  useEffect(() => {
    if (e.fase !== 'final') return;
    registrar('fin_prueba');
    setEstadoEnvio('enviando');
    enviarResultados({ id_sesion: e.id, version: VERSION_PRUEBA, participante: e.participante, rondas: e.rondas })
      .then(setEstadoEnvio)
      .catch(() => setEstadoEnvio('pendiente'));
  }, [e.fase, e.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Confirmación propia (botones grandes para el dedo; los diálogos nativos pueden estar bloqueados)
  const salir = () => setConfirmandoSalir(true);
  const cancelarPrueba = () => { registrar('cancelacion', { juego: juegoActual() }); setConfirmandoSalir(false); setE(inicial()); };

  if (e.fase === 'registro') {
    return <Pizarron burbuja><Registro onListo={empezar} /></Pizarron>;
  }

  if (e.fase === 'final') {
    return (
      <Pizarron juegoActual={JUEGOS.length}>
        <Final nombre={e.participante.nombre} estado={estadoEnvio} onNueva={() => { registrar('nueva_prueba'); setEstadoEnvio(null); setE(inicial()); }} />
      </Pizarron>
    );
  }

  const j = JUEGOS[e.juego];
  return (
    <Pizarron juegoActual={e.juego} onSalir={salir}>
      {e.paso === 'instr' ? (
        <Instrucciones
          key={`i${e.juego}`}
          numero={e.juego + 1}
          titulo={j.titulo}
          lineas={j.lineas}
          demo={j.demo}
          onComenzar={() => { registrar('juego_inicio', { juego: j.clave }); setE((p) => ({ ...p, paso: 'jugar' })); }}
        />
      ) : (
        <j.Comp key={`j${e.juego}`} onFin={terminarJuego} />
      )}
      {confirmandoSalir && (
        <Modal idTitulo="salir-titulo" onCerrar={() => setConfirmandoSalir(false)} className="confirmar-panel">
          <h2 id="salir-titulo" className="titulo">¿Cancelar la prueba?</h2>
          <p className="consigna">Se van a perder las respuestas.</p>
          <div className="confirmar-botones">
            <button type="button" className="btn primario" onClick={() => setConfirmandoSalir(false)}>Seguir jugando</button>
            <button type="button" className="btn" onClick={cancelarPrueba}>Sí, cancelar</button>
          </div>
        </Modal>
      )}
    </Pizarron>
  );
}
