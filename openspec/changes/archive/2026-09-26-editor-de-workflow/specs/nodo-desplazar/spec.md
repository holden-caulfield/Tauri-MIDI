# Spec Delta

## Purpose

Define el nodo Desplazar, que suma o resta un valor entero a un byte del
mensaje MIDI. Es la base de transformaciones como transponer notas, cambiar de
canal o correr el número de un controlador.

## ADDED Requirements

### Requirement: Parámetros del nodo Desplazar

Una caja **Desplazar** SHALL tener tres parámetros:

- **Byte**: cuál de los tres primeros bytes del mensaje altera. Las opciones son
  "1.º (status)", "2.º (datos 1)" y "3.º (datos 2)".
- **Desplazamiento**: un número entero, positivo, negativo o cero, que se le
  suma al byte elegido.
- **Overflow**: sí o no. Dice qué pasa cuando el resultado se sale del rango del
  byte.

Una caja nueva SHALL arrancar con byte "2.º (datos 1)", desplazamiento 0 y
overflow desactivado. Con esos valores deja pasar los mensajes sin cambios.

#### Scenario: Configuración inicial

- **WHEN** la persona usuaria agrega una caja "Desplazar" y la selecciona
- **THEN** el panel muestra byte "2.º (datos 1)", desplazamiento 0 y overflow
  desactivado

### Requirement: Desplaza solo el byte elegido

La caja SHALL producir un mensaje nuevo igual al recibido, salvo por el byte
elegido, que pasa a valer el original más el desplazamiento, ajustado a su
rango según el overflow. Los demás bytes, y la cantidad de bytes, SHALL quedar
igual.

#### Scenario: Transponer una tercera mayor

- **GIVEN** byte "2.º (datos 1)", desplazamiento +4
- **WHEN** recibe `90 3C 64` (Nota On, nota 60, velocidad 100)
- **THEN** emite `90 40 64` (nota 64)

#### Scenario: Bajar la velocidad

- **GIVEN** byte "3.º (datos 2)", desplazamiento -20
- **WHEN** recibe `90 3C 64` (velocidad 100)
- **THEN** emite `90 3C 50` (velocidad 80)

#### Scenario: Cambiar de canal

- **GIVEN** byte "1.º (status)", desplazamiento +1
- **WHEN** recibe `90 3C 64` (Nota On, canal 1)
- **THEN** emite `91 3C 64` (Nota On, canal 2)

### Requirement: Rango de cada byte

En MIDI, el *leading bit* (el bit más significativo) de cada byte es fijo:
vale 1 en el byte de status y 0 en los bytes de datos. Por eso, aunque todos
sean bytes, la aritmética del nodo SHALL trabajar dentro del rango que deja
libre ese bit, y nunca SHALL cambiarlo. El rango SHALL ser de 128 a 255 (`0x80`
a `0xFF`) para el status y de 0 a 127 (`0x00` a `0x7F`) para los datos, no de 0
a 255.

- **Sin overflow**, un resultado mayor que el máximo SHALL quedar en el máximo, y
  uno menor que el mínimo SHALL quedar en el mínimo.
- **Con overflow**, el resultado SHALL pegar la vuelta: lo que se pasa de un
  extremo sigue contando desde el otro, tantas vueltas como haga falta. Para los
  datos, después de 127 viene 0 y antes de 0 viene 127. Para el status, después
  de 255 viene 128 y antes de 128 viene 255.

#### Scenario: Tope sin overflow

- **GIVEN** byte "2.º (datos 1)", desplazamiento +5, sin overflow
- **WHEN** recibe un mensaje con datos 1 = 125
- **THEN** el mensaje emitido tiene datos 1 = 127

#### Scenario: Vuelta con overflow

- **GIVEN** byte "2.º (datos 1)", desplazamiento +5, con overflow
- **WHEN** recibe un mensaje con datos 1 = 125
- **THEN** el mensaje emitido tiene datos 1 = 2 (125 → 126, 127, 0, 1, 2),
  y no 130, que no es un byte de datos válido porque tendría el leading bit en 1

#### Scenario: Piso sin overflow

- **GIVEN** byte "2.º (datos 1)", desplazamiento -5, sin overflow
- **WHEN** recibe un mensaje con datos 1 = 2
- **THEN** el mensaje emitido tiene datos 1 = 0

#### Scenario: Vuelta hacia abajo con overflow

- **GIVEN** byte "2.º (datos 1)", desplazamiento -5, con overflow
- **WHEN** recibe un mensaje con datos 1 = 2
- **THEN** el mensaje emitido tiene datos 1 = 125

#### Scenario: Más de una vuelta

- **GIVEN** byte "2.º (datos 1)", desplazamiento +300, con overflow
- **WHEN** recibe un mensaje con datos 1 = 10
- **THEN** el mensaje emitido tiene datos 1 = 54 (310 menos dos vueltas de 128)

#### Scenario: Status sin overflow

- **GIVEN** byte "1.º (status)", desplazamiento +1, sin overflow
- **WHEN** recibe un mensaje con status `FF`
- **THEN** el mensaje emitido tiene status `FF`

#### Scenario: Status con overflow

- **GIVEN** byte "1.º (status)", desplazamiento +1, con overflow
- **WHEN** recibe un mensaje con status `FF`
- **THEN** el mensaje emitido tiene status `80`

### Requirement: Un mensaje sin el byte elegido pasa sin cambios

Si el mensaje recibido no tiene el byte elegido, la caja no SHALL alterarlo:
SHALL pasarlo tal cual a las cajas siguientes, sin descartarlo y sin agregarle
bytes.

#### Scenario: Presión de canal y tercer byte

- **GIVEN** byte "3.º (datos 2)", desplazamiento +10
- **WHEN** recibe `D0 40` (Presión de Canal, que tiene dos bytes)
- **THEN** emite `D0 40`

#### Scenario: Mensaje de un byte

- **GIVEN** byte "2.º (datos 1)", desplazamiento +1
- **WHEN** recibe `FA` (Inicio)
- **THEN** emite `FA`
