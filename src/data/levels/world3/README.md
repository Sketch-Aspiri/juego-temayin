# Mundo 3 · Yucatán de las haciendas

Cinco niveles jugables, registrados entre `2-7` y `4-2`. Cada uno tiene inicio seguro, checkpoint, cacao, bandera y pirámide.

| Nivel | Recorrido |
| --- | --- |
| 3-1 Maxcanú | Grutas con cristales y antorchas, estalactitas que avisan y escorpiones que oyen saltos. |
| 3-2 Mérida | Rieles con vagonetas Decauville, ruedas de henequén, escaleras y descansos para cruzar las barrancas. |
| 3-3 Tixkokob | Hamacas que impulsan hacia tejados con cacao; los aluxes conservan su comportamiento travieso del Mundo 2. |
| 3-4 Teya | Hacienda nocturna, columpios con bombeo y liberación mediante salto, luces de referencia y rutas alternativas sobre las barrancas. |
| 3-5 Izamal | Atrio amarillo con Huay Chivo: teletransporte, aviso de embestida, fuegos fatuos, ventana de pisotón y fase nocturna. |

Las vagonetas comparten el sistema de plataformas móviles del Mundo 2. Los aluxes, ruedas y tema hacienda también se reutilizan. El progreso guardado conserva sus ids y formato; los récords propios siguen desbloqueados al insertar los niveles.

## Verificación

- `npm test`: coherencia automática de los cinco niveles y 16 casos en `src/engine/World3.test.ts` para checkpoints, progreso anterior, hamacas, columpios, fuego durante el agarre, enemigos, fuentes de luz y jefe.
- `npm run build`: TypeScript y compilación de producción.
- `imagenes/verify_world3.py`: Chromium sobre el servidor Vite de `imagenes/qa-vite.config.ts`, puerto 5198. La configuración desactiva recargas durante ediciones concurrentes.
- El navegador recorre desde el inicio hasta el checkpoint y la meta, y vence a Huay Chivo. Usa protección temporal contra daño de contacto para aislar la navegación; no teletransporta al jugador ni elimina enemigos. Esta protección solo existe en el proceso de pruebas del navegador.
- Las ventanas de daño del jefe, su segunda fase, pisotones, derrota y apertura del muro se verifican por separado sobre `World`, sin DOM.
- Capturas y resultado: `imagenes/verificacion/mundo3/recorridos.json`. El resultado final recoge cinco metas, cinco checkpoints y cero errores de JavaScript.

El recorrido asistido verifica accesibilidad y funcionamiento; no mide la dificultad del combate para las personas.
