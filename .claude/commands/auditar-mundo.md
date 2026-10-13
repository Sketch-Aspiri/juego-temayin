---
description: Auditoría completa de un mundo (balance, bugs, cultura, QA en navegador) y plan de correcciones
argument-hint: "<número de mundo 1-7>"
---

Audita el **Mundo $ARGUMENTS** de Temayin. Lee la tabla del mundo en `AGENTS.md` §4.3 y su sección «Estado implementado», y los niveles en `src/data/levels/world$ARGUMENTS/`.

1. Lanza **en paralelo**:
   - `disenador-niveles` (solo análisis, sin editar): curva de dificultad 1→jefe, introducción→práctica→combinación→prueba, distribución de cacao y poderes, checkpoints, reglas de `balance.test.ts` que falten.
   - `cazabugs`: enemigos que caen solos, hoyos incruzables, orillas de agua cortadas, estados del jefe, monedas inalcanzables, `totalCoins`.
   - `revisor-cultural`: topónimos, consejos de Toh, leyendas, mensajes ecológicos.
   - `qa-navegador`: ejecuta el `verify_world*.py` del mundo (o `verify_bosses.py`) y revisa capturas.
2. Consolida en una tabla por nivel: `nivel · problema · gravedad · evidencia · arreglo propuesto`.
3. Propón un plan priorizado y pregunta si ejecutar `/mejorar "corregir hallazgos del mundo $ARGUMENTS"`.

No edites archivos en la auditoría. Declara qué no se pudo verificar (dificultad real, puntería, dispositivos).
