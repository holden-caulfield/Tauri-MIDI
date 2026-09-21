---
name: "OPSX: Explore"
description: "Pensar un problema antes de proponer un cambio de OpenSpec"
allowed-tools: Bash(npx openspec:*)
---

Explorá conmigo, sin escribir nada todavía: $ARGUMENTS

Para tomar contexto:
- `npx openspec list` (cambios activos) y `npx openspec list --specs` (specs).
- `npx openspec show <spec-id> --type spec` para leer una spec en detalle.

Usá eso para entender el problema, marcar lo que no está claro y hacer las
preguntas que hagan falta. **No escribas código ni artefactos de OpenSpec**, ni
crees el cambio: cuando esté claro qué hay que hacer, decilo y ofrecé seguir con
`/opsx:propose`.
