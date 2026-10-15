# Huay Chivo · entrega del combate de Izamal

Implementación sobre la reescritura existente, sin commit ni push. Se conservan `3-5`, el orden de mundos, `Progress`, `LevelRecord` y `temayin:v3`. No se editaron los cambios ajenos de Kaimán, Huay Pek, los niveles 3-1 a 3-4, los verificadores anteriores ni los cambios concurrentes del selector y sus estilos.

## Combate y esquiva

Ocho PV, fases a cinco y dos PV. Solo `dazed` recibe daño: pisotón o dos bolas de fuego equivalen a un PV, máximo uno por ventana. Selector determinista con `makeRng`, pesos por distancia, sin repetición del ataque anterior y una embestida/teletransporte forzada tras dos ataques sin ventana.

| Ataque | Aviso | Esquiva y oportunidad |
| --- | --- | --- |
| Embestida | Raspado, ojos rojos y sonido: 0,85 / 0,70 / 0,60 s | Saltar por encima o usar refugio. Choque contra el extremo deja aturdimiento. Restos de estuco solo decorativos; los arcos permanecen intactos. |
| Teletransporte | Humo de tres cuadros, ojos y sonido en el destino: 0,90 / 0,75 / 0,65 s | Alejarse del arco con ojos. En fase 3 puede haber humo sin ojos en otro arco. Si el jugador invade el destino, se elige otro y se reinicia todo el aviso; distancia mínima de centros: 160 px. |
| Pisotón (fases 2–3) | Agachado y sonido: 0,70 / 0,60 s; sombra de aterrizaje | Salir de la sombra y saltar las ondas de 28 px. En fase 3, dos por lado con 330 px de separación permiten aterrizar entre ellas. |
| Fuegos fatuos | Invocación verde y sonido: 0,70 s; nacimiento inofensivo de 0,50 s | Orbitan antes de perseguir con giro limitado. Cambiar de dirección o apagarlos con fuego. Aportan luz; últimos 0,60 s inofensivos. Se reutiliza el sprite pintado existente. |
| Cornada corta (fases 2–3, cerca) | Se encabrita, ojos y arco de alcance; sonido y 0,60 s | Orientación fijada al avisar; cubre 80 px delante durante 0,28 s. Saltar atrás o por encima; recuperación de 0,65 s. |
| Frenesí final | Giro inofensivo y sonido de 0,60 s tras primer choque | Segunda carrera; su choque deja siempre 1,80 s de `dazed`, sin ondas ni fuegos fatuos anteriores que cierren la ventana. |

Los avisos de raspado, giro y cornada son inofensivos por contacto. Los ojos están calibrados por pose y orientación, y el señuelo nunca tiene ojos ni fuente propia de luz.

## Ajustes por fase

| Ajuste | Atardecer | Anochecer | Noche cerrada |
| --- | --- | --- | --- |
| PV | 8–6 | 5–3 | 2–1 |
| Velocidad de carrera (px/s) | 360 | 432 | 486 |
| Respiro entre ataques (s) | 1,00 | 0,75 | 0,55 |
| Aviso de carrera (s) | 0,85 | 0,70 | 0,60 |
| Aturdimiento (s) | 2,00 | 1,90 | 1,80 |
| Aviso de destino (s) | 0,90 | 0,75 | 0,65 |
| Probabilidad de segunda carrera | 0 % | 50 % | 100 % |
| Ondas por lado | 0 | 1 | 2 |
| Velocidad de ondas (px/s) | — | 340 | 380 |
| Fuegos fatuos por invocación | 2 | 3 | 3 |
| Órbita (s) | 1,60 | 1,30 | 1,10 |
| Velocidad de persecución (px/s) | 80 | 95 | 110 |
| Oscuridad: opacidad / radio | Sin máscara | 0,50 / 240 px | 0,80 / 175 px |

Constantes en `src/engine/bosses/huayChivo/tuning.ts`. Cornada: aviso 0,60 s, golpe 0,28 s y recuperación 0,65 s. Giro máximo del fuego fatuo: 140 px/s². Separación de ondas: 330 px. Rugido de transición: 2,20 s.

## Arena y luz

Antorchas con estado por partida (`World.torches`), separado de las definiciones del nivel. El rugido apaga solo las del atrio. Un proyectil real que alcanza la mecha la reenciende y se consume; cada antorcha recupera su radio de 110 px. Encenderlas es opcional: la prueba de integración vence con pisotones reales y ambas apagadas.

Se conservan refugios 65/81 en fila 9 y chiles 66/82 en fila 5. El cofre adicional 58,9 se abre y su chile se recoge tras reaparecer en el checkpoint 56, comprobado con entradas y colisiones reales. La caja del jefe mide 78 × 80 px para cruzar bajo los refugios sin el solape anterior de 6 px; el dibujo mantiene escala y apoyo. El muro permanece en 86.

El atrio usa muros amarillos/blancos intactos, arcada nocturna pintada, pavimento existente, volumen escalonado lejano de Kinich Kak Moo, estrellas, luna y sombras. Al llegar a cero PV amanece inmediatamente y se retira la oscuridad; tras la animación se abre el muro, aparece el premio y el mensaje de salida.

## Arte generado y prompts

Se usó `image_gen` integrado. Cada hoja conserva PNG original, prompt exacto y atlas; `imagenes/import_huay_chivo_art.py` mide alfa ≥ 8, exporta WebP sin pérdidas y comprueba igualdad RGBA píxel a píxel.

