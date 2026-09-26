# Design

## Context

Ver proposal.md (Why). `conectar` (`src-tauri/src/lib.rs`) cierra lo que haya
abierto, abre la salida, **la guarda en `EstadoMidi`** y recién después busca y
abre la entrada. Cada paso que puede fallar corta con `?`, así que una falla de
la entrada devuelve el error con la salida ya guardada en el estado. La salida
se guarda antes a propósito: el callback de la entrada toma el `Arc` de la
salida del estado para reenviar el reloj, y tiene que encontrarla ahí desde el
primer mensaje.

## Goals / Non-Goals

**Goals:**
- Que ningún camino de error de `conectar` deje un puerto abierto.

**Non-Goals:**
- Detectar un puerto que desaparece con la conexión activa (Hallazgo 2) o
  mostrar los errores al listar puertos (Hallazgo 3): van en cambios aparte.
- Cambiar el orden salida → entrada o la forma en que el callback accede a la
  salida.

## Decisions

### Cerrar todo ante cualquier error, en un solo lugar

El cuerpo actual de `conectar` pasa a una función auxiliar que devuelve
`Result`, y `conectar` la llama y, si falla, ejecuta `cerrar_conexiones` antes
de devolver el error. Así cubre todos los caminos de error presentes y futuros
(no encontrar un puerto, que `midir` rechace abrirlo, que falle crear el
cliente MIDI) sin repetir la limpieza en cada `?`.

Alternativas descartadas:
- **Abrir primero la entrada**: invierte el problema. Si fallara la salida
  quedaría abierta la entrada, que además manda mensajes al log con la pantalla
  diciendo "Desconectado", y el reloj no tendría adónde ir.
- **Armar las dos conexiones en variables locales y guardarlas al final**: el
  callback de la entrada necesita el `Arc` compartido de la salida desde que se
  abre, así que habría que crear el `Arc` aparte y reemplazar el del estado, lo
  que cambia la forma de `EstadoMidi` sin ganar nada frente a limpiar al fallar.
- **Limpiar en cada `map_err`/`ok_or_else`**: repite la misma línea en cada paso
  y es fácil olvidarla en el próximo que se agregue.

## Risks / Trade-offs

- [Entre abrir la salida y fallar la entrada, la salida queda abierta un
  instante] → no es observable: la entrada todavía no existe, así que no llega
  ningún mensaje que reenviar, y el frontend no envía nada mientras espera la
  respuesta de `conectar`.
- [Verificar que la salida quedó cerrada no se ve en la pantalla] → se verifica
  pidiendo un envío desde la consola del inspector después del intento
  fallido y escuchando el puerto de salida; ver tasks.md.
