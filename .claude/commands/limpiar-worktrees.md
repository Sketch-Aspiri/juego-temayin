---
description: Revisa y limpia con seguridad los worktrees de agentes en .claude/worktrees
allowed-tools: Bash(git worktree:*), Bash(git status:*), Bash(git log:*), Bash(git branch:*)
---

Limpia los worktrees de agentes **sin perder trabajo**.

!`git worktree list`

Para cada worktree bajo `.claude/worktrees/` (y cada carpeta que exista en disco aunque git ya no la registre):
1. `git -C <ruta> status --short` y `git log main..<rama> --oneline`: ¿hay cambios sin commit o commits sin integrar?
2. Clasifica: **vacío** (sin cambios ni commits propios) · **con trabajo** (hay algo que conservar) · **huérfano** (carpeta sin registro en git).
3. Muestra la tabla y **pregunta antes de borrar nada** que esté clasificado «con trabajo». Los «vacíos» se pueden retirar tras confirmación con `git worktree remove <ruta>` y `git branch -D <rama>`; los huérfanos, con `git worktree prune` y borrado de carpeta tras confirmar.
4. Al terminar muestra `git worktree list` y `git branch` para confirmar el estado.
