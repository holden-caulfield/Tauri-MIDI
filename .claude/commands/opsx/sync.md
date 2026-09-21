---
name: "OPSX: Sync"
description: "Volcar las delta specs de un cambio a las specs principales"
allowed-tools: Bash(npx openspec:*)
---

Sincronizá a las specs principales las delta specs del cambio: $ARGUMENTS

Es una operación manual, el CLI no la hace solo:

1. `npx openspec status --change <nombre> --json`: tomá de
   `artifactPaths.specs.existingOutputPaths` los paths de las delta specs. Si no
   hay ninguna, decilo y pará.
2. Por cada delta spec, aplicá los cambios sobre la spec principal que
   corresponde en `openspec/specs/<capability>/spec.md`, mergeando de forma
   quirúrgica: agregar o modificar solo lo que cambia, sin pisar el archivo
   entero.
3. `npx openspec validate --specs` para verificar el resultado.

Esto **no** archiva el cambio; para eso está `/opsx:archive`.
