# navegacion-por-tabs Specification

## Purpose
Organiza la ventana principal en tabs, de modo que cada área de la aplicación
tenga su propio panel y la persona usuaria elija cuál mirar sin perder lo que
pasa en los demás ni de vista el estado de la conexión.

## Requirements

### Requirement: Barra de tabs al pie de la ventana

La ventana principal SHALL mostrar, al pie, una barra con un control por cada
tab disponible. En esta versión los tabs son exactamente dos: **Conexión** y
**Log**. La barra SHALL quedar siempre visible: no se desplaza con el
contenido del panel activo.

#### Scenario: La barra lista los tabs disponibles

- **WHEN** se abre la aplicación
- **THEN** al pie de la ventana se ve una barra con los controles "Conexión"
  y "Log", en ese orden

#### Scenario: La barra no se va con el scroll

- **WHEN** el contenido del panel activo es más alto que la ventana y la
  persona usuaria lo desplaza
- **THEN** la barra de tabs sigue visible al pie

### Requirement: Un solo panel visible a la vez

La aplicación SHALL mostrar únicamente el panel del tab activo y ocultar los
demás. El tab activo SHALL estar señalado visualmente en la barra. Al abrir la
aplicación, el tab activo SHALL ser **Conexión**.

#### Scenario: Estado inicial

- **WHEN** se abre la aplicación
- **THEN** el tab activo es "Conexión", se ve el panel de conexión y no se ve
  el panel de log

#### Scenario: Cambio de tab

- **WHEN** la persona usuaria activa el tab "Log"
- **THEN** se ve el panel de log, se oculta el panel de conexión y "Log" queda
  señalado como activo en la barra

#### Scenario: Volver a un tab ya visitado

- **WHEN** la persona usuaria vuelve al tab "Conexión" después de haber estado
  en "Log"
- **THEN** el panel de conexión se ve tal como estaba, con los mismos puertos
  seleccionados

### Requirement: El encabezado es común a todos los tabs

El encabezado SHALL quedar fuera de los tabs, visible siempre, y SHALL
contener el título de la aplicación y el estado de la conexión. El texto de
ayuda que guía la elección de puertos SHALL vivir dentro del tab Conexión, no
en el encabezado.

#### Scenario: El encabezado no depende del tab activo

- **WHEN** la persona usuaria cambia de tab
- **THEN** el título y el estado de conexión siguen visibles

#### Scenario: El texto de ayuda acompaña a su panel

- **WHEN** el tab activo es "Log"
- **THEN** el texto que explica cómo elegir los puertos no se ve

### Requirement: Estado de conexión siempre visible

El encabezado SHALL mostrar si la aplicación está conectada o desconectada, y
SHALL distinguir ambos estados por texto y por color. Ese indicador SHALL
reflejar solo el estado de la conexión: los mensajes de error y de validación
SHALL mostrarse en el panel de conexión, sin pisar el indicador.

#### Scenario: Cambio de estado visible desde cualquier tab

- **GIVEN** el tab activo es "Log"
- **WHEN** la conexión se establece o se corta
- **THEN** el indicador del encabezado pasa a "Conectado" o "Desconectado"
  según corresponda, sin que haga falta volver al tab "Conexión"

#### Scenario: Error al conectar

- **WHEN** falla el intento de conexión
- **THEN** el mensaje de error se ve en el panel de conexión y el indicador
  del encabezado sigue mostrando "Desconectado"

#### Scenario: Falta elegir puertos

- **WHEN** la persona usuaria presiona "Conectar" sin haber elegido puerto de
  entrada y de salida
- **THEN** el aviso se ve en el panel de conexión y el indicador del
  encabezado sigue mostrando "Desconectado"

### Requirement: Contenido de cada tab

El tab **Conexión** SHALL contener el texto de ayuda sobre la elección de
puertos, los selectores de puerto de entrada y salida, los botones de
actualizar puertos, conectar y desconectar, y la línea de mensajes de la
conexión. El tab **Log** SHALL contener el listado de
mensajes MIDI y el botón de limpiar. Ningún control SHALL cambiar su texto ni
su comportamiento respecto de la versión sin tabs.

#### Scenario: Controles de conexión

- **WHEN** el tab activo es "Conexión"
- **THEN** se ven el texto de ayuda, los dos selectores de puerto y los
  botones "Actualizar puertos", "Conectar" y "Desconectar"

#### Scenario: Controles del log

- **WHEN** el tab activo es "Log"
- **THEN** se ven el listado de mensajes MIDI y el botón "Limpiar"

### Requirement: Los paneles ocultos siguen activos

Ocultar un panel SHALL ser solo visual: su contenido y su estado se conservan,
y sigue reaccionando a lo que pasa en el backend mientras está oculto. En
particular, el log SHALL seguir recibiendo y acumulando los mensajes MIDI que
llegan mientras su tab no está a la vista, respetando el mismo tope de
mensajes en pantalla que cuando está visible.

#### Scenario: Llegan mensajes con el tab Log oculto

- **GIVEN** hay una conexión MIDI activa y el tab activo es "Conexión"
- **WHEN** llegan mensajes MIDI
- **THEN** al activar el tab "Log" esos mensajes aparecen en la lista, en el
  mismo orden que si el tab hubiera estado visible

#### Scenario: La conexión no depende del tab activo

- **GIVEN** hay una conexión MIDI activa
- **WHEN** la persona usuaria cambia de tab
- **THEN** la conexión se mantiene y el pass-through hacia el puerto de salida
  sigue funcionando

### Requirement: Los tabs son accesibles por teclado y por lectores de pantalla

Los controles de la barra SHALL ser enfocables y activables con el teclado,
SHALL distinguir visualmente cuál tiene el foco, y SHALL exponer su rol de tab
y cuál está seleccionado a las tecnologías de asistencia.

#### Scenario: Activación por teclado

- **WHEN** la persona usuaria enfoca un control de la barra con el teclado y
  lo activa con Enter o barra espaciadora
- **THEN** ese tab pasa a ser el activo

#### Scenario: Foco visible

- **WHEN** el foco del teclado llega a un control de la barra
- **THEN** ese control se distingue de los demás, incluso si no es el tab
  activo

#### Scenario: Estado expuesto

- **WHEN** hay un tab activo
- **THEN** su control se anuncia como seleccionado y los demás como no
  seleccionados
