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
- **Organización del frontend**: un módulo por área de la interfaz
  (`conexion.ts`, `log.ts`, `tabs.ts`), cada uno con una función
  `inicializar<X>()` que busca sus propios nodos y engancha sus listeners;
  `main.ts` solo los llama desde `DOMContentLoaded`. Un módulo es dueño de un
  comportamiento, no de una región de la pantalla: `conexion.ts` maneja
  también el indicador de estado, que vive en el encabezado.
- **Tabs**: la barra está al pie y va última en `index.html`, después de los
  paneles, para que el recorrido por teclado siga el orden visual. Cada botón
  apunta con `aria-controls` al `id` de su panel y `tabs.ts` deriva todo de
  ahí: agregar un tab es agregar un botón y una `<section>`, sin tocar
  TypeScript. En el encabezado va solo lo que aplica a todos los tabs.
  Ocultar un panel es ponerle `hidden`, nunca desmontarlo — el log tiene que
  seguir acumulando mensajes mientras su tab no está a la vista.
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
  (`invoke`/`listen` van a fallar ahí). Sirve igual para revisar con las
  herramientas de navegador disponibles el layout, la conmutación de tabs,
  los atributos ARIA y el orden de tabulación. Lo que no se puede verificar
  ahí es la activación de controles con el teclado: la inyección de teclas no
  dispara la activación de un botón nativo, así que Enter y barra
  espaciadora hay que probarlos en la ventana real.
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
`/opsx:propose`), nunca por iniciativa propia del agente — el resto del trabajo
sigue las reglas de este archivo sin pasar por OpenSpec.

Es una excepción consciente a la regla de no agregar configuración para
necesidades que todavía no llegaron: se acepta porque el costo es chico (un
archivo de configuración y seis comandos de pocas líneas) y no toca el código
de la app.

El CLI es `@fission-ai/openspec`, declarado en `devDependencies` — ojo que el
paquete `openspec` a secas es otro, abandonado y sin ejecutable. Se usa con
`npx openspec`, no hace falta instalarlo aparte.

### Flujo

El CLI se conduce solo: cada comando indica cuál es el paso siguiente, y
`openspec instructions` devuelve, para cada artefacto, qué escribir y en qué
archivo. Por eso no hay instrucciones de OpenSpec copiadas al repositorio: la
fuente de verdad es el CLI, y esto es todo lo que hace falta para usarlo desde
cualquier herramienta, con o sin Claude Code.

```bash
npx openspec new change <nombre>           # crear el cambio
npx openspec status --change <nombre>      # qué falta y cuál es el próximo paso
npx openspec instructions <artefacto> --change <nombre>  # qué escribir y dónde
npx openspec instructions apply --change <nombre>        # cómo implementarlo
npx openspec validate <nombre>             # validar
npx openspec archive <nombre>              # archivar y actualizar las specs
```

En Claude Code, `.claude/commands/opsx/` son atajos escritos a mano para ese
mismo flujo (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`, `/opsx:explore`,
`/opsx:sync`, `/opsx:update`). No son output de la herramienta y `openspec
update` no los toca: si cambia el CLI, hay que actualizarlos a mano.

`openspec/config.yaml` es configuración propia del proyecto y va en castellano:
fija el idioma de los artefactos generados y agrega guía para el archivado.

### Devolver el conocimiento a este archivo

Cuando un cambio hecho con OpenSpec implica decisiones de arquitectura,
convenciones técnicas nuevas, cambios de toolchain o del flujo de verificación,
ese conocimiento tiene que volver a este archivo antes de archivar el cambio;
si no, queda enterrado en `openspec/changes/archive/`. La forma es proponerle
el diff a la persona usuaria y esperar aprobación explícita — nunca editar este
archivo por iniciativa propia.

`operations.archive.guidance` en `openspec/config.yaml` repite esa regla para
que aparezca al momento de archivar, pero el CLI la entrega marcada como
*advisory*: la regla que manda es esta, no la del archivo de configuración.

## Roadmap (contexto, no una tarea pendiente)

El objetivo a mediano plazo es agregar componentes visuales que le permitan
a usuarios semi-técnicos armar sus propios flujos de trabajo manipulando
mensajes MIDI (filtrar, transformar, remapear), sin necesidad de programar.
Todavía no arrancó ese trabajo — tenerlo en mente ayuda a no cerrar puertas
innecesariamente en el diseño actual, pero no es motivo para anticipar esa
funcionalidad ahora.
