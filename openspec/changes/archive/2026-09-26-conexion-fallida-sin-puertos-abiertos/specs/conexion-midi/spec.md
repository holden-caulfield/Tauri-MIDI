# Spec Delta

## ADDED Requirements

### Requirement: Un intento fallido no deja puertos abiertos

Si conectar falla en cualquier paso (no se encuentra alguno de los dos puertos,
o el sistema rechaza abrir alguno), la aplicación SHALL terminar con los dos
puertos cerrados: tanto los de la conexión anterior, si la había, como el que
el intento haya llegado a abrir. Después de un intento fallido la aplicación
SHALL comportarse igual que desconectada: no recibe mensajes y los envíos a la
salida fallan.

#### Scenario: Falla la entrada después de abrir la salida

- **GIVEN** la persona usuaria eligió la salida "IAC Driver Bus 2" y una
  entrada que desenchufó sin actualizar la lista
- **WHEN** presiona "Conectar"
- **THEN** la conexión falla con "No se encontró el puerto de entrada …", y el
  puerto "IAC Driver Bus 2" queda cerrado

#### Scenario: Envío después de un intento fallido

- **GIVEN** un intento de conexión acaba de fallar
- **WHEN** se pide enviar un mensaje a la salida
- **THEN** el envío falla con "No hay una conexión de salida activa" y no sale
  nada por ningún puerto

## MODIFIED Requirements

### Requirement: Conectar reemplaza cualquier conexión anterior

Antes de abrir una conexión nueva, la aplicación SHALL cerrar la que hubiera
abierta, de modo que nunca queden dos entradas recibiendo mensajes a la vez.

#### Scenario: Conectar de nuevo

- **GIVEN** hay una conexión activa
- **WHEN** se abre una conexión nueva
- **THEN** los puertos anteriores quedan cerrados antes de abrir los nuevos, y
  solo se reciben mensajes del puerto de entrada nuevo
