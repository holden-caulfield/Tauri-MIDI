# Proposal

## Why

La conexión MIDI y el log existían antes de que el proyecto empezara a usar
OpenSpec, y por eso nunca se especificaron: las specs actuales solo los tocan de
costado (cómo reacciona la pantalla a la conexión, que el reloj no aparece en el
log). Qué hace la aplicación al conectar, desconectar o mostrar un mensaje está
escrito solo en el código, y cualquier cambio futuro sobre esas áreas no tiene
contra qué medirse.

## What Changes

- Se escriben dos specs nuevas que describen el comportamiento **tal como está
  hoy**, sacado de `src-tauri/src/lib.rs`, `src/conexion.ts` y `src/log.ts`.
- No cambia código, ni comportamiento, ni el protocolo de comandos y eventos con
  Tauri. Las tareas son solo de verificación: comprobar contra la aplicación
  que cada escenario describe lo que efectivamente pasa.
- Lo que al escribirlas resultó raro o discutible no se corrige acá: queda
  anotado en `design.md` (sección "Hallazgos") para decidirlo en cambios aparte.
  Las specs describen lo que la aplicación hace, no lo que debería hacer.

## Capabilities

### New Capabilities

- `conexion-midi`: qué puertos se ofrecen, cómo se abre la conexión (siempre un
  par entrada/salida, identificados por nombre), qué pasa al volver a conectar
  y al desconectar, y cómo se envían mensajes a la salida.
- `log-de-mensajes`: qué mensajes muestra el log, qué dice cada fila (hora,
  bytes y descripción legible), en qué orden aparecen, cuántos se conservan y
  cómo se limpia.

### Modified Capabilities

<!-- Ninguna. `estado-de-la-interfaz` ya cubre la coherencia de los controles
     de conexión, la lista de puertos y los errores al conectar;
     `ejecucion-de-workflow` cubre el reenvío del reloj y que el log muestra lo
     que entra; `navegacion-por-tabs` cubre que los paneles ocultos siguen
     activos. Esas specs siguen valiendo tal cual, y las nuevas no repiten sus
     requirements: se apoyan en ellos. -->

## Impact

- **Código afectado**: ninguno.
- **Specs**: se agregan `openspec/specs/conexion-midi/spec.md` y
  `openspec/specs/log-de-mensajes/spec.md` al archivar.
- **AGENTS.md**: sin cambios; el cambio no introduce convenciones nuevas.
