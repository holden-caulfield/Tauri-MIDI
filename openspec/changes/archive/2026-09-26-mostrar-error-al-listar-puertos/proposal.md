# Proposal

## Why

Si falla pedir la lista de puertos al sistema, al abrir la aplicación o con
"Actualizar puertos", el error no se muestra en ningún lado: la promesa queda
sin atender y los selectores dicen "No hay puertos disponibles", como si el
sistema no tuviera ninguno. Es el Hallazgo 3 de `documentar-conexion-y-log`.

## What Changes

- Si falla pedir la lista, el panel de conexión muestra "No se pudo obtener la
  lista de puertos: …" con el error, en el mismo lugar que los errores al
  conectar.
- Los selectores quedan como estaban: misma lista y misma elección que antes
  del intento. Al abrir la aplicación siguen vacíos, pero el mensaje explica
  por qué.
- Si falla una de las dos listas (entrada o salida), se trata como una falla
  completa y no se actualiza ninguna, para no mostrar una lista nueva al lado
  de una vieja.
- Presionar "Actualizar puertos" borra el mensaje que hubiera a la vista antes
  de pedir la lista, igual que ya hacen "Conectar" y "Desconectar".

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `estado-de-la-interfaz`: se agrega el requirement "Una falla al pedir la
  lista de puertos se explica".

## Impact

- **Código afectado**: `actualizarListaDePuertos` en `src/conexion.ts`. El
  backend no cambia.
- **AGENTS.md**: sin cambios.
