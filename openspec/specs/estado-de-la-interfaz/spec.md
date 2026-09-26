# estado-de-la-interfaz Specification

## Purpose
Fija qué tiene que mostrar la pantalla para cada situación de la aplicación, de
modo que lo que se ve nunca se contradiga con lo que realmente está pasando:
un solo dato de verdad detrás de cada control y de cada panel, en vez de partes
de la pantalla que se actualizan por separado y pueden quedar desfasadas.

## Requirements

### Requirement: La pantalla no muestra estados contradictorios

Todos los elementos de la interfaz que dependen de una misma situación SHALL
mostrarla de forma coherente entre sí, en cualquier momento y sin importar por
qué camino se llegó a esa situación. No SHALL existir ninguna secuencia de
acciones de la persona usuaria que deje un control diciendo una cosa y otro
diciendo la contraria.

#### Scenario: Indicador y botones concuerdan

- **WHEN** se mira la ventana en cualquier momento
- **THEN** si el encabezado dice "Conectado", el botón "Desconectar" está
  disponible y el de "Conectar" no; y si dice "Desconectado", es al revés

#### Scenario: La barra de tabs y el panel visible concuerdan

- **WHEN** se mira la ventana en cualquier momento
- **THEN** el panel que se ve es exactamente el del tab señalado como activo en
  la barra, y no hay ningún otro panel a la vista

#### Scenario: Cambiar de tab no altera lo que se muestra

- **GIVEN** hay una conexión activa
- **WHEN** la persona usuaria va al tab "Log" y vuelve al de "Conexión"
- **THEN** el panel de conexión se ve exactamente como lo dejó: mismos puertos
  elegidos, mismos controles disponibles y el mismo mensaje a la vista, si lo
  había

### Requirement: Los controles de conexión siguen al estado de la conexión

Mientras no haya una conexión activa, la interfaz SHALL permitir elegir puertos,
actualizar la lista de puertos y conectar, y SHALL impedir desconectar. Mientras
haya una conexión activa, SHALL permitir únicamente desconectar: los selectores
de puerto, el botón de actualizar la lista y el de conectar SHALL quedar fuera
de alcance, para que no se pueda cambiar por debajo la conexión que está
funcionando.

#### Scenario: Sin conexión

- **WHEN** la aplicación está desconectada
- **THEN** los dos selectores de puerto, "Actualizar puertos" y "Conectar"
  están disponibles, y "Desconectar" no

#### Scenario: Con conexión

- **WHEN** la aplicación está conectada
- **THEN** "Desconectar" está disponible, y los dos selectores de puerto,
  "Actualizar puertos" y "Conectar" no

#### Scenario: Estado inicial

- **WHEN** se abre la aplicación
- **THEN** la interfaz se ve como en el escenario "Sin conexión"

### Requirement: Un intento de conexión fallido deja la interfaz utilizable

Si el intento de conectar falla, la interfaz SHALL explicarlo con un mensaje
visible en el panel de conexión y SHALL quedar como estaba antes del intento:
desconectada y con todos los controles de elección disponibles, para poder
corregir y volver a intentar sin reiniciar la aplicación.

#### Scenario: El backend rechaza la conexión

- **GIVEN** la aplicación está desconectada
- **WHEN** la persona usuaria elige dos puertos y "Conectar" falla
- **THEN** aparece un mensaje que describe el error, el encabezado sigue
  diciendo "Desconectado" y los selectores y "Conectar" siguen disponibles

#### Scenario: Falta elegir un puerto

- **WHEN** la persona usuaria presiona "Conectar" sin haber elegido puerto de
  entrada, de salida, o ninguno de los dos
- **THEN** aparece un mensaje que le pide elegir ambos puertos y no se intenta
  ninguna conexión

#### Scenario: El mensaje no queda pegado

- **GIVEN** hay un mensaje de error a la vista de un intento anterior
- **WHEN** la persona usuaria vuelve a presionar "Conectar" o presiona
  "Desconectar"
- **THEN** el mensaje anterior desaparece antes de que se muestre el resultado
  del intento nuevo

### Requirement: La lista de puertos refleja los puertos disponibles

Al abrir la aplicación y cada vez que se pida actualizar la lista, la interfaz
SHALL ofrecer los puertos de entrada y de salida que informa el sistema. Si un
puerto que estaba elegido sigue disponible, SHALL seguir elegido; si ya no está,
y al abrir la aplicación, no SHALL haber ningún puerto elegido. Siempre que no
haya nada elegido, el selector SHALL decirlo en lugar de mostrar un puerto
señalado: no puede parecer que hay uno elegido cuando no lo hay. Si no hay
ningún puerto disponible, SHALL decir eso en lugar de mostrar una lista vacía.

#### Scenario: Se conserva la elección

- **GIVEN** la persona usuaria eligió un puerto de entrada y uno de salida
- **WHEN** presiona "Actualizar puertos" y esos puertos siguen estando
- **THEN** quedan elegidos los mismos

#### Scenario: Desapareció el puerto elegido

- **GIVEN** la persona usuaria eligió un puerto de entrada
- **WHEN** presiona "Actualizar puertos" y ese puerto ya no está en la lista
- **THEN** el selector muestra los puertos que sí están, ninguno queda elegido,
  el selector lo dice, y presionar "Conectar" pide elegir los dos puertos

#### Scenario: Al abrir la aplicación no hay nada elegido

- **WHEN** se abre la aplicación y hay puertos disponibles
- **THEN** los dos selectores muestran que todavía no se eligió nada, y
  presionar "Conectar" sin tocarlos pide elegir los dos puertos

#### Scenario: No hay puertos

- **WHEN** el sistema no informa ningún puerto de entrada o ninguno de salida
- **THEN** el selector correspondiente avisa que no hay puertos disponibles, no
  ofrece ninguno para elegir, y presionar "Conectar" pide elegir los dos puertos

### Requirement: Una falla al pedir la lista de puertos se explica

Si falla pedir al sistema la lista de puertos de entrada o la de salida, al
abrir la aplicación o al presionar "Actualizar puertos", el panel de conexión
SHALL mostrar un mensaje que empieza con "No se pudo obtener la lista de
puertos:" seguido del error, en el mismo lugar que los errores al conectar. Los
selectores SHALL quedar exactamente como estaban antes del intento: la misma
lista de puertos y el mismo puerto elegido, si lo había. Si falla una sola de
las dos listas, no SHALL actualizarse ninguna. Presionar "Actualizar puertos"
SHALL borrar el mensaje que hubiera a la vista antes de pedir la lista, de modo
que un pedido exitoso no deje un error viejo en pantalla.

#### Scenario: Falla al abrir la aplicación

- **WHEN** se abre la aplicación y falla pedir la lista de puertos
- **THEN** el panel de conexión muestra "No se pudo obtener la lista de
  puertos: …" con el error, y los selectores no ofrecen ningún puerto

#### Scenario: Falla al actualizar

- **GIVEN** los selectores ofrecen los puertos "Teclado" y "Sintetizador", y la
  persona usuaria eligió "Teclado" como entrada
- **WHEN** presiona "Actualizar puertos" y falla pedir la lista
- **THEN** aparece el mensaje de error, los selectores siguen ofreciendo
  "Teclado" y "Sintetizador", y "Teclado" sigue elegido como entrada

#### Scenario: Actualizar con éxito después de una falla

- **GIVEN** a la vista está el mensaje de un pedido de la lista que falló
- **WHEN** la persona usuaria presiona "Actualizar puertos" y esta vez el pedido
  funciona
- **THEN** el mensaje desaparece y los selectores muestran la lista nueva
