# Mundo 3 · Yucatán de las haciendas

Cinco niveles jugables, registrados entre `2-7` y `4-2`. Cada uno tiene inicio seguro, checkpoint, cacao, bandera y pirámide.

| Nivel | Recorrido |
| --- | --- |
| 3-1 Maxcanú | Grutas con cristales y antorchas, estalactitas que avisan y escorpiones que oyen saltos. Cada estalactita cuelga de un saliente del techo con un cristal que la ilumina mientras tiembla; los hoyos son secos y no se pinta agua decorativa. El primer murciélago aparece solo, tras la primera estalactita. |
| 3-2 Mérida | Rieles con vagonetas Decauville, ruedas de henequén, escaleras y descansos. En cada barranca la vagoneta recorre 8 bloques por debajo de dos descansos (filas 8 y 7): el jinete quieto no choca con ellos y la vuelta no lo saca de la pantalla, que no retrocede. Desde el extremo se salta al descanso y de ahí a la otra orilla. Las columnas 40 y 99 frenan a las ruedas antes de cada barranca. |
| 3-3 Tixkokob | Hamacas que impulsan hacia tejados con cacao; los aluxes conservan su comportamiento travieso del Mundo 2. |
| 3-4 Teya | Hacienda nocturna, columpios con bombeo y liberación mediante salto, luces de referencia y rutas alternativas sobre las barrancas. Prueba final: una cuerda sobre el barranco 143–150; quien no se agarra cae en una red de escombro (fila 11) y salta a la orilla antes de que se hunda. Tras ella, escorpión, estalactita bajo una viga con farol y una meseta con rueda antes de la meta (190). |
| 3-5 Izamal | Atrio de Izamal: Huay Chivo de ocho PV y tres fases (8/5/2 PV), teletransporte con ojos y señuelo, embestidas, cornada corta, ondas saltables y fuegos fatuos. Antorchas reencendibles con fuego, chile tras checkpoint en 58,9 y otro sobre cada refugio (66 y 82). |

Las vagonetas comparten el sistema de plataformas móviles del Mundo 2. Los aluxes, ruedas y tema hacienda también se reutilizan. El progreso guardado conserva sus ids y formato; los récords propios siguen desbloqueados al insertar los niveles.

## Verificación

- `npm test`: coherencia automática de los cinco niveles, reglas de equilibrio de `src/data/levels/balance.test.ts` (enemigos que no caen solos, aterrizajes sin emboscadas, arena del jefe, relevos y silueta libre del jinete de vagonetas) y los casos de `src/engine/World3.test.ts` para checkpoints, progreso anterior, hamacas, columpios, fuego durante el agarre, enemigos, fuentes de luz y jefe.
- `npm run build`: TypeScript y compilación de producción.
- `imagenes/verify_world3.py`: Chromium sobre el servidor Vite de `imagenes/qa-vite.config.ts`, puerto 5198. La configuración desactiva recargas durante ediciones concurrentes.
- El navegador recorre desde el inicio hasta el checkpoint y la meta, y vence a Huay Chivo. Usa protección temporal contra daño de contacto para aislar la navegación; no teletransporta al jugador ni elimina enemigos. Esta protección solo existe en el proceso de pruebas del navegador.
- Las ventanas de daño del jefe, su segunda fase, pisotones, derrota y apertura del muro se verifican por separado sobre `World`, sin DOM.
- Capturas y resultado: `imagenes/verificacion/mundo3/recorridos.json`. El resultado final recoge cinco metas, cinco checkpoints y cero errores de JavaScript.

El recorrido asistido verifica accesibilidad y funcionamiento; no mide la dificultad del combate para las personas.

## Combate y arte de Izamal

Solo se daña al jefe en `dazed`: pisotón o dos bolas de fuego quitan un PV y cierran la ventana. Los avisos duran al menos 0,6 s y no dañan por contacto. La cornada fija su orientación al encabritarse y cubre 80 px delante; se evita saltando atrás o por encima. Los fuegos fatuos orbitan antes de perseguir con giro limitado; nacen y desaparecen sin dañar, iluminan y se apagan con fuego.

Al caer a cinco y dos PV, el rugido apaga las antorchas de la arena. Encenderlas amplía la luz y consume una bola; hacerlo es opcional. El teletransporte siempre anuncia el destino real con ojos y revalida la distancia al aparecer: si el jugador lo invade, anuncia de nuevo otro arco. En fase 3 puede mostrar humo sin ojos en un segundo arco. El segundo choque de la doble carrera deja siempre una ventana accesible desde el refugio cercano. Los restos de estuco son decorativos: no dañan ni destruyen el convento.

| Ajuste | Atardecer | Anochecer | Noche cerrada |
| --- | --- | --- | --- |
| PV de entrada | 8 | 5 | 2 |
| Embestida (px/s) | 360 | 432 | 486 |
| Aviso de carrera (s) | 0,85 | 0,70 | 0,60 |
| Aturdimiento (s) | 2,0 | 1,9 | 1,8 |
| Aviso de destino (s) | 0,90 | 0,75 | 0,65 |
| Ondas por lado | 0 | 1 | 2 (330 px entre ondas) |
| Fuegos fatuos | 2 | 3 | 3 |
| Oscuridad (opacidad/radio) | Sin máscara | 0,5 / 240 px | 0,8 / 175 px |

`data/huayChivoArt.ts` registra ocho poses nuevas con escala fija y anclas de pezuñas y ojos; también registra humo de tres cuadros, onda, estuco y antorchas. Se reutiliza el fuego fatuo pintado existente. Los originales y prompts están en `imagenes/nuevos/`; `import_huay_chivo_art.py` exporta WebP sin pérdidas y mide recortes con alfa ≥ 8. La arcada nocturna, luna, estrellas, sombras y pirámide en parallax siguen `Boss.stage`; al vencer amanece, vuelve la luz normal y se abre el muro de la columna 86.

`python imagenes/verify_huay_chivo_visuals.py` captura presentación, ataques por fase, antorchas, amanecer, móvil horizontal y vertical con contexto táctil real y recorrido completo. Guarda evidencias en `imagenes/verificacion/huay-chivo/`. La ruta protege el contacto y asiste el fuego solo durante `dazed`; las escenas de ataques se preparan. `World3.test.ts` añade una victoria con movimiento y pisotones reales sin encender antorchas; `atriumFight.test.ts` comprueba la recogida del chile tras el checkpoint y los pisotones desde ambos refugios.
