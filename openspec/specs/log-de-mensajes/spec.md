# log-de-mensajes Specification

## Purpose
Define qué muestra el log del tab Log: una fila por cada mensaje MIDI que llega
por el puerto de entrada, con la hora, los bytes crudos y una descripción en
castellano pensada para quien está aprendiendo el protocolo.

## Requirements

### Requirement: El log muestra los mensajes que entran, salvo el reloj

Mientras haya una conexión activa, el log SHALL agregar una fila por cada
mensaje que llega por el puerto de entrada, con la única excepción del reloj
MIDI (`F8`), que no SHALL mostrarse nunca. Los mensajes que la aplicación envía
a la salida no SHALL aparecer en el log.

#### Scenario: Nota tocada

- **GIVEN** hay una conexión activa
- **WHEN** llega `90 3C 64`
- **THEN** aparece una fila nueva en el log con ese mensaje

#### Scenario: Reloj con otros mensajes

- **GIVEN** hay una conexión activa
- **WHEN** llegan mensajes de reloj intercalados con un "Inicio" (`FA`)
- **THEN** el log muestra solo la fila del "Inicio"

### Requirement: Cada fila muestra hora, bytes y descripción

Cada fila SHALL tener tres columnas:

- la hora en que la aplicación recibió el mensaje, en formato de 24 horas con
  milisegundos (`HH:MM:SS.mmm`);
- los bytes del mensaje en hexadecimal, en mayúsculas, con dos dígitos por byte
  y separados por un espacio;
- una descripción legible del mensaje.

#### Scenario: Formato de una fila

- **WHEN** llega `90 3C 64` a las 14:05:09 con 7 milisegundos
- **THEN** la fila muestra `14:05:09.007`, `90 3C 64` y "Nota On · canal 1 ·
  nota 60 · velocidad 100"

### Requirement: Descripción de los mensajes de canal

Los mensajes de canal SHALL describirse con su tipo, el canal numerado de 1 a
16 y sus valores, separados por " · ", así:

| Status | Descripción |
|---|---|
| `8n` | Nota Off · canal · nota · velocidad |
| `9n` con velocidad 0 | Nota Off · canal · nota · velocidad 0 |
| `9n` | Nota On · canal · nota · velocidad |
| `An` | Presión Polifónica · canal · nota · presión |
| `Bn` | Cambio de Control · canal · controlador · valor |
| `Cn` | Cambio de Programa · canal · programa |
| `Dn` | Presión de Canal · canal · presión |
| `En` | Pitch Bend · canal · valor |

Los valores SHALL mostrarse en decimal. El valor de Pitch Bend SHALL ser el
número de 14 bits que forman los dos bytes de datos (de 0 a 16383).

#### Scenario: Nota On con velocidad cero

- **WHEN** llega `90 3C 00`
- **THEN** la descripción es "Nota Off · canal 1 · nota 60 · velocidad 0"

#### Scenario: Canal distinto de 1

- **WHEN** llega `B9 07 64`
- **THEN** la descripción es "Cambio de Control · canal 10 · controlador 7 ·
  valor 100"

#### Scenario: Pitch Bend centrado

- **WHEN** llega `E0 00 40`
- **THEN** la descripción es "Pitch Bend · canal 1 · valor 8192"

### Requirement: Descripción de los mensajes de sistema

Los mensajes de sistema SHALL describirse con su nombre en castellano y, entre
paréntesis, el nombre en inglés con el que figuran en la documentación de MIDI:

| Status | Descripción |
|---|---|
| `F0` | Mensaje de Sistema Exclusivo (SysEx) |
| `F1` | Cuadro de Tiempo MIDI (MTC Quarter Frame) |
| `F2` | Puntero de Posición de Canción (Song Position Pointer) |
| `F3` | Selección de Canción (Song Select) |
| `F6` | Solicitud de Afinación (Tune Request) |
| `FA` | Inicio (Start) |
| `FB` | Continuar (Continue) |
| `FC` | Detener (Stop) |
| `FE` | Sensor Activo (Active Sensing) |
| `FF` | Reset del Sistema |

Cualquier otro mensaje de sistema SHALL describirse como "Mensaje de sistema
sin reconocer" seguido de su status en hexadecimal.

#### Scenario: Mensaje de sistema conocido

- **WHEN** llega `FC`
- **THEN** la descripción es "Detener (Stop)"

#### Scenario: Mensaje de sistema no reconocido

- **WHEN** llega `F9`
- **THEN** la descripción es "Mensaje de sistema sin reconocer (0xF9)"

### Requirement: Los mensajes más nuevos van arriba

Cada fila nueva SHALL agregarse al principio de la lista, de modo que el
mensaje más reciente quede siempre arriba y el orden de las filas, de arriba
hacia abajo, sea el inverso del orden de llegada.

#### Scenario: Dos mensajes seguidos

- **WHEN** llega `90 3C 64` y después `80 3C 00`
- **THEN** la fila de `80 3C 00` queda arriba de la de `90 3C 64`

### Requirement: El log conserva los últimos 500 mensajes

El log SHALL mostrar como máximo 500 filas. Cuando llega un mensaje y ya hay
500, SHALL descartarse la fila más vieja. Las filas descartadas no SHALL poder
recuperarse.

#### Scenario: Se supera el máximo

- **GIVEN** el log tiene 500 filas
- **WHEN** llega un mensaje nuevo
- **THEN** el log sigue teniendo 500 filas: la nueva arriba de todo y sin la que
  estaba última

### Requirement: Limpiar vacía el log

El botón "Limpiar" SHALL borrar todas las filas del log, esté o no la
aplicación conectada. Los mensajes que lleguen después SHALL seguir
agregándose normalmente. Desconectar o volver a conectar no SHALL borrar el
log.

#### Scenario: Limpiar con conexión activa

- **GIVEN** hay una conexión activa y el log tiene filas
- **WHEN** la persona usuaria presiona "Limpiar" y después llega `90 3C 64`
- **THEN** el log queda con una sola fila, la de `90 3C 64`

#### Scenario: Desconectar no borra el log

- **GIVEN** el log tiene filas
- **WHEN** la persona usuaria desconecta y vuelve a conectar
- **THEN** las filas anteriores siguen en el log
