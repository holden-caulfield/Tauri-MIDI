---
name: "OPSX: Apply"
description: "Implementar las tareas de un cambio de OpenSpec"
allowed-tools: Bash(npx openspec:*)
---

Implementá el cambio de OpenSpec: $ARGUMENTS

1. Si no viene el nombre, `npx openspec list` para ver los cambios activos; si
   hay más de uno, preguntá cuál.
2. `npx openspec instructions apply --change <nombre>`: devuelve el estado, las
   tareas pendientes y cómo encararlas.
3. Implementá las tareas en orden, marcando cada checkbox de `tasks.md` recién
   cuando esa tarea esté hecha y verificada.
4. Antes de dar por terminado, corré la verificación de AGENTS.md (`cargo check`
   desde `src-tauri/` y `npx tsc --noEmit` desde la raíz).

Si una tarea no se puede completar como está escrita, pará y consultá en vez de
reinterpretarla por tu cuenta.
