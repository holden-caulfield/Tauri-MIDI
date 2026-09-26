# editor-de-workflow Specification

## Purpose
Define el tab Workflow: un editor visual donde la persona usuaria arma, sin
escribir código, el flujo que siguen los mensajes MIDI. Ubica cajas en un lienzo, las
conecta entre sí y configura cada una desde la misma pantalla.

## Requirements

### Requirement: El tab Workflow tiene lienzo, barra de herramientas y panel de configuración

El panel del tab Workflow SHALL mostrar a la vez tres cosas: un lienzo donde
están las cajas del flujo y sus conexiones, una barra de herramientas con las
cajas que se pueden agregar y un panel con la configuración de la caja
seleccionada. Cada caja SHALL mostrar su nombre y un ícono propio de su tipo,
tanto en el lienzo como en la barra.

#### Scenario: Partes del tab

- **WHEN** la persona usuaria activa el tab "Workflow"
- **THEN** ve el lienzo, la barra de herramientas y el panel de configuración

#### Scenario: Cajas con ícono

- **WHEN** hay una caja en el lienzo o en la barra
- **THEN** se ve su nombre acompañado del ícono de su tipo, y dos cajas de
  tipos distintos tienen íconos distintos

### Requirement: El flujo arranca con un único trigger conectado a un Emitir

Al abrir la aplicación, el lienzo SHALL contener exactamente dos cajas: el
trigger "Mensaje MIDI recibido" y una caja **Emitir**, con la salida del
trigger conectada a la entrada del Emitir, de modo que el flujo por defecto deja
pasar todo sin cambios. Esa caja Emitir y su conexión SHALL ser como cualquier
otra: se pueden mover y borrar.

El trigger SHALL tener solo un conector de salida. No SHALL poder borrarse, y
no SHALL poder agregarse otro: la barra de herramientas no lo ofrece.

#### Scenario: Lienzo inicial

- **WHEN** se abre la aplicación y se activa el tab "Workflow"
- **THEN** el lienzo tiene la caja "Mensaje MIDI recibido" conectada a una caja
  "Emitir", sin ninguna otra caja ni conexión, y las dos cajas se ven sin
  superponerse

#### Scenario: El Emitir inicial se puede borrar

- **WHEN** la persona usuaria borra la caja "Emitir" del lienzo inicial
- **THEN** queda solo el trigger, sin conexiones

#### Scenario: El trigger no se borra

- **WHEN** la persona usuaria selecciona el trigger
- **THEN** no hay ninguna acción disponible para borrarlo

#### Scenario: No se agrega un segundo trigger

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** no ofrece ningún trigger

### Requirement: La barra de herramientas agrega cajas al lienzo

La barra de herramientas SHALL ofrecer, en esta versión, exactamente dos cajas:
**Desplazar** y **Emitir**. Una caja SHALL poder agregarse arrastrándola desde
la barra hasta un punto del lienzo, y queda ubicada donde se soltó. SHALL poder
agregarse también activando su control en la barra, con el mouse o con el
teclado, y en ese caso queda en un lugar visible del lienzo. Se SHALL poder
agregar cualquier cantidad de cajas de cada tipo. Cada caja nueva arranca con
la configuración inicial de su tipo.

#### Scenario: Cajas disponibles

- **WHEN** la persona usuaria mira la barra de herramientas
- **THEN** ve "Desplazar" y "Emitir"

#### Scenario: Arrastrar al lienzo

- **WHEN** la persona usuaria arrastra "Desplazar" desde la barra y lo suelta en
  un punto del lienzo
- **THEN** aparece una caja "Desplazar" nueva en ese punto, sin conexiones

#### Scenario: Agregar con un clic o con el teclado

- **WHEN** la persona usuaria activa el control "Emitir" de la barra con un clic,
  o con Enter o barra espaciadora
- **THEN** aparece una caja "Emitir" nueva a la vista en el lienzo

#### Scenario: Varias cajas del mismo tipo

- **GIVEN** ya hay una caja "Desplazar" en el lienzo
- **WHEN** la persona usuaria agrega otra
- **THEN** hay dos cajas "Desplazar", cada una con su propia configuración

### Requirement: Las cajas se mueven dentro del lienzo

La persona usuaria SHALL poder arrastrar cualquier caja del lienzo, incluido el
trigger, para reubicarla. Las conexiones de la caja SHALL acompañarla. Mover una
caja no SHALL cambiar su configuración ni sus conexiones.

#### Scenario: Mover una caja conectada

- **GIVEN** el trigger está conectado a una caja "Emitir"
- **WHEN** la persona usuaria arrastra la caja "Emitir" a otro lugar
- **THEN** la caja queda en el lugar nuevo y la conexión sigue uniéndola al
  trigger

### Requirement: Las conexiones van de una salida a una entrada

La persona usuaria SHALL poder conectar el conector de salida de una caja con el
conector de entrada de otra. El trigger tiene solo salida, **Desplazar** tiene
entrada y salida, y **Emitir** tiene solo entrada. Una salida SHALL poder
conectarse a varias entradas, y una entrada SHALL poder recibir varias
conexiones. La interfaz SHALL rechazar, sin crearla, cualquier conexión que:

- una una caja consigo misma,
- repita una conexión que ya existe entre las mismas dos cajas, o
- cierre un ciclo, es decir, que siguiendo las conexiones desde la caja de
  destino se pueda volver a la de origen.

