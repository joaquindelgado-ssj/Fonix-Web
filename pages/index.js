import React, { useState } from 'react';

// Bancos de estímulos para las 4 rondas de cada minijuego
const RONDAS_M1 = [
  { opciones: [{ texto: 'b', fuente: 'Times New Roman', correcta: false }, { texto: 'd', fuente: 'Comic Sans MS, sans-serif', correcta: true }, { texto: 'p', fuente: 'Times New Roman', correcta: false }] },
  { opciones: [{ texto: 'q', fuente: 'Georgia', correcta: false }, { texto: 'p', fuente: 'Georgia', correcta: false }, { texto: 'b', fuente: 'Verdana, sans-serif', correcta: true }] },
  { opciones: [{ texto: 'd', fuente: 'Comic Sans MS, sans-serif', correcta: true }, { texto: 'q', fuente: 'Times New Roman', correcta: false }, { texto: 'b', fuente: 'Times New Roman', correcta: false }] },
  { opciones: [{ texto: 'p', fuente: 'Georgia', correcta: false }, { texto: 'q', fuente: 'Verdana, sans-serif', correcta: true }, { texto: 'd', fuente: 'Georgia', correcta: false }] }
];

const RONDAS_M2 = [
  { junta: 'lascasasdelbarrio', separada: 'las casas del barrio' },
  { junta: 'elperrocorrerápido', separada: 'el perro corre rápido' },
  { junta: 'mañanalloverámucho', separada: 'mañana lloverá mucho' },
  { junta: 'loslibrosestánabiertos', separada: 'los libros están abiertos' }
];

const RONDAS_M3 = [
  { size: 2, base: 'F', distinta: 'E', posDistinta: 2 },
  { size: 3, base: 'O', distinta: 'Q', posDistinta: 5 },
  { size: 3, base: 'M', distinta: 'N', posDistinta: 7 },
  { size: 4, base: '6', distinta: '9', posDistinta: 11 }
];

const RONDAS_M4 = [
  { objetivo: 'ROJO', opciones: ['AZUL', 'ROJO', 'VERDE'] },
  { objetivo: 'SOL', opciones: ['LUNA', 'NUBE', 'SOL'] },
  { objetivo: 'TREN', opciones: ['TREN', 'AUTO', 'BARCO'] },
  { objetivo: 'AGUA', opciones: ['FUEGO', 'AGUA', 'TIERRA'] }
];

const RONDAS_M5 = [
  { a: 3, b: 7, correcta: '<' },
  { a: 5, b: 5, correcta: '=' },
  { a: 9, b: 4, correcta: '>' },
  { a: '∑', b: '∏', correcta: 'diferente' }
];

