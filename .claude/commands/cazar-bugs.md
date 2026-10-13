---
description: Caza de bugs enfocada en un área; cada hallazgo se demuestra con una prueba que falla
argument-hint: "[área: físicas | jefes | agua | niveles | store | ruta]"
---

Caza bugs en: $ARGUMENTS (si está vacío, en el diff actual).

1. Lanza en paralelo, con áreas distintas para no solaparse:
   - `cazabugs` sobre el motor/área indicada (estados, tiempo fijo, colisiones, cámara, determinismo).
   - `cazabugs` sobre los datos de niveles implicados (si el área incluye niveles o mundos).
   - `guardian-progreso` si el área toca `src/store` o ids.
2. Cada agente escribe sus pruebas en archivos `*.test.ts` junto al módulo; los hallazgos solo cuentan si la prueba falla por la razón prevista.
3. Consolida: bugs confirmados con prueba, ordenados por gravedad; hipótesis descartadas; lo que quedó sin poder comprobar.
4. Pregunta si ejecutar `/mejorar` para corregirlos (el autor de la corrección no es el cazador). Mientras no se corrijan, las pruebas que fallan deben quedar claramente identificadas: no dejes la suite en rojo sin avisar.