| Hoja | Original y prompt | Recurso servido |
| --- | --- | --- |
| Ocho acciones: raspado, agachado, salto, aterrizaje, encabritado, invocación, herido y rugido | `imagenes/nuevos/jefes/huayChivo-acciones.png` y `huayChivo-acciones.prompt.txt` | `public/assets/bosses/huayChivo-acciones.webp` |
| Humo de tres cuadros, onda de pezuña, estuco, antorcha apagada y encendida | `imagenes/nuevos/proyectiles/huayChivo-efectos.png` y `huayChivo-efectos.prompt.txt` | `public/assets/proyectiles/huayChivo-efectos.webp` |
| Arcada iluminada por luna | `imagenes/nuevos/escenarios/arcada-izamal-noche.png` y `arcada-izamal-noche.prompt.txt` | `public/assets/escenarios/arcada-izamal-noche.webp` |

`src/data/huayChivoArt.ts` centraliza recortes, escala, pezuñas y ojos. `PAINTED_ART` precarga las tres hojas. El personaje utiliza recortes aislados cuando corresponde; efectos completos, respaldos procedurales y atlas anterior conservados.

## Archivos de esta tarea

- Combate: `src/engine/bosses/huayChivo/index.ts`, `choose.ts`, `tuning.ts`, `hazards.ts`, `draw.ts`, `drawHazards.ts`, `states/blink.ts`, `states/charge.ts`.
- Pruebas del combate: `huayChivo/atriumFight.test.ts`, `choose.test.ts`, `draw.test.ts`, `hazards.test.ts`, `huayChivo.test.ts`; integración en `src/engine/World3.test.ts`.
- Antorchas: `src/engine/entities/torches.ts`, integración en `World.ts`, `entities/projectiles.ts`, comentario de la op en `level/types.ts`.
- Arena y dibujo: `src/engine/render/arenas/atrium.ts`, `chivoEffects.ts`, `scenerySprites.ts`, `lighting.ts`, `artCache.ts`; pruebas en `render/bossArena.test.ts` y `render/lighting.test.ts`.
- Datos: `src/data/huayChivoArt.ts`, `huayChivoArt.test.ts`, `scenerySprites.ts`, `bossPresentation.ts`, `levels/world3/3-5-izamal.ts`.
- Arte: los tres grupos PNG/prompt/atlas de la tabla anterior y sus tres grupos WebP/atlas en `public/assets/`.
- Herramientas: `imagenes/import_huay_chivo_art.py`, `imagenes/verify_huay_chivo_visuals.py`.
- Documentación: `AGENTS.md`, `README.md`, `src/data/levels/world3/README.md` y este informe.
- Evidencias: PNG y `revision.json` dentro de `imagenes/verificacion/huay-chivo/` (carpeta de verificación ignorada por Git según configuración existente).

## Verificación y límites

- Base antes de editar: build aprobado; 1223 pruebas aprobadas, 7 fallos esperados y 62 omitidas.
- Final: `npm run build` aprobado; `npm test`: 79 archivos, 1251 pruebas aprobadas, 7 fallos esperados y 62 omitidas. Incluye coherencia de niveles, balance, progreso y migraciones. `git diff --check` sin errores.
- TDD: primero fallaron las regresiones de cornada, antorchas y destino invadido; también las poses nuevas, recogida del chile, separación práctica de ondas y pasillo bajo refugios. La implementación final satisface esos casos.
- Revisión independiente de código y QA: aprobadas. Se corrigieron el daño durante el aviso, los ojos flotantes y las instantáneas de luz.
- Chromium: presentación, ataques por fase, destino y señuelo, antorchas apagadas/encendidas, amanecer y recorrido de inicio a checkpoint y bandera. Contextos móviles reales `is_mobile`/`has_touch` de 844 × 390 y 390 × 844: controles y pausa visibles sin solapamientos. Ver capturas `movil-horizontal.png`, `movil-vertical.png`, `recorrido-checkpoint.png`, `recorrido-final.png` y `revision.json`.
- Asistencias: escenas de ataque preparadas; recorrido con contacto protegido y fuego asistido únicamente en `dazed`. El recorrido no fuerza PV ni estados y conserva colisiones, tiempo, checkpoint y meta. Las pruebas de integración también incluyen victoria con entradas y pisotones reales, con contacto protegido.
- Rendimiento: ondas y fuegos fatuos compactan sus listas en sitio y usan colisiones escalares; luces del jefe y del renderer reutilizan buffers; noche/halos/máscara se cachean. No se crean gradientes nuevos en el atrio ni en las antorchas por fotograma. El JSON registra tiempo de actualización y pasos de simulación de la ruta. No se hizo un perfil completo de GC ni una prueba en hardware móvil físico; otras asignaciones históricas del motor global quedan fuera de esta tarea.
- No verificado: dificultad humana relativa a Kaimán/Huay Pek, puntería, latencia y sensación de controles en dispositivos físicos, ni reproducción sonora escuchada (Chromium se ejecuta silenciado). Los sonidos de aviso se disparan desde el motor. En vertical los avisos son menores por el encuadre completo de la arena.
- No se añadieron afirmaciones culturales nuevas ni `TODO(cultura)` pendientes. No se modificaron archivos de persistencia ni `worlds.ts`; sus pruebas siguen aprobadas.
