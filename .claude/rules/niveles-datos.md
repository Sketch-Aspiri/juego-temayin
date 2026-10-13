---
paths:
  - "src/data/**"
---

# Contenido (`src/data/`)

- Un nivel por archivo: `src/data/levels/worldN/<id>-<estación>.ts`, exportando un `LevelDef` `readonly`. Regístralo en `WORLDS` (`worlds.ts`); el orden del array define el desbloqueo y `nextLevelId`.
- **Ids publicados intocables:** no se reutilizan ni se renumeran sin nueva versión de guardado y migración (AGENTS.md §7). El id del mundo también es estable.
- El último nivel de cada mundo lleva `boss` y `['wall', arena[1] + 1]`.
- Coordenadas en bloques, 14 filas, suelo en la fila 12. Hoyos > `MAX_PLAIN_PIT` (6) con plataformas o plataformas móviles que cubran el tramo. Enemigos de suelo siempre con suelo debajo y sin nacer a ≤ 2 bloques del aterrizaje de un hoyo.
- Agua: zonas cerradas por orillas macizas con peldaños ≤ 2 bloques (usa `waterBanks.ts`); tramos sin aire ≤ 15 bloques o con `bubbles`.
- Todo nivel debe tener `totalCoins > 0`, checkpoint y salida con suelo, y un `hint` de Toh (dato real o pista de mecánica).
- Las pruebas de `levels.test.ts` recorren `ALL_LEVELS` automáticamente; no las debilites para que pasen. Si una regla de balance nueva importa, añádela como prueba (`balance.test.ts` del mundo).
- Texto visible en **español** con topónimos y acentos correctos; ante la duda cultural deja `// TODO(cultura): revisar …`.
- Atajos de enemigos en `levels/helpers.ts`: añade uno por cada enemigo nuevo.
- Los registros de contenido son `readonly`/`Readonly<Record<…>>`; no se mutan en tiempo de ejecución.
