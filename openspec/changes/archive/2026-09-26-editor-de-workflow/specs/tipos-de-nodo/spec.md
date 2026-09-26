# Spec Delta

## Purpose

Fija el contrato para sumar tipos de nodo nuevos al editor de flujos. Tiene que
ser una tarea chica y autocontenida, que pueda encarar alguien que recién
empieza a programar: un archivo con una declaración y una función, más una
línea en el catálogo de tipos.

## ADDED Requirements

### Requirement: Un tipo de nodo es un archivo registrado en el catálogo

Cada tipo de nodo que ofrece la barra de herramientas SHALL estar definido
entero en un único archivo, dentro de una carpeta del código dedicada a los
tipos de nodo. Además SHALL existir un único catálogo de tipos, escrito a mano,
que lista los tipos disponibles: cada entrada asocia un identificador único a
un archivo de tipo. Crear el archivo y agregar su entrada al catálogo SHALL
alcanzar para que el tipo aparezca en la barra, se pueda usar en el lienzo y se
configure desde el panel, sin tocar ningún otro archivo. Sacar la entrada del
catálogo SHALL sacarlo de la aplicación.

La barra SHALL listar los tipos en el orden en que figuran en el catálogo, para
poder agruparlos con un criterio propio y no alfabético.

Un identificador repetido en el catálogo, o una entrada que no cumpla la forma
de este contrato, SHALL detectarse al compilar, antes de que la aplicación
arranque.

#### Scenario: Agregar un tipo de nodo

- **GIVEN** una persona desarrolladora copia el archivo de un tipo existente en
  la misma carpeta, con otro nombre de archivo, le cambia el nombre visible, el
  ícono, los parámetros y la función, y lo agrega al catálogo después de
  "Desplazar"
- **WHEN** vuelve a abrir la aplicación
- **THEN** la barra ofrece el tipo nuevo justo después de "Desplazar", y se
  puede agregar, conectar y configurar como cualquier otro, sin haber
  modificado otros archivos que ese y el catálogo

#### Scenario: Olvidar el catálogo

- **GIVEN** una persona desarrolladora crea el archivo de un tipo pero no lo
  agrega al catálogo
- **WHEN** abre la aplicación
- **THEN** el tipo no aparece en la barra, y la aplicación funciona igual que
  antes

#### Scenario: Error detectado al compilar

- **GIVEN** una persona desarrolladora registra en el catálogo un tipo sin
  función de procesamiento, o con el mismo identificador que otro
- **WHEN** corre el chequeo de tipos del proyecto
- **THEN** el chequeo falla y señala la entrada del catálogo o el archivo con
  el problema

#### Scenario: Los tipos de esta versión siguen el contrato

- **WHEN** se revisa la carpeta de tipos de nodo
- **THEN** "Desplazar" y "Emitir" están definidos cada uno en su propio archivo
  con la misma forma, y ninguno recibe un trato especial fuera de él

### Requirement: Qué declara un tipo de nodo

El archivo de un tipo de nodo SHALL declarar:

- el **nombre** visible en la barra y en las cajas;
- el **ícono**, tomado de la librería de íconos de la aplicación;
- si la caja **no tiene salida**. Es opcional: si no se declara, la caja tiene
  salida. Todas tienen entrada; las que no tienen salida cierran el flujo;
- la lista de **parámetros**, cada uno con una clave, una etiqueta visible, un
  tipo y un valor inicial. Los tipos de parámetro disponibles SHALL ser: número
  entero, sí/no, y una opción de una lista cerrada, cuyas opciones tienen cada
  una un valor y un texto visible;
- una única **función de procesamiento**.

El panel de configuración SHALL armarse solo a partir de la lista de parámetros
declarada: un campo por parámetro, con su etiqueta y el control que corresponde
a su tipo.

#### Scenario: Campos generados desde la declaración

- **GIVEN** un tipo de nodo declara un parámetro sí/no con etiqueta "Invertir" y
  valor inicial "no"
- **WHEN** la persona usuaria selecciona una caja nueva de ese tipo
- **THEN** el panel muestra un control sí/no con la etiqueta "Invertir",
  desactivado, sin que el archivo del tipo incluya nada de la interfaz

#### Scenario: Tipo sin salida

- **GIVEN** un tipo de nodo declara que no tiene salida
- **WHEN** se agrega una caja de ese tipo al lienzo
- **THEN** la caja tiene conector de entrada y ningún conector de salida

#### Scenario: Salida por defecto

- **GIVEN** un tipo de nodo no dice nada sobre su salida
- **WHEN** se agrega una caja de ese tipo al lienzo
- **THEN** la caja tiene conector de entrada y conector de salida

### Requirement: La función de procesamiento

La función de procesamiento SHALL recibir el mensaje MIDI que llega a la caja,
como una lista de bytes, y los valores de los parámetros de esa caja. SHALL
devolver el mensaje que la caja pasa a las siguientes, o nada, si lo descarta.
En un tipo sin salida, lo que devuelva se ignora, y la función es el lugar donde
la caja hace su efecto (por ejemplo, Emitir envía el mensaje al puerto). La
función SHALL poder modificar la lista que recibe sin afectar al mensaje que
reciben otras ramas.

#### Scenario: Descartar un mensaje

- **GIVEN** un tipo de nodo cuya función no devuelve nada para los mensajes
  "Nota Off"
- **WHEN** una caja de ese tipo, conectada a un "Emitir", recibe un "Nota Off"
- **THEN** no sale nada por esa rama

#### Scenario: Modificar la lista recibida

- **GIVEN** la salida del trigger va a una caja cuya función cambia el segundo
  byte de la lista que recibe y la devuelve, y también directo a una caja
  "Emitir"
- **WHEN** llega un mensaje
- **THEN** la caja "Emitir" conectada directo al trigger envía el mensaje
  original, sin el cambio

### Requirement: Los tipos de nodo no dependen del editor

Este requisito no es negociable: ninguna decisión de diseño SHALL
relajarlo. El archivo de un tipo de nodo no SHALL depender de la librería que
dibuja el lienzo, ni de los componentes de la interfaz, ni del estado de la pantalla.
Reemplazar la librería del lienzo no SHALL obligar a cambiar ningún archivo de
tipo de nodo.

#### Scenario: Archivo autocontenido

- **WHEN** se revisa lo que importa el archivo de un tipo de nodo
- **THEN** solo importa la definición del contrato de tipos de nodo, su ícono
  de la librería de íconos y, si hace falta, utilidades propias del
  procesamiento MIDI (por ejemplo, la que envía un mensaje al puerto de
  salida), nunca la librería del lienzo ni módulos de la interfaz

### Requirement: La carpeta de tipos de nodo explica cómo crear uno

La carpeta de tipos de nodo SHALL incluir una guía breve, en castellano,
pensada para quien recién empieza a programar. SHALL explicar qué archivo
crear, cómo registrarlo en el catálogo, qué declarar, cómo elegir un ícono, qué
recibe y qué devuelve la función de procesamiento, e incluir un ejemplo
completo.

#### Scenario: Guía disponible

- **WHEN** una persona desarrolladora abre la carpeta de tipos de nodo
- **THEN** encuentra la guía junto a los archivos de los tipos, y siguiéndola
  puede crear un tipo nuevo sin leer el código del editor
