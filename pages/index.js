import React, { useState, useEffect } from 'react';

export default function Home() {
  const [fase, setFase] = useState('registro');
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('CABA');
  const [colegio, setColegio] = useState('Otto Krause');
  const [numeroPrueba, setNumeroPrueba] = useState(1);

  // Acumuladores de datos crudos para las 4 rondas de cada minijuego
  const [m1Aciertos, setM1Aciertos] = useState(0);
  const [m1Fallos, setM1Fallos] = useState(0);
  const [m1Tiempos, setM1Tiempos] = useState([]);

  const [m2Tiempos, setM2Tiempos] = useState([]);
  const [m2Fallos, setM2Fallos] = useState(0);

  const [m3RondasPerfectas, setM3RondasPerfectas] = useState(0);
  const [m3Fallos, setM3Fallos] = useState(0);
  const [m3Tiempos, setM3Tiempos] = useState([]);

  const [m4TiemposReaccion, setM4TiemposReaccion] = useState([]);
  const [m4Fallos, setM4Fallos] = useState(0);

  const [m5Aciertos, setM5Aciertos] = useState(0);
  const [m5Fallos, setM5Fallos] = useState(0);

  // Control de rondas internas
  const [rondaActual, setRondaActual] = useState(1);
  const [tiempoInicioRonda, setTiempoInicioRonda] = useState(0);

  // Estado para Minigame 3 (Grilla expansiva)
  const [gridSize, setGridSize] = useState(2); // 2x2, luego 3x3, 4x4, etc.

  // Estado para Minigame 4 (Palabras cambiantes)
  const palabrasM4 = ["ATENCIÓN", "IMPULSO", "ENFOQUE", "VELOCIDAD"];
  const [palabraActualIndex, setPalabraActualIndex] = useState(0);

  // Estado para Minigame 5 (Discalculia: Números/Símbolos/Empates)
  const datosDiscalculia = [
    { tipo: "menor", a: 3, b: 7, correcta: "<" },
    { tipo: "empate", a: 5, b: 5, correcta: "=" },
    { tipo: "mayor", a: 9, b: 4, correcta: ">" },
    { tipo: "simbolo", a: "∑", b: "∏", correcta: "diferente" }
  ];

  const iniciarMinijuego = (faseDestino, size = 2) => {
    setFase(faseDestino);
    setRondaActual(1);
    setGridSize(size);
    setTiempoInicioRonda(Date.now());
  };

  const registrarAccionM1 = (esAcierto) => {
    const duracion = (Date.now() - tiempoInicioRonda) / 1000;
    setM1Tiempos(prev => [...prev, duracion]);
    if (esAcierto) setM1Aciertos(prev => prev + 1);
    else setM1Fallos(prev => prev + 1);

    if (rondaActual < 4) {
      setRondaActual(prev => prev + 1);
      setTiempoInicioRonda(Date.now());
    } else {
      iniciarMinijuego('m2');
    }
  };

  const registrarAccionM2 = (esAcierto) => {
    const duracion = (Date.now() - tiempoInicioRonda) / 1000;
    setM2Tiempos(prev => [...prev, duracion]);
    if (!esAcierto) setM2Fallos(prev => prev + 1);

    if (rondaActual < 4) {
      setRondaActual(prev => prev + 1);
      setTiempoInicioRonda(Date.now());
    } else {
      iniciarMinijuego('m3', 2); // Inicia M3 con grilla 2x2
    }
  };

  const registrarAccionM3 = (esCorrecto) => {
    const duracion = (Date.now() - tiempoInicioRonda) / 1000;
    setM3Tiempos(prev => [...prev, duracion]);
    if (esCorrecto) {
      setM3RondasPerfectas(prev => prev + 1);
    } else {
      setM3Fallos(prev => prev + 1);
    }

    if (rondaActual < 4) {
      setRondaActual(prev => prev + 1);
      setGridSize(prev => Math.min(prev + 1, 4)); // Aumenta la grilla progresivamente
      setTiempoInicioRonda(Date.now());
    } else {
      iniciarMinijuego('m4');
    }
  };

  const registrarAccionM4 = (esAcierto) => {
    const duracion = (Date.now() - tiempoInicioRonda) / 1000;
    setM4TiemposReaccion(prev => [...prev, duracion]);
    if (!esAcierto) setM4Fallos(prev => prev + 1);

    if (rondaActual < 4) {
      setRondaActual(prev => prev + 1);
      setPalabraActualIndex(prev => (prev + 1) % palabrasM4.length);
      setTiempoInicioRonda(Date.now());
    } else {
      iniciarMinijuego('m5');
    }
  };

  const registrarAccionM5 = (esAcierto) => {
    if (esAcierto) setM5Aciertos(prev => prev + 1);
    else setM5Fallos(prev => prev + 1);

    if (rondaActual < 4) {
      setRondaActual(prev => prev + 1);
    } else {
      enviarResultadosFinales();
    }
  };

  const enviarResultadosFinales = async () => {
    const promLatM1 = m1Tiempos.length > 0 ? m1Tiempos.reduce((a, b) => a + b, 0) / m1Tiempos.length : 0;
    const promLatM2 = m2Tiempos.length > 0 ? m2Tiempos.reduce((a, b) => a + b, 0) / m2Tiempos.length : 0;
    const promLatM3 = m3Tiempos.length > 0 ? m3Tiempos.reduce((a, b) => a + b, 0) / m3Tiempos.length : 0;
    const promLatM4 = m4TiemposReaccion.length > 0 ? m4TiemposReaccion.reduce((a, b) => a + b, 0) / m4TiemposReaccion.length : 0;

    const datosCrudos = {
      m1_aciertos: m1Aciertos,
      m1_fallos: m1Fallos,
      lat_m1: promLatM1,
      m2_tiempos: m2Tiempos,
      m2_fallos: m2Fallos,
      lat_m2: promLatM2,
      m3_rondas_perfectas: m3RondasPerfectas,
      m3_rondas_totales: 4,
      m3_fallos: m3Fallos,
      lat_m3: promLatM3,
      m4_tiempos_reaccion: m4TiemposReaccion,
      m4_fallos: m4Fallos,
      lat_m4: promLatM4,
      m5_aciertos: m5Aciertos,
      m5_fallos: m5Fallos
    };

    const payload = {
      nombre,
      edad: parseInt(edad),
      provincia,
      colegio,
      numero_prueba: numeroPrueba,
      datos_crudos: datosCrudos
    };

    try {
      const response = await fetch('/api/guardar-resultados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setFase('finalizado');
      } else {
        alert('Error al comunicarse con el servidor seguro.');
      }
    } catch (error) {
      console.error('Error de red:', error);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '40px auto', padding: '25px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', textAlign: 'center' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '10px' }}>FONIX: Evaluación Educativa</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '25px' }}>Plataforma Segura de Diagnóstico y KPIs</p>

      {fase === 'registro' && (
        <form onSubmit={(e) => { e.preventDefault(); if(nombre && edad) iniciarMinijuego('m1'); }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3>Registro del Participante</h3>
          <input type="text" placeholder="Nombre completo" value={nombre} onChange={e => setNombre(e.target.value)} required style={inputStyle} />
          <input type="number" placeholder="Edad" value={edad} onChange={e => setEdad(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="Provincia" value={provincia} onChange={e => setProvincia(e.target.value)} required style={inputStyle} />
          <input type="text" placeholder="Colegio" value={colegio} onChange={e => setColegio(e.target.value)} required style={inputStyle} />
          <button type="submit" style={btnStyle}>Comenzar Evaluación</button>
        </form>
      )}

      {fase === 'm1' && (
        <div>
          <h2>Minijuego 1: Discriminación Tipográfica (Ronda {rondaActual}/4)</h2>
          <p style={{ margin: '20px 0' }}>Identificá la letra con tipografía amigable para dislexia:</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <button onClick={() => registrarAccionM1(false)} style={{ ...btnStyle, fontFamily: 'Times New Roman', fontSize: '24px' }}>b</button>
            <button onClick={() => registrarAccionM1(true)} style={{ ...btnStyle, fontFamily: 'Comic Sans MS, sans-serif', fontSize: '24px', backgroundColor: '#27ae60' }}>d (Amigable)</button>
            <button onClick={() => registrarAccionM1(false)} style={{ ...btnStyle, fontFamily: 'Times New Roman', fontSize: '24px' }}>p</button>
          </div>
        </div>
      )}

      {fase === 'm2' && (
        <div>
          <h2>Minijuego 2: Segmentación de Frases (Ronda {rondaActual}/4)</h2>
          <p style={{ margin: '20px 0' }}>Seleccioná la frase correctamente segmentada:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => registrarAccionM2(false)} style={btnSecundarioStyle}>lascasasdelbarrio</button>
            <button onClick={() => registrarAccionM2(true)} style={btnSecundarioStyle}>las casas del barrio</button>
          </div>
        </div>
      )}

      {fase === 'm3' && (
        <div>
          <h2>Minijuego 3: Búsqueda Visual en Grilla (Ronda {rondaActual}/4 - {gridSize}x{gridSize})</h2>
          <p style={{ margin: '15px 0' }}>Encontrá y hacé clic en el símbolo diferente:</p>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, 1fr)`, gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
            {Array.from({ length: gridSize * gridSize }).map((_, index) => {
              const esDiferente = index === 2; // Ubicación aleatoria simulada
              return (
                <button key={index} onClick={() => registrarAccionM3(esDiferente)} style={{ padding: '20px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: '5px' }}>
                  {esDiferente ? 'E' : 'F'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {fase === 'm4' && (
        <div>
          <h2>Minijuego 4: Atención Sostenida (Ronda {rondaActual}/4)</h2>
          <p style={{ margin: '20px 0' }}>Palabra actual: <strong style={{ color: '#e74c3c', fontSize: '22px' }}>{palabrasM4[palabraActualIndex]}</strong></p>
          <p>Hacé clic cuando reconozcas el estímulo objetivo:</p>
          <button onClick={() => registrarAccionM4(true)} style={btnStyle}>¡Detectado / Continuar!</button>
        </div>
      )}

      {fase === 'm5' && (
        <div>
          <h2>Minijuego 5: Cribado de Discalculia (Ronda {rondaActual}/4)</h2>
          <p style={{ margin: '20px 0' }}>Compará los valores numéricos o símbolos:</p>
          <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '20px 0', color: '#2980b9' }}>
            {datosDiscalculia[rondaActual - 1].a} &nbsp; [ ? ] &nbsp; {datosDiscalculia[rondaActual - 1].b}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button onClick={() => registrarAccionM5(datosDiscalculia[rondaActual - 1].correcta === '<')} style={btnSecundarioStyle}>Menor (&lt;)</button>
            <button onClick={() => registrarAccionM5(datosDiscalculia[rondaActual - 1].correcta === '=')} style={btnSecundarioStyle}>Igual (= / Empate)</button>
            <button onClick={() => registrarAccionM5(datosDiscalculia[rondaActual - 1].correcta === '>')} style={btnSecundarioStyle}>Mayor (&gt;)</button>
            <button onClick={() => registrarAccionM5(datosDiscalculia[rondaActual - 1].correcta === 'diferente')} style={btnSecundarioStyle}>Símbolos Distintos</button>
          </div>
        </div>
      )}

      {fase === 'finalizado' && (
        <div>
          <h2 style={{ color: '#27ae60' }}>¡Evaluación Completada con Éxito!</h2>
          <p style={{ margin: '20px 0' }}>Los datos crudos han sido procesados de forma segura en el servidor y los KPIs se almacenaron en Neon para Looker Studio.</p>
          <button onClick={() => { setFase('registro'); setNombre(''); setEdad(''); setM1Aciertos(0); setM1Fallos(0); setM2Fallos(0); setM3RondasPerfectas(0); setM3Fallos(0); setM4Fallos(0); setM5Aciertos(0); setM5Fallos(0); }} style={btnStyle}>Nueva Evaluación</button>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '12px',
  fontSize: '16px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  width: '100%',
  boxSizing: 'border-box'
};

const btnStyle = {
  padding: '12px 25px',
  backgroundColor: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 'bold'
};

const btnSecundarioStyle = {
  padding: '10px 20px',
  backgroundColor: '#2ecc71',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '15px'
};