#### Scenario: Conectar trigger a Emitir

- **GIVEN** el trigger no está conectado a ninguna caja
- **WHEN** la persona usuaria arrastra desde la salida del trigger hasta la
  entrada de una caja "Emitir"
- **THEN** queda una conexión visible entre las dos cajas

#### Scenario: Una salida hacia varias cajas

- **GIVEN** el trigger está conectado a una caja "Emitir"
- **WHEN** la persona usuaria conecta además la salida del trigger con la
  entrada de una caja "Desplazar"
- **THEN** quedan las dos conexiones

#### Scenario: Emitir no tiene salida

- **WHEN** hay una caja "Emitir" en el lienzo
- **THEN** no tiene ningún conector de salida desde donde arrastrar una
  conexión

#### Scenario: Ciclo rechazado

- **GIVEN** la salida de la caja "Desplazar" A está conectada a la entrada de la
  caja "Desplazar" B
- **WHEN** la persona usuaria intenta conectar la salida de B con la entrada de A
- **THEN** la conexión no se crea y el flujo queda como estaba

#### Scenario: Conexión consigo misma rechazada

- **WHEN** la persona usuaria intenta conectar la salida de una caja "Desplazar"
  con su propia entrada
- **THEN** la conexión no se crea

### Requirement: Cajas y conexiones se pueden borrar

La persona usuaria SHALL poder borrar cualquier caja salvo el trigger. Al borrar
una caja SHALL desaparecer también cada conexión que entraba o salía de ella.
SHALL poder borrar también una conexión suelta, sin borrar ninguna de las dos
cajas que unía.

#### Scenario: Borrar una caja conectada

- **GIVEN** el trigger está conectado a una caja "Desplazar", y esa caja a una
  "Emitir"
- **WHEN** la persona usuaria borra la caja "Desplazar"
- **THEN** la caja desaparece junto con sus dos conexiones, y el trigger y la
  caja "Emitir" siguen en el lienzo, sin conexiones

#### Scenario: Borrar una conexión

- **GIVEN** el trigger está conectado a una caja "Emitir"
- **WHEN** la persona usuaria borra esa conexión
- **THEN** las dos cajas siguen en el lienzo, sin conexión entre ellas

### Requirement: La caja seleccionada se configura en el mismo tab

La persona usuaria SHALL poder seleccionar una caja del lienzo, y la caja
seleccionada SHALL distinguirse de las demás. El panel de configuración SHALL
mostrar el nombre de la caja seleccionada y un campo por cada parámetro de su
tipo, con el valor que tiene esa caja. Cambiar un campo SHALL cambiar la
configuración de esa caja y de ninguna otra, y el cambio SHALL regir para los
mensajes que lleguen desde ese momento. Si la caja no tiene parámetros, o no
hay ninguna seleccionada, el panel SHALL decirlo. Un campo numérico entero no
SHALL aceptar un valor que no sea entero: la caja conserva su valor anterior.

#### Scenario: Seleccionar una caja con parámetros

- **WHEN** la persona usuaria selecciona una caja "Desplazar"
- **THEN** la caja queda señalada en el lienzo y el panel muestra sus campos
  "Byte", "Desplazamiento" y "Overflow" con los valores de esa caja

#### Scenario: Cada caja tiene su configuración

- **GIVEN** hay dos cajas "Desplazar"
- **WHEN** la persona usuaria cambia el desplazamiento de una y después
  selecciona la otra
- **THEN** la segunda muestra su propio desplazamiento, sin el cambio

#### Scenario: Caja sin parámetros

- **WHEN** la persona usuaria selecciona el trigger o una caja "Emitir"
- **THEN** el panel muestra su nombre y dice que no tiene nada para configurar

#### Scenario: Nada seleccionado

- **WHEN** no hay ninguna caja seleccionada
- **THEN** el panel invita a seleccionar una caja para configurarla

#### Scenario: Valor no entero

- **GIVEN** una caja "Desplazar" tiene desplazamiento 4
- **WHEN** la persona usuaria escribe "2.5" o deja vacío el campo de
  desplazamiento
- **THEN** la caja sigue desplazando 4

#### Scenario: Borrar la caja seleccionada

- **GIVEN** una caja "Desplazar" está seleccionada
- **WHEN** la persona usuaria la borra
- **THEN** el panel pasa a mostrar que no hay ninguna caja seleccionada

### Requirement: El flujo se conserva mientras dura la sesión

El flujo armado (cajas, configuración y conexiones) SHALL conservarse al cambiar
de tab y al conectar o desconectar los puertos. Al cerrar la aplicación se
pierde: la próxima vez arranca de nuevo con el lienzo inicial (trigger
conectado a un Emitir).

#### Scenario: Cambiar de tab

- **GIVEN** la persona usuaria armó un flujo con varias cajas conectadas
- **WHEN** va al tab "Log" y vuelve al de "Workflow"
- **THEN** el flujo está igual: mismas cajas en los mismos lugares, misma
  configuración y mismas conexiones

#### Scenario: Reconectar puertos

- **GIVEN** hay un flujo armado
- **WHEN** la persona usuaria desconecta y vuelve a conectar
- **THEN** el flujo sigue igual y se aplica a los mensajes que llegan
