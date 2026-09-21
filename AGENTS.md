# Guía para agentes de codeo asistido

Este archivo aplica a cualquier tarea de codeo asistido (Claude Code u otro
agente) sobre este repositorio. Leelo antes de tocar código.

## Idioma

Todo el material escrito del proyecto va **en castellano**: nombres de
variables, funciones y tipos, comentarios, mensajes de commit, texto de la
interfaz, y documentación (README, este archivo, etc.). La única excepción
son identificadores técnicos que por convención van en inglés (nombres de
paquetes/crates de terceros, claves de configuración de herramientas como
`package.json` o `tauri.conf.json`, el identificador reverso del bundle).

La conversación con la persona usuaria puede ser en castellano o en inglés
indistintamente — esta regla es sobre el material del proyecto, no sobre el
chat.

## Flujo de git

Todo cambio se hace en una rama local nueva, nunca directamente sobre
`main`. Al terminar la tarea, se sube esa rama y se abre un PR contra
`main`; una vez mergeado, hay que volver a `main`, actualizar con
`git pull` y borrar la rama local (y la remota, si no se borró sola al
mergear).

## Arquitectura y convenciones técnicas

- **Backend**: Rust, en `src-tauri/`. La lógica de MIDI usa la librería
  [`midir`](https://docs.rs/midir). Las conexiones activas (entrada/salida)
  viven en `tauri::State`, protegidas con `Mutex` (la conexión de salida
  además está detrás de un `Arc` porque el callback de la conexión de
  entrada —que corre en su propio hilo— también necesita escribir en ella
  para hacer pass-through).
- **Frontend**: TypeScript sin framework (vanilla), con Vite. Se comunica
  con el backend mediante comandos (`invoke`) y eventos (`listen`) de la
  API de Tauri. No agregar un framework (React, Vue, etc.) sin que la
  persona usuaria lo pida explícitamente.
- **Comunicación Rust ↔ JS**: los argumentos de los comandos se escriben en
  `snake_case` del lado de Rust; Tauri los mapea automáticamente a
  `camelCase` del lado de JS/TS al invocarlos. Mantené esa convención en
  ambos lados en vez de forzar un nombre igual en los dos.
- **Mensajes de reloj MIDI**: por diseño, los mensajes de *Timing Clock*
  (`0xF8`) se reenvían a la salida pero se excluyen del log/eventos hacia el
  frontend (ver `es_mensaje_de_reloj` en `src-tauri/src/lib.rs`). Si se
  agregan otros mensajes de alta frecuencia (por ejemplo Active Sensing,
  `0xFE`), evaluar si corresponde el mismo tratamiento — no asumirlo
  automáticamente, confirmarlo con la persona usuaria.

## Toolchain

- El proyecto requiere una versión de Rust razonablemente reciente (alguna
  dependencia transitiva necesita `edition2024`, estabilizado en Rust 1.85).
  Si `cargo check` falla mencionando `edition2024`, correr
  `rustup update stable` antes de asumir que hay un error de código.
- Package manager de JS: `npm` (no hay `pnpm`/`yarn` en este proyecto;
  mantener consistencia y no mezclar lockfiles).

## Verificación antes de dar por terminada una tarea

- `cargo check` (desde `src-tauri/`) para el backend.
- `npx tsc --noEmit` (desde la raíz) para el frontend.
- `npm run tauri dev` para probar la app real. Tené en cuenta que abre una
  ventana nativa (no es un sitio web): para verlo, hay que ejecutarlo en la
  máquina de la persona usuaria, no alcanza con abrir la URL de Vite en un
  navegador común, ya que ese navegador no tiene el puente de IPC de Tauri
  (`invoke`/`listen` van a fallar ahí). Sirve igual para revisar visualmente
  el layout con las herramientas de navegador disponibles.
- Para probar el flujo de MIDI sin hardware físico, en macOS se puede
  habilitar el **IAC Driver** (Audio MIDI Setup → MIDI Studio) y usarlo como
  puerto de entrada y salida.

## Estilo de código

- No agregar comentarios que expliquen *qué* hace el código (los nombres ya
  lo dicen); solo comentar cuando haya una razón no obvia (una restricción
  oculta, un workaround puntual). Ver los comentarios existentes en
  `src-tauri/src/lib.rs` como referencia de tono y extensión.
- No introducir abstracciones, frameworks o configuración pensada para
  necesidades futuras que todavía no llegaron (por ejemplo, no empezar a
  diseñar el futuro editor visual de flujos de trabajo hasta que se pida
  explícitamente).

## OpenSpec

El proyecto tiene configurado [OpenSpec](https://github.com/Fission-AI/OpenSpec)
(`openspec/`) para features grandes que conviene planificar con proposal,
specs, diseño y tareas antes de implementar. Es una herramienta opcional: se
usa solo cuando la persona usuaria lo pide explícitamente (por ejemplo con
`/opsx:propose`), nunca por iniciativa propia del agente — el resto del
trabajo sigue las reglas de este archivo sin pasar por OpenSpec.

Los archivos de comandos y skills que genera la herramienta
(`.claude/commands/opsx/`, `.claude/skills/`, `.agents/skills/`) son output
vendorizado que se actualiza con `openspec update`; quedan en inglés a
propósito y no se traducen a mano. En cambio, `openspec/config.yaml` sí es
configuración propia del proyecto y va en castellano, igual que el resto del
material escrito.

Cuando un cambio hecho con OpenSpec implica decisiones de arquitectura,
convenciones técnicas nuevas, cambios de toolchain o del flujo de
verificación, ese conocimiento tiene que volver a este archivo para no
perderse en `openspec/changes/archive/`. El workflow de archive está
configurado (ver `operations.archive.guidance` en `openspec/config.yaml`)
para proponer esos cambios a `AGENTS.md` y esperar aprobación explícita antes
de aplicarlos — no debería editarlo sin consultar.

## Roadmap (contexto, no una tarea pendiente)

El objetivo a mediano plazo es agregar componentes visuales que le permitan
a usuarios semi-técnicos armar sus propios flujos de trabajo manipulando
mensajes MIDI (filtrar, transformar, remapear), sin necesidad de programar.
Todavía no arrancó ese trabajo — tenerlo en mente ayuda a no cerrar puertas
innecesariamente en el diseño actual, pero no es motivo para anticipar esa
funcionalidad ahora.
