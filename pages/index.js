import React, { useState } from 'react';

export default function Home() {
  const [fase, setFase] = useState('registro');
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [provincia, setProvincia] = useState('CABA');
  const [colegio, setColegio] = useState('Otto Krause');
  const [numeroPrueba, setNumeroPrueba] = useState(1);

  const [datosCrudos, setDatosCrudos] = useState({
    m1_aciertos: 0, m1_fallos: 0, lat_m1: 0,
    m2_tiempos: [], m2_fallos: 0, lat_m2: 0,
    m3_rondas_perfectas: 0, m3_rondas_totales: 1, m3_fallos: 0, lat_m3: 0,
    m4_tiempos_reaccion: [], m4_fallos: 0, lat_m4: 0,
    m5_aciertos: 0, m5_fallos: 0
  });

  const handleRegistroSubmit = (e) => {
    e.preventDefault();
    if (nombre.trim() && edad) {
      setFase('m1');
    }
  };

  const finalizarYEnviar = async (metricasFinales) => {
    const payload = {
      nombre,
      edad: parseInt(edad),
      provincia,
      colegio,
      numero_prueba: numeroPrueba,
      datos_crudos: metricasFinales
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
        alert('Error al guardar en el servidor');
      }
    } catch (error) {
      console.error("Error de conexión:", error);
    }
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '30px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <h1>FONIX: Plataforma Web</h1>

      {fase === 'registro' && (
        <form onSubmit={handleRegistroSubmit} style={{ marginTop: '30px' }}>
          <h2>Registro de Participante</h2>
          <div style={{ margin: '10px' }}>
            <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ margin: '10px' }}>
            <input type="number" placeholder="Edad" value={edad} onChange={e => setEdad(e.target.value)} required style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ margin: '10px' }}>
            <input type="text" placeholder="Provincia" value={provincia} onChange={e => setProvincia(e.target.value)} required style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ margin: '10px' }}>
            <input type="text" placeholder="Colegio" value={colegio} onChange={e => setColegio(e.target.value)} required style={{ padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#4a90e2', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Comenzar Juego</button>
        </form>
      )}

      {fase === 'm1' && (
        <div>
          <h2>Minijuego 1: Unir Columnas</h2>
          <p>Simulando partida...</p>
          <button onClick={() => {
            setDatosCrudos({...datosCrudos, m1_aciertos: 4, m1_fallos: 0, lat_m1: 1.2});
            setFase('m2');
          }} style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Siguiente (M2)</button>
        </div>
      )}

      {fase === 'm2' && (
        <div>
          <h2>Minijuego 2: Separar Palabras</h2>
          <p>Simulando partida...</p>
          <button onClick={() => {
            setDatosCrudos({...datosCrudos, m2_tiempos: [0.8, 1.1], m2_fallos: 0, lat_m2: 0.9});
            setFase('m3');
          }} style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Siguiente (M3)</button>
        </div>
      )}

      {fase === 'm3' && (
        <div>
          <h2>Minijuego 3: Símbolos Espejo</h2>
          <p>Simulando partida...</p>
          <button onClick={() => {
            setDatosCrudos({...datosCrudos, m3_rondas_perfectas: 1, m3_rondas_totales: 1, m3_fallos: 0, lat_m3: 0.7});
            setFase('m4');
          }} style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Siguiente (M4)</button>
        </div>
      )}

      {fase === 'm4' && (
        <div>
          <h2>Minijuego 4: Detección de Cambios</h2>
          <p>Simulando partida...</p>
          <button onClick={() => {
            setDatosCrudos({...datosCrudos, m4_tiempos_reaccion: [0.5, 0.6], m4_fallos: 0, lat_m4: 0.8});
            setFase('m5');
          }} style={{ padding: '10px 20px', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Siguiente (M5)</button>
        </div>
      )}

      {fase === 'm5' && (
        <div>
          <h2>Minijuego 5: Cribado Discalculia</h2>
          <p>Simulando partida...</p>
          <button onClick={() => {
            const finalData = {...datosCrudos, m5_aciertos: 4, m5_fallos: 0};
            finalizarYEnviar(finalData);
          }} style={{ padding: '10px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Finalizar y Enviar Resultados</button>
        </div>
      )}

      {fase === 'finalizado' && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ color: '#27ae60' }}>¡Datos guardados con éxito en Neon!</h2>
          <button onClick={() => { setFase('registro'); setNombre(''); setEdad(''); }} style={{ padding: '10px 20px', backgroundColor: '#4a90e2', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Nueva Evaluación</button>
        </div>
      )}
    </div>
  );
}
