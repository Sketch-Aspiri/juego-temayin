# CLAUDE.md · Temayin - La Aventura del Jaguar

@AGENTS.md

Lo anterior es la fuente de verdad del proyecto (arquitectura, convenciones, biblia del juego, hoja de ruta, definición de terminado). Si contradice al código, manda el código y se corrige el documento en el mismo cambio.

## Esenciales
- Todo texto visible, comentarios y commits en **español**. Commits convencionales (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`), un cambio lógico por commit; sin commit ni push si no se piden.
- `src/engine/` es TypeScript puro (sin React). El motor habla con React solo por `HudState`; todo dato nuevo del HUD entra en `hudKey`.
- Terminado = `npm run build` y `npm test` en verde, pruebas nuevas, revisión visual y progreso guardado intacto (AGENTS.md §10).
- Nunca reutilices ni renumeres ids de nivel publicados; cualquier cambio de `Progress`/`LevelRecord` requiere migración y pruebas.

## Equipo de agentes (`.claude/agents/`)
`planificador` · `ingeniero-motor` · `disenador-niveles` · `revisor-codigo` · `cazabugs` · `revisor-seguridad` · `revisor-ux` · `revisor-cultural` · `qa-navegador` · `guardian-progreso` · `perfilador` · `documentador`

- Antes de implementar algo no trivial, usa `planificador`. Tras escribir código, `revisor-codigo`. Quien revisa no corrige lo que revisa.
- Los agentes no se anidan: solo la conversación principal los lanza. Paralelo solo con lectura o archivos disjuntos (escritores con `isolation: "worktree"`).

## Comandos (`.claude/commands/`)
- `/mejorar <objetivo>`: bucle multiagente con límite de iteraciones.
- `/revisar`, `/cazar-bugs`, `/auditar-mundo <n>`, `/auditar-seguridad`, `/auditar-ux`.
- `/nuevo-nivel`, `/nuevo-contenido`, `/verificar`, `/sincronizar-docs`, `/limpiar-worktrees`.

## Reglas (`.claude/rules/`)
`bucles-multiagente` y `pruebas-y-commits` (globales); `motor`, `niveles-datos`, `progreso-guardado` y `ui-react` (se cargan según la ruta en la que trabajes). Protocolo de bucles, paradas y veredictos: `.claude/rules/bucles-multiagente.md`.
