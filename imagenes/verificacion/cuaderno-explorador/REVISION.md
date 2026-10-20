# Revisión del cuaderno de explorador

Fecha: 20 de octubre de 2026.

Piloto de nueve páginas en Palenque, Campeche y Bacalar. Comprobado mediante pruebas de datos, motor sin DOM, store, presentación y Chromium con perfil aislado.

## Resultados

- Colección inicial vacía, nueve páginas pendientes sin títulos revelados y sin cargar fotografías innecesarias.
- Nueve marcas recogidas por contacto desde aproximaciones preparadas, con física y oxígeno activos. No se inyectan descubrimientos en el guardado. La marca de estromatolitos se alcanza sin dañar ningún tramo.
- Guardado inmediato, conservación al morir/reaparecer, recarga con las nueve páginas y persistencia de lectura. Las pruebas de store cubren v3 anterior, migración v2, bolsa, ajustes y boletos, saneamiento independiente, duplicados y publicaciones antiguas.
- Lectura desde pausa mantiene posición, tiempo y estado del motor. Tab conserva el foco dentro del diálogo, Escape devuelve a la pausa y únicamente Continuar reanuda. La finalización preparada muestra tres descubrimientos nuevos; consultar el cuaderno no repite la finalización.
- Filtros por categoría y lugar, combinación vacía explicada, nueve fotos locales cargadas, créditos/licencias y fuentes. Un fallo forzado de fotografía conserva texto, enlaces y créditos.
- Escritorio de 1366×900 y móviles táctiles emulados de 390×844, 320×740 y 844×390: acceso desde mapa, lectura sin desbordamiento horizontal y cierre visible. El mapa distribuye sus cuatro acciones en dos filas en móviles estrechos.
- Tres recorridos desde inicio a checkpoint y meta, y tres desde checkpoint: Palenque, Campeche y Bacalar. El piloto elige entradas probando la física en copias del mundo, con protección de contacto y sin teletransportar los recorridos. En Bacalar no se dañan estromatolitos.
- Sin errores de ejecución de JavaScript en la revisión de navegador.

## Reproducción

1. `npm run dev -- --host 127.0.0.1 --port 5196`
2. `python imagenes/verify_explorer_notebook.py`
3. `npm test` y `npm run build`

Capturas e informe JSON regenerables en `imagenes/.temp/cuaderno-explorador/`. `TEMAYIN_QA_URL` cambia el servidor. Los recorridos no evalúan dificultad humana ni sustituyen pruebas en un teléfono físico. No se añaden audio ni insignias en este piloto.
