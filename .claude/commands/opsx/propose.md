---
name: "OPSX: Propose"
description: "Crear un cambio de OpenSpec y sus artefactos de planificación"
allowed-tools: Bash(npx openspec:*)
---

Creá un cambio de OpenSpec para: $ARGUMENTS

1. `npx openspec new change <nombre-en-kebab-case>`. Si el pedido no deja claro
   el nombre o el alcance, preguntá antes de crear nada.
2. `npx openspec status --change <nombre>`: dice qué artefactos faltan y cuál es
   el próximo comando a correr.
3. Para cada artefacto pendiente,
   `npx openspec instructions <artefacto> --change <nombre>`, y escribí lo que
   pide en el path que indica. Esa instrucción es la autoridad sobre el
   contenido del artefacto.
4. Repetí 2 y 3 hasta completarlos, y cerrá con
   `npx openspec validate <nombre>`.

Esto genera artefactos de planificación, **no** código: cuando estén listos,
mostralos y pará. La implementación va con `/opsx:apply`, en un pedido aparte.

Aplican las reglas de AGENTS.md, en particular la de idioma.
