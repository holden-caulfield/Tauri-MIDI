# Design

## Context

Ver proposal.md (Why). `midir` no avisa cuando un puerto desaparece: una
conexión abierta a un dispositivo desenchufado simplemente deja de recibir, y
los envíos fallan. Lo único disponible es preguntar qué puertos hay, que es lo
que ya hacen `listar_puertos_*` y `conectar`. Las conexiones viven en
`EstadoMidi` (`tauri::State`), y `cerrar_conexiones` es el único lugar que las
cierra, tanto al desconectar como al empezar a conectar y, desde el cambio
`conexion-fallida-sin-puertos-abiertos`, cuando un intento falla.

## Goals / Non-Goals

**Goals:**
- Detectar en menos de dos segundos que falta un puerto de la conexión activa,
  y dejar backend e interfaz desconectados, con un mensaje que lo explique.

**Non-Goals:**
- Reconectar solo cuando el dispositivo vuelve.
- Actualizar solos los selectores de puerto: siguen cambiando solo al abrir la
  aplicación o con "Actualizar puertos".
- Distinguir dos puertos con el mismo nombre (Hallazgo 5): se sigue
  identificando por nombre.

## Decisions

### Un hilo vigilante por conexión, en el backend

Al terminar bien `conectar`, se lanza un hilo que cada segundo pide la lista de
puertos de entrada y de salida y busca los dos nombres de la conexión. Crea sus
clientes `MidiInput`/`MidiOutput` una sola vez, al arrancar, y los reusa: la
lista de puertos que devuelven es la del sistema en ese momento.

Alternativas descartadas:
- **Vigilar desde el frontend** con un `setInterval` que llame a
  `listar_puertos_*`: suma idas y vueltas por IPC y deja la decisión de cerrar
  los puertos en el frontend, cuando es el backend el que los tiene abiertos.
- **Detectarlo por los envíos fallidos**: solo sirve para la salida y solo si
  hay tráfico; una entrada perdida no da ninguna señal.
- **Notificaciones del sistema** (CoreMIDI avisa cambios en la configuración):
  `midir` no las expone, y usarlas implicaría código propio por sistema
  operativo.

### Cada conexión tiene un número, y el vigilante solo cierra la suya

`EstadoMidi` suma un contador de conexión que `cerrar_conexiones` incrementa
cada vez que corre. El vigilante guarda el número que había cuando se lanzó y,
en cada vuelta, termina si ya cambió: eso cubre desconectar y volver a conectar
sin un canal ni una señal de parada aparte. Cuando detecta que falta un puerto,
vuelve a comprobar el número y cierra las conexiones **sin soltar el lock** del
contador, y `conectar`/`desconectar` toman ese mismo lock mientras cierran y
abren. Así un vigilante viejo nunca puede cerrar una conexión nueva que se abrió
entre que miró los puertos y que decidió cerrar.

### El aviso es un evento con el mensaje ya armado

El vigilante, después de cerrar, emite `conexion-perdida` con el texto a
mostrar. `inicializarConexion` lo escucha y hace
`actualizar({ conectado: false, mensajeConexion: mensaje })`. El texto se arma
en el backend, igual que los errores de `conectar` ("No se encontró el puerto
de …"), porque es el que sabe qué puerto faltó:

- "Se perdió la conexión con el puerto de entrada 'X'"
- "Se perdió la conexión con el puerto de salida 'Y'"
- "Se perdió la conexión con el puerto de entrada 'X' y el de salida 'Y'"

Como `mensajeConexion` ya se limpia al presionar "Conectar" o "Desconectar"
(`estado-de-la-interfaz`, "El mensaje no queda pegado"), no hace falta nada más
para que el aviso desaparezca al volver a conectar.

### Los selectores conservan la elección

Tras la pérdida, los selectores siguen mostrando los puertos elegidos. Si el
dispositivo vuelve con el mismo nombre, "Conectar" alcanza. Si no vuelve,
"Conectar" falla con "No se encontró el puerto de …", que ya explica lo que
pasa. Refrescar la lista sola, en cambio, contradiría el requirement "Los
puertos se ofrecen por nombre" y dejaría el selector sin nada elegido.

## Risks / Trade-offs

- [Si el dispositivo se desenchufa y se vuelve a enchufar en menos de un
  segundo, el vigilante no lo ve, y la conexión puede quedar muerta aunque el
  nombre exista] → poco probable en la práctica; si pasa, desconectar y
  conectar lo resuelve. Queda anotado para no confundirlo con un bug del
  vigilante.
- [Durante hasta un segundo después de la pérdida, los envíos siguen fallando
  solo en la consola] → aceptable: es la ventana de detección elegida.
- [Un hilo más y un lock compartido entre comandos y vigilante] → el vigilante
  toma el lock solo para comparar el número y, si hace falta, cerrar; nunca
  mientras pide la lista de puertos, así que no demora a `conectar` ni a
  `desconectar`.
