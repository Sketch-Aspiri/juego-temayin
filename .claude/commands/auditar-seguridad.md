---
description: Auditoría de seguridad de la SPA (persistencia, XSS, assets, dependencias, secretos)
allowed-tools: Bash(npm audit:*), Bash(npm ls:*), Bash(git log:*), Bash(git status:*)
---

Audita la seguridad del proyecto completo (o de $ARGUMENTS si se indica un área).

1. En paralelo:
   - `revisor-seguridad`: superficie completa (localStorage, sanitizadores, XSS, assets, secretos, `npm audit --omit=dev`, `vite.config.ts`, `index.html`, scripts de `imagenes/`).
   - `guardian-progreso`: robustez ante datos corruptos o malintencionados en el guardado y migraciones; pruebas que lo demuestren.
2. Consolida con severidades y distingue CONFIRMADO de PLAUSIBLE.
3. Si aparece un secreto expuesto: detente, repórtalo y recomienda rotarlo antes de seguir.
4. Entrega plan de correcciones. Para ejecutarlo: `/mejorar "corregir hallazgos de seguridad"`.
