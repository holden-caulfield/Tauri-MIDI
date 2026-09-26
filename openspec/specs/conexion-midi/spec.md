# conexion-midi Specification

## Purpose
Define cómo la aplicación se conecta a los puertos MIDI del sistema: qué
puertos ofrece, cómo abre y cierra la conexión, y qué garantiza mientras la
conexión está activa. Lo que la pantalla muestra en cada caso está en
`estado-de-la-interfaz`, y qué se hace con cada mensaje que entra, en
`ejecucion-de-workflow`.

## Requirements

### Requirement: Los puertos se ofrecen por nombre

La aplicación SHALL ofrecer por separado los puertos MIDI de entrada y los de
salida que informa el sistema, cada uno identificado por el nombre que le da el
sistema. Si el sistema no informa el nombre de un puerto, SHALL mostrarse como
"Puerto desconocido". La lista SHALL leerse al abrir la aplicación y cada vez
que la persona usuaria presiona "Actualizar puertos"; no SHALL actualizarse
sola cuando se conecta o desconecta un dispositivo.

#### Scenario: Entradas y salidas separadas

- **GIVEN** el sistema tiene un dispositivo con un puerto de entrada "Teclado"
  y un puerto de salida "Sintetizador"
- **WHEN** se abre la aplicación
- **THEN** el selector de entrada ofrece "Teclado" y el de salida ofrece
  "Sintetizador"

#### Scenario: Dispositivo enchufado con la aplicación abierta

- **GIVEN** la aplicación está abierta y desconectada
- **WHEN** la persona usuaria enchufa un dispositivo MIDI nuevo
- **THEN** sus puertos no aparecen en los selectores hasta que presiona
  "Actualizar puertos"

### Requirement: Una conexión es siempre un par entrada/salida

Conectar SHALL abrir a la vez un puerto de entrada y uno de salida, los que la
persona usuaria eligió. La aplicación SHALL tener como máximo una conexión
activa: no hay forma de conectar solo una entrada, solo una salida, ni más de
un par. El puerto elegido SHALL buscarse por su nombre en el momento de
conectar; si ya no existe un puerto con ese nombre, la conexión SHALL fallar
con un mensaje que lo nombra.

#### Scenario: Conexión exitosa

- **GIVEN** la persona usuaria eligió la entrada "Teclado" y la salida
  "Sintetizador"
- **WHEN** presiona "Conectar"
- **THEN** la aplicación queda conectada y los mensajes que llegan por
  "Teclado" empiezan a recibirse

#### Scenario: El puerto desapareció antes de conectar

- **GIVEN** la persona usuaria eligió la salida "Sintetizador" y después
  desenchufó ese dispositivo sin actualizar la lista
- **WHEN** presiona "Conectar"
- **THEN** la conexión falla con el mensaje "No se encontró el puerto de salida
  'Sintetizador'"

### Requirement: Conectar reemplaza cualquier conexión anterior

Antes de abrir una conexión nueva, la aplicación SHALL cerrar la que hubiera
abierta, de modo que nunca queden dos entradas recibiendo mensajes a la vez.

#### Scenario: Conectar de nuevo

- **GIVEN** hay puertos abiertos de un intento de conexión anterior
- **WHEN** se abre una conexión nueva
- **THEN** los puertos anteriores quedan cerrados antes de abrir los nuevos, y
  solo se reciben mensajes del puerto de entrada nuevo

### Requirement: Desconectar cierra los dos puertos

Desconectar SHALL cerrar el puerto de entrada y el de salida. Después de
desconectar no SHALL recibirse ningún mensaje ni enviarse nada a la salida, y la
interfaz SHALL quedar desconectada aunque el cierre falle.

#### Scenario: Desconectar con mensajes llegando

- **GIVEN** hay una conexión activa y el dispositivo de entrada está mandando
  mensajes
- **WHEN** la persona usuaria presiona "Desconectar"
- **THEN** dejan de llegar mensajes al log y no sale nada más por el puerto de
  salida, incluido el reloj MIDI

### Requirement: Se reciben todos los tipos de mensaje

Mientras haya una conexión activa, la aplicación SHALL recibir todos los
mensajes que lleguen por el puerto de entrada, sin filtrar ninguno por tipo:
mensajes de canal, Sistema Exclusivo (SysEx), código de tiempo, reloj y Sensor
Activo incluidos.

#### Scenario: SysEx y Sensor Activo

- **GIVEN** hay una conexión activa
- **WHEN** el dispositivo de entrada manda un mensaje SysEx y mensajes de Sensor
  Activo (`FE`)
- **THEN** la aplicación los recibe y los procesa como a cualquier otro mensaje

### Requirement: Enviar a la salida requiere una conexión activa

La aplicación SHALL enviar al puerto de salida los mensajes que se le pidan,
sin modificarlos y en el orden en que se piden. Si no hay un puerto de salida
abierto, el envío SHALL fallar con el error "No hay una conexión de salida
activa" en lugar de descartarse en silencio.

#### Scenario: Envío con conexión

- **GIVEN** hay una conexión activa
- **WHEN** se pide enviar `90 3C 64` y después `80 3C 00`
- **THEN** salen por el puerto de salida exactamente esos bytes, en ese orden

#### Scenario: Envío sin conexión

- **GIVEN** la aplicación está desconectada
- **WHEN** se pide enviar un mensaje
- **THEN** el envío falla con "No hay una conexión de salida activa" y no sale
  nada
