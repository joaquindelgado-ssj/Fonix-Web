# FONIX Web

Versión web de FONIX: cribado pedagógico de habilidades lectoras mediante 5 minijuegos
(4 rondas cada uno), migrada desde `FonixV1.5eco.py` y `FonixVersionPruebaFeriaV4.py`.

## Minijuegos (protocolo v2)
| # | Minijuego | Diseño | Indicadores | Fundamento |
|---|---|---|---|---|
| 1 | Unir columnas | 4 sets de igual dificultad; 2 rondas con fuente amigable y 2 complicadas, orden ABBA/BAAB | precisión, mejora % con fuente amigable | Rello & Baeza-Yates (2013) |
| 2 | Separar palabras | 4 frases, 2 cortes cada una, 13–15 letras | segundos por corte, errores | Querejeta (CONICET/UNLP) |
| 3 | Símbolos espejados | b/d, p/q, d/b, q/p; 2 rondas con letras juntas | tiempo de búsqueda, efecto crowding | Dehaene et al. (2010); Zorzi et al. (2012) |
| 4 | Detectar cambios | 6 rondas: 4 con transposición interior + 2 trampa | d′ (detección de señales), aciertos, falsas alarmas | Friedmann & Gvion; Hautus (1995) |
| 5 | Colores (Stroop) | 32 estímulos: 12 neutros, 8 congruentes, 12 incongruentes | interferencia, facilitación, precisión | Protopapas et al. (2007) |
| 6 | Números | 20 ensayos: congruente, incongruente, neutro, puntos, empate | efecto de congruencia, facilitación, interferencia | Henik & Tzelgov (1982); Ashkenazi et al. (2009) |

## Puntaje
- `resultados_normados` (vista en Neon): puntaje z de cada dominio contra chicos del mismo grupo de edad
  (≤7, 8, 9, 10, 11, 12–13, 14+). Negativo = peor. `alerta_lectura` si 2 o más dominios ≤ −1,5;
  `alerta_numerica` aparte. `norma_provisoria` mientras el grupo tenga menos de 20 chicos.
- `puntaje_legacy`: fórmula de V4 aplicada a los datos v2, solo como referencia histórica.
- Fonix es un **cribado**, no un diagnóstico.

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
