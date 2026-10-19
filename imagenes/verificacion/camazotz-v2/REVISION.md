# Revisión del combate de Camazotz

- Build de producción correcto. Vitest: 2.036 pruebas aprobadas; 7 fallos esperados y 85 omitidas.
- Chromium completó `7-4` en 184,76 segundos simulados, recorriendo las tres fases y los seis ecos, hasta la meta. Se verificaron las cuatro escenas del desenlace y una única finalización guardada.
- Recorrido con contacto protegido y movimiento, salto y fuego reales; el controlador no resta PV al jefe. Esto verifica que el combate se puede completar con esas entradas, no mide la dificultad humana.
- Capturas de picada en vuelo, tercera picada, enjambre, viento, lluvia, seis ecos, rayos y ventanas. Revisión visual de siluetas, recortes, avisos y rayo detenido por el pilar. Vistas de 1280×900, 390×844 y 844×390.
- Ocho poses nuevas y cuatro efectos exportados sin pérdidas; igualdad RGBA verificada contra los originales. Prompts conservados en `imagenes/nuevos/mundo7/camazotz-v2-prompts.json`.
- Reproducir: servidor Vite en 5199 y `python imagenes/verify_camazotz_combat.py`. Resultado detallado en `informe.json`.
