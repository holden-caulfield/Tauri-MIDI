# Proposal

## Why

Al conectar, la aplicación abre primero el puerto de salida y después el de
entrada. Si el de entrada falla (no existe o el sistema lo rechaza), la salida
queda abierta aunque la pantalla diga "Desconectado", y se le puede seguir
enviando mensajes sin que haya conexión. Es el Hallazgo 1 del cambio
`documentar-conexion-y-log`: la pantalla y lo que realmente está abierto se
contradicen, justo lo que `estado-de-la-interfaz` pide evitar.

## What Changes

- Un intento de conexión que falla, en cualquier paso, SHALL dejar cerrados los
  dos puertos, y no solo la interfaz desconectada.
- El escenario "Conectar de nuevo" de `conexion-midi` deja de partir de
  "puertos abiertos de un intento anterior", que con este cambio ya no puede
  pasar, y pasa a partir de una conexión activa.
- No cambia nada de lo que la persona usuaria ve en la pantalla, ni los
  comandos y eventos entre el frontend y el backend.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `conexion-midi`: se agrega el requirement "Un intento fallido no deja puertos
  abiertos" y se reescribe el escenario de "Conectar reemplaza cualquier
  conexión anterior".

## Impact

- **Código afectado**: el comando `conectar` en `src-tauri/src/lib.rs`. El
  frontend no cambia.
- **AGENTS.md**: sin cambios.
