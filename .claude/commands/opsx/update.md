---
name: "OPSX: Update"
description: "Revisar los artefactos de un cambio de OpenSpec ya creado"
allowed-tools: Bash(npx openspec:*)
---

Actualizá los artefactos del cambio de OpenSpec: $ARGUMENTS

1. `npx openspec status --change <nombre>` para ver qué artefactos existen.
2. Para cada uno que haya que revisar,
   `npx openspec instructions <artefacto> --change <nombre>`, y editá el archivo
   existente respetando esa instrucción.
3. Mantené los artefactos coherentes entre sí: si cambia el proposal, revisá
   specs, design y tasks; si cambian las specs, revisá tasks.
4. `npx openspec validate <nombre>` al terminar.

Esto revisa la planificación, **no** implementa código.
