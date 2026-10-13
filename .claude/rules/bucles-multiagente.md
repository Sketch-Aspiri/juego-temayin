# Bucles multiagente

Protocolo para `/mejorar`, `/revisar`, `/auditar-mundo` y cualquier flujo con varios agentes. Complementa `AGENTS.md`; no lo sustituye.

## Quién orquesta
- **Solo la conversación principal lanza agentes.** Los subagentes no se anidan: si un agente necesita a otro, lo pide en su informe y el orquestador decide.
- El orquestador no delega el juicio: lee los informes, descarta hallazgos no verificados y decide la siguiente iteración.

## Roles y permisos
| Agente | Escribe código | Escribe pruebas | Cuándo |
|---|---|---|---|
| `planificador` | no | no | Siempre antes de implementar |
| `ingeniero-motor` | sí | sí | Motor, store, UI |
| `disenador-niveles` | solo `src/data/` | sí | Niveles y balance |
| `cazabugs` | no (solo pruebas que fallan) | sí | Tras cambios del motor |
| `guardian-progreso` | no | sí | Si cambia store, ids u orden de niveles |
| `revisor-codigo`, `revisor-seguridad`, `revisor-ux`, `revisor-cultural`, `perfilador` | no | no | Revisión |
| `qa-navegador` | no | no | Verificación visual |
| `documentador` | solo `AGENTS.md`/`README.md` | no | Al final |

Quien revisa nunca corrige lo que revisa en la misma pasada: separar autor y revisor evita que el error se auto-apruebe.

## Paralelismo seguro
- Lanza en **paralelo** (una sola respuesta con varias llamadas) solo agentes de lectura, o escritores con **archivos disjuntos**.
- Escritores en paralelo: `isolation: "worktree"`; integra sus ramas en serie y resuelve conflictos tú. Al terminar, limpia con `/limpiar-worktrees`.
- Dos agentes nunca editan el mismo archivo a la vez.

## Formato común de informes
Cada revisor devuelve hallazgos `[CRITICAL|HIGH|MEDIUM|LOW] ruta:línea — problema → arreglo` y una última línea `VEREDICTO: APROBADO|ADVERTENCIA|BLOQUEADO`. El orquestador consolida con esos campos:
- **CRITICAL/HIGH** → obligan a otra iteración de corrección.
- **MEDIUM** → se corrigen si el cambio es pequeño; si no, se anotan en el resumen.
- **LOW** → opcionales.

## Condiciones de parada (cumplir cualquiera)
1. Todos los veredictos son `APROBADO` y `npm run build` + `npm test` pasan → **terminado**.
2. Se alcanzó el máximo de iteraciones (por defecto **3**) → parar y reportar lo pendiente; no seguir en silencio.
3. Una iteración no reduce el número de hallazgos CRITICAL/HIGH respecto a la anterior → parar y pedir criterio a la persona (el bucle está atascado).
4. Cualquier agente propone tocar ids publicados, `STORAGE_KEY`, la forma de `Progress` o borrar archivos fuera del alcance → **parar y preguntar**.

## Disciplina de cada iteración
- Empieza con el árbol de trabajo conocido: `git status --short`. Anota archivos ajenos a la tarea y no los toques.
- Un cambio lógico por commit (convencional, en español). No hagas commit sin que la persona lo haya pedido para ese flujo.
- Verificación antes de dar nada por hecho: `npm run build`, `npm test`; la revisión visual la hace `qa-navegador` y se declara con sus límites (contacto protegido, daño asistido).
- Informa de forma honesta: qué se verificó, qué no, qué falló.

## Higiene
- Sin archivos basura: nada de `*.tmp.test.ts`, volcados ni capturas fuera de `imagenes/verificacion/`. Lo temporal va al scratchpad de la sesión.
- Al cerrar el flujo: `git status --short` debe mostrar solo cambios intencionados.
