# Hanal Pixán ampliado

- Recorrido: 364 bloques, 480 s, punto de control en 180 y meta en 346.
- Sectores: flores, hamacas, columpio, tren, cenote, pelota y puentes de luces.
- Arte: 16 poses de Temayin alebrije generadas con `image_gen` integrado.
  La captura `movimientos-16-ambos-lados.png` muestra los 32 dibujos a escala de juego.
- Verificación: `python imagenes/verify_hanal_expansion.py` recorre desde el inicio
  hasta checkpoint y bandera, registra una sola finalización y revisa el mando,
  HUD y ausencia de desbordamiento a 390×844 y 844×390. No hubo errores de página.
- El recorrido usa entradas guionizadas y protege únicamente del contacto enemigo;
  saltos, colisiones, corriente y oxígeno permanecen activos. No mide dificultad humana.
- `src/engine/HanalPixan.test.ts` verifica además el recorrido desde el checkpoint,
  los dos aterrizajes de las hamacas y canastas reales en los dos aros opcionales.
- `npm run build` y `npm test` pasaron: 1889 pruebas aprobadas, con los casos omitidos
  y fallos esperados preexistentes conservados. El informe del navegador está en `informe.json`.

Original, prompt e importador: `imagenes/nuevos/personajes/temayin-hanal-movimientos.*`
y `imagenes/import_hanal_motion.py`. Atlas utilizado por el juego:
`public/assets/temporada/hanal-pixan/temayin-movimientos.webp`.
