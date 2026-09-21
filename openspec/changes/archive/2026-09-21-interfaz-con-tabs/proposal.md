# Proposal

## Why

Hoy la ventana apila todo en una sola pantalla: el panel de conexión arriba y
el log de mensajes abajo. Cada sección nueva que se agregue va a seguir
alargando ese scroll. Separar la interfaz en tabs deja un lugar obvio donde
colgar lo que venga, sin cambiar lo que la aplicación hace hoy.

## What Changes

- Se agrega una barra de tabs **al pie de la ventana**, con dos tabs:
  **Conexión** (los selectores de puerto y los botones) y **Log** (los
  mensajes MIDI y el botón de limpiar). Arranca en **Conexión**.
- Solo se muestra el panel del tab activo; los demás quedan ocultos pero
  **siguen vivos**: el log sigue recibiendo y acumulando mensajes aunque su
  tab no esté a la vista.
- El **estado de conexión se muda al encabezado**, donde queda visible desde
  cualquier tab, y el **subtítulo baja al tab Conexión**, porque es guía
  específica de ese panel y no del resto de la aplicación. Como consecuencia, el texto de estado deja de cumplir doble
  función: el encabezado muestra solamente Conectado/Desconectado, y los
  mensajes de error o de validación ("Elegí un puerto…", "Error al
  conectar…") pasan a una línea propia dentro del panel de conexión.
- No cambia ninguna funcionalidad de MIDI ni el backend: es reorganización de
  la interfaz. Los controles y su comportamiento son los mismos.
- Refactor acotado del frontend, motivado por el cambio:
  - `src/main.ts` se parte en módulos por responsabilidad (`conexion.ts`,
    `log.ts`, `tabs.ts`) y `main.ts` queda solo como arranque. Hoy son ~150
    líneas que mezclan formateo, render del log, wiring de la conexión y
    bootstrap; con paneles independientes esa mezcla se vuelve incómoda.
  - Se eliminan las variables mutables a nivel de módulo (`let selectPuerto…`
    y compañía, asignadas en `DOMContentLoaded`): cada módulo busca sus
    propios nodos al inicializarse.
- No se agrega ningún framework: sigue siendo TypeScript vanilla + Vite.

### Fuera de alcance (a propósito)

- Tabs nuevos más allá de Conexión y Log.
- Recordar el último tab activo entre ejecuciones.

## Capabilities

### New Capabilities
- `navegacion-por-tabs`: cómo se organiza la ventana en tabs, cuál está
  activo, qué pasa con los paneles ocultos, qué queda fuera de los tabs y
  cómo se accede a cada uno.

### Modified Capabilities
<!-- Ninguna: no hay specs previas en el proyecto. -->

## Impact

- `index.html`: markup del encabezado con el estado, el subtítulo dentro del
  panel de conexión, la barra de tabs al pie y los paneles.
- `src/main.ts`: se parte en `src/conexion.ts`, `src/log.ts`, `src/tabs.ts` y
  un `main.ts` de arranque.
- `src/styles.css`: layout de ventana completa con barra al pie, estilos de
  la barra, del panel activo/oculto y del indicador de estado.
- Backend (`src-tauri/`): sin cambios.
