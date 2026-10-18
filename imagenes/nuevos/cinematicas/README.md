# Arte de las cinemáticas de victoria

Generado con la herramienta **image_gen integrada**, usando el arte existente como referencia de identidad y estilo. Los diez PNG originales y sus prompts se conservan aquí; el juego consume los WebP sin pérdidas de `public/assets/cinematicas/`.

| Hoja | Poses |
|---|---|
| `kaiman-victoria` | Derrotado y despedida |
| `huayChivo-victoria` | Derrotado y reconocimiento |
| `huayPek-victoria` | Descanso y despedida |
| `sargazo-victoria` | Derrotado y recogida de botellas |
| `lorencillo-victoria` | Derrotado y cesión del paso |
| `temayin-emociones` | Celebración y agradecimiento |
| `temayin-aventura` | Escucha de rodillas y marcha decidida |
| `temayin-viaje` | Nado y descanso sentado |

`cubierta-chetumal.png` e `interior-tren.png` son fondos completos opacos. Las ocho hojas tienen alfa real y dos poses independientes. Los atlas describen los recortes originales sin redibujar ni alterar el arte del combate.

Para regenerar WebP, atlas y `src/data/bossVictoryArt.ts`:

```powershell
python imagenes/import_cinematic_art.py
```

Requiere Pillow. La exportación verifica igualdad de píxeles y mide cada recorte con alfa ≥ 8. El verificador `imagenes/verify_boss_cinematics.py` comprueba que los dos recortes de cada hoja conservan todos esos píxeles.

Las escenas están en `src/data/cinematics/`, registradas en `src/data/cinematics.ts`. Cada capítulo se reproduce al completar su nivel de jefe y se desbloquea en Historia con los récords existentes. El contenido no concede habilidades permanentes, glifos ni boletos pendientes de implementación.
