# Proposal

## Why

Si con la conexión activa se desenchufa el dispositivo de entrada o de salida,
nada lo detecta: el encabezado sigue diciendo "Conectado", no llegan mensajes y
los envíos fallan sin que se vea ningún aviso (solo quedan en la consola). Es
el Hallazgo 2 de `documentar-conexion-y-log`, y contradice "La pantalla no
muestra estados contradictorios" de `estado-de-la-interfaz`.

## What Changes

- Mientras hay una conexión activa, la aplicación revisa cada segundo si sus
  dos puertos siguen existiendo.
- Si alguno desapareció, cierra los dos, la interfaz pasa a "Desconectado" y el
  panel de conexión muestra un mensaje que dice qué puerto se perdió (entrada,
  salida o los dos).
- No hay reconexión automática: para seguir, la persona usuaria vuelve a
  conectar a mano. Los puertos elegidos quedan como estaban, así que si el
  dispositivo vuelve con el mismo nombre alcanza con presionar "Conectar".
- Se agrega un evento del backend al frontend para avisar la pérdida. Los
  comandos existentes no cambian.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `conexion-midi`: se agrega el requirement "Perder un puerto cierra la
  conexión".

## Impact

- **Backend** (`src-tauri/src/lib.rs`): un hilo que vigila los puertos de la
  conexión activa y termina al desconectar o volver a conectar; `EstadoMidi`
  suma lo necesario para saber qué conexión vigila cada hilo; evento nuevo
  `conexion-perdida`.
- **Frontend** (`src/conexion.ts`): `inicializarConexion` escucha el evento y
  actualiza el estado (`conectado` y `mensajeConexion`). No hay controles
  nuevos.
- **AGENTS.md**: la sección de arquitectura dice que "el backend no procesa
  mensajes" y describe qué vive en `tauri::State`; habrá que sumar el hilo
  vigilante y el evento nuevo. El diff se propone al archivar.
