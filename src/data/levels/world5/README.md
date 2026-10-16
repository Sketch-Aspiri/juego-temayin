# Mundo 5 · Riviera Maya

Cancún → Puerto Morelos → Playa del Carmen → Xcaret → Puerto Aventuras → Akumal. Se conservan los ids 5-1 a 5-6, su orden, checkpoints y progreso publicado.

## Capitán Sargazo · Akumal

La arena 78–100 está llena de agua desde la fila 3 hasta el lecho. No contiene plataformas sólidas de refugio. Tres tortugas móviles y dos respiraderos permiten administrar el aire. El checkpoint 68 permanece seco; hay poderes antes de entrar y 420 segundos de tiempo total.

| Fase | PV | Presión nueva |
|---|---|---|
| 1 | 12–10 | Salvas dirigidas y cortinas verticales con hueco fijo |
| 2 | 9–7 | Embestida a profundidad anunciada y remolino con núcleo peligroso |
| 3 | 6–4 | Lluvia escalonada de semillas |
| 4 | 3–1 | Frenesí: mayor velocidad, huecos más estrechos y más presión durante rescates |

Después de dos ataques, el Capitán enreda una tortuga cercana a él. Permanecer 0,6 s en su círculo o acertar dos disparos de fuego deshace el enredo. La tortuga envía un pulso, limpia los peligros y abre el núcleo entre 5 y 4,4 s. Tocarlo nadando desde cualquier dirección quita un PV; dos impactos de fuego/pelota también. Solo se pierde un PV por ventana. No hace falta ningún poder para ganar.

Las tortugas libres dan aire al nadar cerca; una brazada próxima recibe impulso. No tienen salud y nunca se dañan. Las advertencias fijan la zona del ataque y duran como mínimo 1,05 s; la cortina avisa durante 1,6 s. Sus semillas durante el rescate avisan otros 0,8 s antes de salir. Abrir el núcleo o golpearlo elimina peligros pendientes.

El núcleo de plástico es una amenaza fantástica. Las tortugas se rescatan y el cierre invita a cuidar el mar. No se presenta el sargazo natural como basura; quemarlo es una mecánica de ficción. El boleto y los niveles extra siguen pendientes.

## Arte y verificación

`data/sargazoArt.ts` reúne ocho poses del Capitán, cuatro de tortugas y cuatro efectos. El fondo `escenarios/akumal-submarino.webp` deja libre la zona central. Los tres PNG originales y sus prompts se conservan en `imagenes/nuevos/`, con WebP sin pérdidas y atlas en `public/assets/`. La exportación se reproduce con `imagenes/import_sargazo_art.py --help`.

`npm run build` y `npm test` verifican tipos, coherencia del nivel, selección, peligros, rescates, oxígeno, daño y un recorrido completo sin poderes. Este recorrido protege el contacto para comprobar la ruta y el aire, sin alterar PV, rescates ni estados del jefe.

Con Vite en el puerto 5197, `python imagenes/verify_sargazo_visuals.py` captura todas las fases, móvil táctil y una victoria desde checkpoint con el mismo límite de asistencia. Resultados en `imagenes/verificacion/sargazo/`. La dificultad sin protección de contacto requiere valoración humana.
