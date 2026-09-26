# Spec Delta

## ADDED Requirements

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
