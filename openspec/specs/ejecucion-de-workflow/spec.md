# ejecucion-de-workflow Specification

## Purpose
Define qué le pasa a cada mensaje MIDI que llega por el puerto de entrada
mientras hay una conexión activa. El mensaje recorre el flujo armado en el
editor, y al puerto de salida llega solo lo que el flujo manda emitir.

## Requirements

### Requirement: El flujo reemplaza al pass-through

Mientras haya una conexión activa, cada mensaje que llega por el puerto de
entrada (salvo el reloj MIDI, ver más abajo) SHALL entrar al flujo por el
trigger. Al puerto de salida SHALL llegar únicamente lo que alcanza una caja
**Emitir**. Si ningún camino desde el trigger llega a un Emitir, no SHALL
enviarse nada. La aplicación ya no reenvía los mensajes por fuera del flujo;
el pass-through de antes es el flujo por defecto (trigger → Emitir).

#### Scenario: Lienzo inicial

- **GIVEN** hay una conexión activa y el lienzo está como al abrir la
  aplicación
- **WHEN** llega cualquier mensaje
- **THEN** sale por el puerto de salida el mismo mensaje, sin cambios

#### Scenario: Sin ningún Emitir

- **GIVEN** hay una conexión activa y la persona usuaria borró el Emitir
  inicial, así que el lienzo tiene solo el trigger
- **WHEN** llega un mensaje "Nota On"
- **THEN** no sale nada por el puerto de salida

#### Scenario: Trigger conectado a Emitir

- **GIVEN** hay una conexión activa y el trigger está conectado directo a una
  caja "Emitir"
- **WHEN** llega cualquier mensaje
- **THEN** sale por el puerto de salida el mismo mensaje, sin cambios

#### Scenario: Camino que no termina en Emitir

- **GIVEN** el trigger está conectado a una caja "Desplazar" que no está
  conectada a nada
- **WHEN** llega un mensaje
- **THEN** no sale nada por el puerto de salida

### Requirement: Cada caja recibe, procesa y pasa el mensaje

Cuando un mensaje llega a una caja, la caja SHALL procesarlo según su tipo y su
configuración, y SHALL pasar el resultado a cada caja conectada a su salida.
Una caja SHALL poder también descartar el mensaje, y entonces ese camino
termina ahí. Una caja **Emitir** SHALL enviar al puerto de salida el mensaje
que recibe.

#### Scenario: Transposición

- **GIVEN** trigger → "Desplazar" (byte datos 1, desplazamiento +4, sin
  overflow) → "Emitir"
- **WHEN** llega "Nota On · canal 1 · nota 60 · velocidad 100" (`90 3C 64`)
- **THEN** sale "Nota On · canal 1 · nota 64 · velocidad 100" (`90 40 64`)

#### Scenario: Cajas encadenadas

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Desplazar" (datos 1, +3) →
  "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** sale `90 43 64`

### Requirement: Las ramas son independientes

Cuando la salida de una caja está conectada a varias entradas, cada una SHALL
recibir su propia copia del mensaje. Lo que haga una rama no SHALL afectar lo
que recibe otra. Cuando una caja recibe mensajes por varias conexiones, SHALL
procesar cada uno por separado: si un mismo mensaje llega por dos caminos a un
Emitir, sale dos veces.

#### Scenario: Original y transpuesto

- **GIVEN** la salida del trigger está conectada a una caja "Emitir" y a una
  caja "Desplazar" (datos 1, +7) que termina en otra caja "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** salen dos mensajes: `90 3C 64` y `90 43 64`

#### Scenario: Dos caminos al mismo Emitir

- **GIVEN** el trigger está conectado a dos cajas "Desplazar" (datos 1, +4 y
  +7), y las dos salidas van a la misma caja "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** salen `90 40 64` y `90 43 64`

### Requirement: Los mensajes salen en el orden en que llegaron

Los mensajes enviados al puerto de salida SHALL respetar el orden de llegada de
los mensajes que los originaron. Todo lo que produce un mensaje sale antes que
lo que produce el siguiente.

#### Scenario: Nota On y Nota Off

- **GIVEN** trigger → "Desplazar" → "Emitir"
- **WHEN** llega un "Nota On" y enseguida su "Nota Off"
- **THEN** por la salida sale primero el "Nota On" desplazado y después el
  "Nota Off" desplazado

### Requirement: Un error en una caja no frena el flujo

Si una caja falla al procesar un mensaje, o produce algo que no es un mensaje
MIDI válido (algún byte que no sea un entero entre 0 y 255, o ningún byte), ese
resultado no SHALL enviarse ni pasarse a las cajas siguientes. Las demás ramas
de ese mismo mensaje, y los mensajes que lleguen después, SHALL seguir
procesándose con normalidad.

#### Scenario: Una rama falla, la otra sigue

- **GIVEN** la salida del trigger va a una caja que falla y a una caja
  "Emitir"
- **WHEN** llega un mensaje
- **THEN** la caja "Emitir" lo envía igual, y el siguiente mensaje se procesa
  normalmente

### Requirement: El reloj MIDI no pasa por el flujo

Los mensajes de reloj MIDI (*Timing Clock*, `0xF8`) SHALL reenviarse directo al
puerto de salida, sin cambios y sin pasar por el flujo, arme lo que arme la
persona usuaria. Siguen sin mostrarse en el log.

#### Scenario: Reloj sin ningún Emitir

- **GIVEN** hay una conexión activa y el lienzo tiene solo el trigger
- **WHEN** llegan mensajes de reloj MIDI
- **THEN** salen todos por el puerto de salida, en el mismo orden

### Requirement: El log sigue mostrando lo que entra

El log SHALL seguir mostrando los mensajes que llegan por el puerto de entrada,
igual que antes de este cambio, sin importar cómo esté armado el flujo ni qué
salga por el puerto de salida.

#### Scenario: El flujo no altera el log

- **GIVEN** trigger → "Desplazar" (datos 1, +4) → "Emitir"
- **WHEN** llega `90 3C 64`
- **THEN** el log muestra `90 3C 64`, no el mensaje desplazado

### Requirement: El flujo funciona desde cualquier tab

El procesamiento SHALL funcionar igual esté o no a la vista el tab Workflow.

#### Scenario: Flujo activo con otro tab a la vista

- **GIVEN** hay una conexión activa, trigger → "Emitir", y el tab activo es
  "Log"
- **WHEN** llegan mensajes
- **THEN** salen por el puerto de salida
