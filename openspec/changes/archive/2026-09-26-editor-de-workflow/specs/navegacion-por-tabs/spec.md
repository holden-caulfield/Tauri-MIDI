# Spec Delta

## MODIFIED Requirements

### Requirement: Barra de tabs al pie de la ventana

La ventana principal SHALL mostrar, al pie, una barra con un control por cada
tab disponible. En esta versión los tabs son exactamente tres: **Conexión**,
**Log** y **Workflow**. La barra SHALL quedar siempre visible: no se desplaza
con el contenido del panel activo.

#### Scenario: La barra lista los tabs disponibles

- **WHEN** se abre la aplicación
- **THEN** al pie de la ventana se ve una barra con los controles "Conexión",
  "Log" y "Workflow", en ese orden

#### Scenario: La barra no se va con el scroll

- **WHEN** el contenido del panel activo es más alto que la ventana y la
  persona usuaria lo desplaza
- **THEN** la barra de tabs sigue visible al pie

### Requirement: Contenido de cada tab

El tab **Conexión** SHALL contener el texto de ayuda sobre la elección de
puertos, los selectores de puerto de entrada y salida, los botones de
actualizar puertos, conectar y desconectar, y la línea de mensajes de la
conexión. El tab **Log** SHALL contener el listado de
mensajes MIDI y el botón de limpiar. El tab **Workflow** SHALL contener el
editor de flujos: el lienzo, la barra de herramientas y el panel de
configuración. Ningún control de los tabs Conexión y Log SHALL cambiar su texto
ni su comportamiento respecto de la versión sin tabs.

#### Scenario: Controles de conexión

- **WHEN** el tab activo es "Conexión"
- **THEN** se ven el texto de ayuda, los dos selectores de puerto y los
  botones "Actualizar puertos", "Conectar" y "Desconectar"

#### Scenario: Controles del log

- **WHEN** el tab activo es "Log"
- **THEN** se ven el listado de mensajes MIDI y el botón "Limpiar"

#### Scenario: Editor de flujos

- **WHEN** el tab activo es "Workflow"
- **THEN** se ven el lienzo, la barra de herramientas y el panel de
  configuración

### Requirement: Los paneles ocultos siguen activos

Ocultar un panel SHALL ser solo visual: su contenido y su estado se conservan,
y sigue reaccionando a lo que pasa en el backend mientras está oculto. En
particular, el log SHALL seguir recibiendo y acumulando los mensajes MIDI que
llegan mientras su tab no está a la vista, respetando el mismo tope de
mensajes en pantalla que cuando está visible. Y el flujo armado en el tab
Workflow SHALL seguir procesando los mensajes que llegan aunque su tab no esté
a la vista.

#### Scenario: Llegan mensajes con el tab Log oculto

- **GIVEN** hay una conexión MIDI activa y el tab activo es "Conexión"
- **WHEN** llegan mensajes MIDI
- **THEN** al activar el tab "Log" esos mensajes aparecen en la lista, en el
  mismo orden que si el tab hubiera estado visible

#### Scenario: La conexión no depende del tab activo

- **GIVEN** hay una conexión MIDI activa y un flujo que lleva del trigger a un
  "Emitir"
- **WHEN** la persona usuaria cambia de tab
- **THEN** la conexión se mantiene y el flujo sigue enviando mensajes al
  puerto de salida

#### Scenario: El lienzo se conserva oculto

- **GIVEN** la persona usuaria armó un flujo en el tab "Workflow"
- **WHEN** pasa a otro tab y vuelve
- **THEN** el lienzo muestra el mismo flujo, con las cajas en los mismos
  lugares
