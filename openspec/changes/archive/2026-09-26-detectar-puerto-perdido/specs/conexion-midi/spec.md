# Spec Delta

## ADDED Requirements

### Requirement: Perder un puerto cierra la conexión

Mientras haya una conexión activa, la aplicación SHALL comprobar al menos una
vez por segundo que el puerto de entrada y el de salida siguen existiendo,
buscándolos por nombre igual que al conectar. Si alguno de los dos ya no está,
SHALL cerrar los dos puertos y quedar desconectada, y el panel de conexión
SHALL mostrar un mensaje que nombra cada puerto perdido y dice si era el de
entrada o el de salida. La aplicación no SHALL volver a conectarse sola: los
puertos elegidos se conservan, y para seguir la persona usuaria vuelve a
presionar "Conectar". La comprobación SHALL terminar al desconectar o al abrir
una conexión nueva, de modo que nunca afecte a una conexión distinta de la que
estaba vigilando.

#### Scenario: Se desenchufa la entrada

- **GIVEN** hay una conexión activa con la entrada "Teclado" y la salida "IAC
  Driver Bus 2"
- **WHEN** se desenchufa el dispositivo "Teclado"
- **THEN** en menos de dos segundos el encabezado dice "Desconectado", el panel
  de conexión muestra "Se perdió la conexión con el puerto de entrada
  'Teclado'", y un envío a la salida falla con "No hay una conexión de salida
  activa"

#### Scenario: Se desenchufa la salida

- **GIVEN** hay una conexión activa con la entrada "IAC Driver Bus 1" y la
  salida "Sintetizador"
- **WHEN** se desenchufa el dispositivo "Sintetizador"
- **THEN** en menos de dos segundos la aplicación queda desconectada, el panel
  de conexión nombra el puerto de salida "Sintetizador", y los mensajes que
  llegan por "IAC Driver Bus 1" dejan de aparecer en el log

#### Scenario: Se desenchufa un dispositivo que era entrada y salida

- **GIVEN** la entrada y la salida de la conexión activa son puertos del mismo
  dispositivo
- **WHEN** se desenchufa ese dispositivo
- **THEN** la aplicación queda desconectada y el mensaje nombra los dos
  puertos, el de entrada y el de salida

#### Scenario: Con otro tab a la vista

- **GIVEN** hay una conexión activa y el tab activo es "Log"
- **WHEN** se desenchufa uno de los dispositivos de la conexión
- **THEN** el encabezado pasa a "Desconectado" sin cambiar de tab, y al ir al
  tab "Conexión" está el mensaje que nombra el puerto perdido

#### Scenario: Volver a conectar cuando el dispositivo vuelve

- **GIVEN** la aplicación se desconectó porque se perdió el puerto de entrada
  "Teclado"
- **WHEN** se vuelve a enchufar el dispositivo y la persona usuaria presiona
  "Conectar" sin tocar los selectores
- **THEN** la conexión se abre con los mismos puertos y el mensaje anterior
  desaparece

#### Scenario: Desenchufar después de desconectar

- **GIVEN** la persona usuaria desconectó a mano una conexión con la entrada
  "Teclado"
- **WHEN** después se desenchufa "Teclado"
- **THEN** no aparece ningún mensaje y la interfaz no cambia

#### Scenario: La vigilancia no afecta a una conexión nueva

- **GIVEN** hubo una conexión con la entrada "Teclado", la persona usuaria la
  desconectó y abrió otra con "IAC Driver Bus 1" y "IAC Driver Bus 2"
- **WHEN** se desenchufa "Teclado"
- **THEN** la conexión nueva sigue activa y no aparece ningún mensaje
