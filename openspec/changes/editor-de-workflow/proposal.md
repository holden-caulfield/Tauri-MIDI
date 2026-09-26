# Proposal

## Why

Hoy la aplicación solo reenvía tal cual lo que entra y lo muestra en el log. El
objetivo del proyecto (ver el Roadmap de AGENTS.md) es que usuarios
semi-técnicos puedan armar sus propios flujos de procesamiento de mensajes MIDI.
Programar no es una barrera, sino parte del aprendizaje: armar un flujo no
requiere escribir código, y cuando algo no alcance, crear un nodo nuevo requiere
apenas un poco. Este cambio arranca esa funcionalidad central: un editor visual
de flujos, con el primer nodo de transformación y una forma de sumar tipos de
nodo nuevos que pueda encarar alguien que recién empieza a programar.

## What Changes

- Nuevo tab **Workflow** con un editor visual de flujos, al estilo de n8n. Tiene
  un lienzo donde se ubican y conectan cajas, una barra de herramientas para
  agregarlas (arrastrándolas al lienzo o con un clic) y un panel donde se
  configura la caja seleccionada.
- El lienzo arranca con un único **trigger**, "Mensaje MIDI recibido", que no se
  puede borrar ni duplicar, ya conectado a un **Emitir** que sí se puede borrar.
  Así, el flujo por defecto se comporta como el pass-through de hoy. La barra
  ofrece dos cajas: **Desplazar** (tiene entrada y salida) y **Emitir** (solo
  tiene entrada y cierra el flujo mandando el mensaje al puerto de salida).
- Nodo **Desplazar**: suma o resta un valor entero a uno de los tres bytes del
  mensaje (status, datos 1 o datos 2). Con *overflow* activado el valor pega la
  vuelta dentro del rango; si no, se queda en el extremo. Si el mensaje no tiene
  ese byte, pasa sin cambios. La aritmética respeta el *leading bit* (el bit más
  significativo), que en MIDI es fijo: vale 0 en los bytes de datos y 1 en el de
  status. Por eso, aunque sean bytes, el rango de datos es 0–127 y el de status
  es 128–255, y el tope o la vuelta del overflow se calculan dentro de ese
  rango. Por ejemplo, para transponer una nota se desplaza el byte de
  **datos 1** (el número de nota): +4 sube una tercera mayor.
- El pass-through fijo se reemplaza por el workflow: todo mensaje que llega
  entra por el trigger y solo sale al puerto lo que llega a un **Emitir**. Con
  el flujo por defecto (trigger → Emitir) el resultado es el mismo que hoy. Si la
  persona usuaria borra ese Emitir y no conecta otro, no sale nada.
- Los mensajes de reloj MIDI (*Timing Clock*, `0xF8`) no entran al workflow:
  el backend los sigue reenviando directo a la salida, como hoy.
- El workflow se ejecuta en el frontend. El backend manda al frontend cada
  mensaje que llega (como ya lo hace para el log) y suma un comando para enviar
  un mensaje al puerto de salida.
- Cada tipo de nodo es **un archivo** en una carpeta de tipos de nodo. Ahí se
  declaran su nombre, su ícono, sus parámetros y una única función `procesar`.
  Solo los que cierran el flujo (hoy, Emitir) aclaran que no tienen salida. El
  archivo se suma con una línea a un catálogo explícito, cuyo orden es el de la
  barra de herramientas. Es requisito no negociable que ese archivo no dependa
  de la librería del lienzo.
- La iconografía de las cajas usa **Lucide**: cada tipo de nodo importa su ícono
  por nombre, y al paquete final solo llegan los íconos usados.
- El workflow vive en memoria mientras dure la sesión. No se guarda al cerrar la
  aplicación.

## Capabilities

### New Capabilities

- `editor-de-workflow`: el tab Workflow. Cubre el lienzo, la barra de
  herramientas, el trigger único, las reglas de conexión entre cajas, la
  configuración de la caja seleccionada y el borrado de cajas y conexiones.
- `ejecucion-de-workflow`: qué pasa con cada mensaje MIDI que llega. Cómo
  recorre el flujo, qué sale al puerto, qué pasa sin un Emitir, cómo se
  ramifica y el trato del reloj MIDI.
- `nodo-desplazar`: el comportamiento del nodo Desplazar (bytes, rangos,
  overflow, mensajes cortos).
- `tipos-de-nodo`: el contrato para crear un tipo de nodo nuevo. Un archivo,
  registrado en el catálogo, declara ícono y parámetros e implementa una
  función de procesamiento, sin depender de la librería del lienzo.

### Modified Capabilities

- `navegacion-por-tabs`: la barra pasa de dos a tres tabs (se suma
  **Workflow**). El contenido de cada tab incluye el del nuevo. El escenario que
  exigía que el pass-through siguiera funcionando al cambiar de tab pasa a
  exigirlo del workflow.

## Impact

- **Frontend**: nueva carpeta `src/workflow/` con el componente del tab, el
  adaptador de la librería del lienzo, el ejecutor, el catálogo de tipos y la
  subcarpeta `nodos/` con `desplazar.ts` y `emitir.ts`. `src/estado.ts` suma el
  grafo del workflow y la caja seleccionada, y `src/main.ts` suma el panel.
- **Backend** (`src-tauri/src/lib.rs`): el callback de entrada deja de reenviar
  a la salida, salvo el reloj. Se suma el comando `enviar_mensaje`.
- **Dependencias nuevas** (npm): Rete.js v2 (`rete`, `rete-area-plugin`,
  `rete-connection-plugin`, `rete-render-utils`, `@retejs/lit-plugin`), `lit`
  (lo pide el plugin de dibujado; ya incluye el `lit-html` que usamos) y
  `lucide`.
- **Arquitectura**: dos decisiones de AGENTS.md cambian. El pass-through
  deja de ser un comportamiento fijo y pasa a ser el flujo por defecto. El lienzo se suma al log como segunda
  excepción a "todo lo que se dibuja sale de `estado.ts`": la vista del lienzo
  (posiciones, zoom, arrastre) es de la librería. El conocimiento nuevo
  (carpeta de nodos, excepción del lienzo, ejecución en el frontend) tiene que
  volver a AGENTS.md antes de archivar, con aprobación de la persona usuaria.
- **AGENTS.md**: el Roadmap decía "sin necesidad de programar". Se ajusta ya a
  lo que dice el Why: un mínimo de programación es aceptable y es parte del
  aprendizaje.
- **Latencia**: cada mensaje hace un ida y vuelta Rust → webview → Rust. Suma
  algunos milisegundos y depende de que la ventana esté abierta.
