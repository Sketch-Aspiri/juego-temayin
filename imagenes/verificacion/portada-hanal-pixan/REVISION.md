# Revisión de la portada de Hanal Pixán

- Composición revisada visualmente: [escritorio](1440x900.png), [móvil vertical](390x844.png) y [móvil apaisado](844x390.png). Incluye Temayin alebrije, ofrenda, selva, templos de Palenque y tren iluminado.
- Cinco tamaños sin desbordamiento horizontal, con imágenes cargadas, título completo y botones de al menos 44 px de alto. En pantallas bajas se permite desplazar el menú.
- Navegación real a Jugar, Historia y Ajustes, vuelta a la portada, ayuda de controles y activación mediante Enter. Contexto de navegador aislado, sin tocar el guardado del usuario.
- Movimiento reducido: personaje y luciérnagas sin animación. Sin errores de página ni respuestas HTTP de error.
- Exportación del personaje: alfa y color visible iguales al PNG original. Fondo exportado en WebP de calidad 90.
- `npm.cmd run build`: aprobado; conserva el aviso existente de tamaño de paquete.
- `npm.cmd test`: 104 archivos aprobados; 1706 pruebas aprobadas, 7 fallos esperados y 85 omitidas.

Resultados completos: [revision.json](revision.json). Generación y referencias: [guía del arte](../../nuevos/portada-hanal-pixan/README.md).
