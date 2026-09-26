# Design

## Context

Ver proposal.md (Why). `actualizarListaDePuertos` (`src/conexion.ts`) pide las
dos listas con `Promise.all` y actualiza el estado con el resultado; no tiene
`try`, así que si alguno de los dos `invoke` falla, la función rechaza y nadie
lo atiende: ni el botón "Actualizar puertos" ni `inicializarConexion` capturan
el error. El estado ya tiene `mensajeConexion`, que el panel muestra y que
"Conectar" y "Desconectar" limpian antes de empezar.

## Goals / Non-Goals

**Goals:**
- Que una falla al listar se vea en pantalla y no toque los selectores.

**Non-Goals:**
- Reintentar solo o cambiar cómo el backend arma la lista.
- Mostrar el error en los propios selectores (se descartó con la persona
  usuaria: sumaba un dato al estado y hacía perder la elección).

## Decisions

### El error se captura dentro de `actualizarListaDePuertos`

La función limpia `mensajeConexion` al empezar y envuelve el `Promise.all` en
un `try`/`catch`. En el `catch` solo escribe el mensaje, sin tocar
`puertosEntrada`, `puertosSalida` ni las elecciones. Así el comportamiento es
el mismo venga de donde venga la llamada (el botón o el arranque), y ningún
llamador tiene que acordarse de capturar nada. Es el mismo esquema que ya usa
`conectar`.

Como `Promise.all` falla si falla cualquiera de los dos pedidos y en ese caso
no llega a actualizar nada, "si falla una no se actualiza ninguna" sale solo,
sin lógica aparte.

### Mismo campo que los errores de conexión

Se reusa `mensajeConexion` en vez de sumar un campo nuevo. Los dos son
mensajes sobre el mismo panel y nunca hace falta mostrar los dos a la vez:
limpiar el mensaje al empezar cada acción deja a la vista solo el resultado de
la última.

### Cómo se verifica

La falla no se puede provocar en la aplicación real sin tocar código: en macOS
pedir la lista prácticamente no falla. En el navegador integrado, en cambio,
no existe el puente con el backend de Tauri y todo `invoke` falla:

- **Falla al actualizar**: cargar en el estado una lista y una elección desde
  la consola (ver AGENTS.md, "Verificación") y presionar "Actualizar puertos".
- **Falla al abrir**: en el navegador, `inicializarLog` falla antes (su
  `listen` tampoco tiene puente) y `inicializarConexion` nunca llega a
  correr. Se reemplaza `window.__TAURI_INTERNALS__` por uno que acepta los
  `listen` y rechaza los comandos, y se llama a `inicializarConexion` desde la
  consola: es la misma función que corre al abrir la aplicación.
- **Actualizar con éxito después de una falla**: con el mismo reemplazo,
  hacer que los comandos de listado devuelvan una lista y volver a presionar
  "Actualizar puertos".

## Risks / Trade-offs

- [Presionar "Actualizar puertos" ahora también borra un error de conexión
  que estuviera a la vista] → es lo buscado: igual que con "Conectar", el
  mensaje que queda es el de la última acción.
