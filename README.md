# FONIX Web

Versión web de FONIX: cribado pedagógico de habilidades lectoras mediante 5 minijuegos
(4 rondas cada uno), migrada desde `FonixV1.5eco.py` y `FonixVersionPruebaFeriaV4.py`.

## Minijuegos
1. **Unir columnas**: unir palabras iguales; una ronda al azar usa tipografía amigable, las otras 3 tipografías complicadas.
2. **Separar palabras**: tocar los espacios en frases pegadas (`cuidemoselplaneta`, …).
3. **Explorador de símbolos**: encontrar la letra espejada en una grilla (d/b, p/q, m/n).
4. **Detectar cambios**: avisar cuando una palabra reaparece con dos letras intercambiadas.
5. **Números y cantidades**: cribado de discalculia (congruente, puntos, incongruente, empate).

Se juega con mouse, teclado (barra ESPACIO) o pantalla táctil.

## Arquitectura
- `pages/index.js` + `components/`: el juego. El navegador solo registra datos crudos (aciertos, fallos, tiempos).
- `pages/api/guardar-resultados.js`: valida los datos, calcula KPIs y puntaje y guarda en Neon.
- `lib/server/kpis.js`: **el algoritmo**. Solo lo importa la API, así que nunca llega al navegador.
- `lib/envio.js`: si no hay internet, guarda la prueba en el navegador y la reenvía sola después.

## Base de datos (Neon, tabla `resultados_feria`)
Además de los KPIs originales se guardan `id_sesion` (evita duplicados), `m1_mejora_amigable_pct`
(comparación de tipografías de V1.5) y `datos_crudos` (jsonb con todas las rondas, para análisis posterior).

Variable de entorno requerida en Vercel: `DATABASE_URL`.