export default function Home() {
  const [fase, setFase] = useState('registro');
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('CABA');
  const [colegio, setColegio] = useState('Otto Krause');
  const [numeroPrueba, setNumeroPrueba] = useState(1);

  const [rondaActual, setRondaActual] = useState(0);
  const [tiempoInicio, setTiempoInicio] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [puntajeFinal, setPuntajeFinal] = useState(null);

  // Acumuladores crudos (sin lógica de KPIs en el cliente)
  const [metricas, setMetricas] = useState({
    m1_aciertos: 0, m1_fallos: 0, m1_tiempos: [],
    m2_tiempos: [], m2_fallos: 0,
    m3_rondas_perfectas: 0, m3_fallos: 0, m3_tiempos: [],
    m4_tiempos_reaccion: [], m4_fallos: 0,
    m5_aciertos: 0, m5_fallos: 0
  });

  const iniciarFase = (nuevaFase) => {
    setFase(nuevaFase);
    setRondaActual(0);
    setTiempoInicio(Date.now());
  };

  const avanzarRonda = (siguienteFase, nuevasMetricas) => {
    setMetricas(nuevasMetricas);
    if (rondaActual < 3) {
      setRondaActual(rondaActual + 1);
      setTiempoInicio(Date.now());
    } else if (siguienteFase !== 'finalizar') {
      iniciarFase(siguienteFase);
    } else {
      enviarAlBackend(nuevasMetricas);
    }
  };

  // --- Manejadores por Minijuego ---
  const handleM1 = (esCorrecta) => {
    const t = (Date.now() - tiempoInicio) / 1000;
    const act = {
      ...metricas,
      m1_aciertos: metricas.m1_aciertos + (esCorrecta ? 1 : 0),
      m1_fallos: metricas.m1_fallos + (esCorrecta ? 0 : 1),
      m1_tiempos: [...metricas.m1_tiempos, t]
    };
    avanzarRonda('m2', act);
  };

  const handleM2 = (esCorrecta) => {
    const t = (Date.now() - tiempoInicio) / 1000;
    const act = {
      ...metricas,
      m2_tiempos: [...metricas.m2_tiempos, t],
      m2_fallos: metricas.m2_fallos + (esCorrecta ? 0 : 1)
    };
    avanzarRonda('m3', act);
  };

  const handleM3 = (esCorrecta) => {
    const t = (Date.now() - tiempoInicio) / 1000;
    const act = {
      ...metricas,
      m3_rondas_perfectas: metricas.m3_rondas_perfectas + (esCorrecta ? 1 : 0),
      m3_fallos: metricas.m3_fallos + (esCorrecta ? 0 : 1),
      m3_tiempos: [...metricas.m3_tiempos, t]
    };
    avanzarRonda('m4', act);
  };

  const handleM4 = (esCorrecta) => {
    const t = (Date.now() - tiempoInicio) / 1000;
    const act = {
      ...metricas,
      m4_tiempos_reaccion: [...metricas.m4_tiempos_reaccion, t],
      m4_fallos: metricas.m4_fallos + (esCorrecta ? 0 : 1)
    };
    avanzarRonda('m5', act);
  };

  const handleM5 = (esCorrecta) => {
    const act = {
      ...metricas,
      m5_aciertos: metricas.m5_aciertos + (esCorrecta ? 1 : 0),
      m5_fallos: metricas.m5_fallos + (esCorrecta ? 0 : 1)
    };
    avanzarRonda('finalizar', act);
  };

  // --- Envío seguro al servidor ---
  const enviarAlBackend = async (datosFinales) => {
    setEnviando(true);
    const promedio = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const payload = {
      nombre,
      edad: parseInt(edad, 10),
      provincia,
      colegio,
      numero_prueba: numeroPrueba,
      datos_crudos: {
        m1_aciertos: datosFinales.m1_aciertos,
        m1_fallos: datosFinales.m1_fallos,
        lat_m1: promedio(datosFinales.m1_tiempos),
        m2_tiempos: datosFinales.m2_tiempos,
        m2_fallos: datosFinales.m2_fallos,
        lat_m2: promedio(datosFinales.m2_tiempos),
        m3_rondas_perfectas: datosFinales.m3_rondas_perfectas,
        m3_rondas_totales: 4,
        m3_fallos: datosFinales.m3_fallos,
        lat_m3: promedio(datosFinales.m3_tiempos),
        m4_tiempos_reaccion: datosFinales.m4_tiempos_reaccion,
        m4_fallos: datosFinales.m4_fallos,
        lat_m4: promedio(datosFinales.m4_tiempos_reaccion),
        m5_aciertos: datosFinales.m5_aciertos,
        m5_fallos: datosFinales.m5_fallos
      }
    };

    try {
      const res = await fetch('/api/guardar-resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setPuntajeFinal(data.puntaje_global);
        setFase('finalizado');
      } else {
        alert('Error al procesar los resultados en el servidor.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const reiniciarTodo = () => {
    setNumeroPrueba(prev => prev + 1);
    setNombre('');
    setEdad('');
    setPuntajeFinal(null);
    setMetricas({
      m1_aciertos: 0, m1_fallos: 0, m1_tiempos: [],
      m2_tiempos: [], m2_fallos: 0,
      m3_rondas_perfectas: 0, m3_fallos: 0, m3_tiempos: [],
      m4_tiempos_reaccion: [], m4_fallos: 0,
      m5_aciertos: 0, m5_fallos: 0
    });
    setFase('registro');
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#2c3e50', marginBottom: '5px' }}>FONIX</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '25px', fontSize: '14px' }}>Cribado Cognitivo y Lectoescritura</p>

      {fase === 'registro' && (
        <form onSubmit={(e) => { e.preventDefault(); iniciarFase('m1'); }} style={formStyle}>
          <h3>Datos del Participante</h3>
          <input type="text" placeholder="Nombre y Apellido" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} />
          <input type="number" placeholder="Edad" min="5" max="99" value={edad} onChange={e => setEdad(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="Provincia" value={provincia} onChange={e => setProvincia(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="Colegio" value={colegio} onChange={e => setColegio(e.target.value)} required style={inputStyle} />
          <button type="submit" style={btnPrimary}>Iniciar Prueba</button>
        </form>
      )}

      {fase === 'm1' && (
        <div>
          <h3>1. Discriminación Tipográfica (Ronda {rondaActual + 1}/4)</h3>
          <p style={instruccionStyle}>Elegí la letra con la tipografía más clara y amigable:</p>
          <div style={rowButtons}>
            {RONDAS_M1[rondaActual].opciones.map((op, i) => (
              <button key={i} onClick={() => handleM1(op.correcta)} style={{ ...btnCard, fontFamily: op.fuente, fontSize: '32px' }}>
                {op.texto}
              </button>
            ))}
          </div>
        </div>
      )}

      {fase === 'm2' && (
        <div>
          <h3>2. Segmentación Léxica (Ronda {rondaActual + 1}/4)</h3>
          <p style={instruccionStyle}>Seleccioná la oración escrita con los espacios correctos:</p>
          <div style={colButtons}>
            <button onClick={() => handleM2(rondaActual % 2 !== 0)} style={btnOption}>
              {rondaActual % 2 === 0 ? RONDAS_M2[rondaActual].junta : RONDAS_M2[rondaActual].separada}
            </button>
            <button onClick={() => handleM2(rondaActual % 2 === 0)} style={btnOption}>
              {rondaActual % 2 === 0 ? RONDAS_M2[rondaActual].separada : RONDAS_M2[rondaActual].junta}
            </button>
          </div>
        </div>
      )}

      {fase === 'm3' && (
        <div>
          <h3>3. Búsqueda Visual (Ronda {rondaActual + 1}/4)</h3>
          <p style={instruccionStyle}>Tocá el carácter diferente en la grilla ({RONDAS_M3[rondaActual].size}x{RONDAS_M3[rondaActual].size}):</p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${RONDAS_M3[rondaActual].size}, 1fr)`, gap: '10px', maxWidth: '280px', margin: '0 auto' }}>
            {Array.from({ length: RONDAS_M3[rondaActual].size ** 2 }).map((_, idx) => {
              const esDistinta = idx === RONDAS_M3[rondaActual].posDistinta;
              return (
                <button key={idx} onClick={() => handleM3(esDistinta)} style={btnGrid}>
                  {esDistinta ? RONDAS_M3[rondaActual].distinta : RONDAS_M3[rondaActual].base}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fase === 'm4' && (
        <div>
          <h3>4. Atención y Reacción (Ronda {rondaActual + 1}/4)</h3>
          <p style={instruccionStyle}>Seleccioná rápidamente la palabra: <strong style={{ color: '#e74c3c', fontSize: '20px' }}>{RONDAS_M4[rondaActual].objetivo}</strong></p>
          <div style={rowButtons}>
            {RONDAS_M4[rondaActual].opciones.map((palabra, i) => (
              <button key={i} onClick={() => handleM4(palabra === RONDAS_M4[rondaActual].objetivo)} style={btnOption}>
                {palabra}
              </button>
            ))}
          </div>
        </div>
      )}

      {fase === 'm5' && !enviando && (
        <div>
          <h3>5. Comparación Numérica y Simbólica (Ronda {rondaActual + 1}/4)</h3>
          <p style={instruccionStyle}>Indicá la relación correcta entre ambos elementos:</p>
          <div style={{ fontSize: '32px', fontWeight: 'bold', margin: '20px 0', color: '#2980b9' }}>
            {RONDAS_M5[rondaActual].a} &nbsp; ? &nbsp; {RONDAS_M5[rondaActual].b}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={() => handleM5(RONDAS_M5[rondaActual].correcta === '<')} style={btnOption}>Menor (&lt;)</button>
            <button onClick={() => handleM5(RONDAS_M5[rondaActual].correcta === '=')} style={btnOption}>Igual / Empate (=)</button>
            <button onClick={() => handleM5(RONDAS_M5[rondaActual].correcta === '>')} style={btnOption}>Mayor (&gt;)</button>
            <button onClick={() => handleM5(RONDAS_M5[rondaActual].correcta === 'diferente')} style={btnOption}>Símbolos Distintos</button>
          </div>
        </div>
      )}

      {enviando && <p style={{ fontSize: '18px', color: '#3498db' }}>Procesando resultados en el servidor...</p>}

      {fase === 'finalizado' && (
        <div>
          <h2 style={{ color: '#27ae60' }}>¡Prueba Finalizada!</h2>
          <p style={{ margin: '15px 0', color: '#34495e' }}>Los datos fueron calculados y guardados de forma segura.</p>
          {puntajeFinal !== null && (
            <div style={{ padding: '15px', backgroundColor: '#eafaf1', borderRadius: '8px', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold', color: '#1e8449' }}>
              Índice Global: {puntajeFinal} / 100
            </div>
          )}
          <button onClick={reiniciarTodo} style={btnPrimary}>Nueva Evaluación</button>
        </div>
      )}
    </div>
  );
}

const containerStyle = { fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '540px', margin: '40px auto', padding: '30px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputStyle = { padding: '12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #dcdde1', width: '100%', boxSizing: 'border-box' };
const instruccionStyle = { margin: '15px 0 25px', color: '#576574' };
const rowButtons = { display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' };
const colButtons = { display: 'flex', flexDirection: 'column', gap: '12px' };
const btnPrimary = { padding: '14px 24px', backgroundColor: '#2980b9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', marginTop: '10px' };
const btnOption = { padding: '12px 18px', backgroundColor: '#34495e', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' };
const btnCard = { padding: '20px 30px', backgroundColor: '#f5f6fa', color: '#2f3640', border: '2px solid #dcdde1', borderRadius: '8px', cursor: 'pointer' };
const btnGrid = { padding: '18px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#f5f6fa', border: '1px solid #ced6e0', borderRadius: '6px' };
