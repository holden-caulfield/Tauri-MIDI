# Design

## Context

Ver proposal.md (Why). La conexión vive en el backend (`src-tauri/src/lib.rs`:
comandos `listar_puertos_entrada`, `listar_puertos_salida`, `conectar`,
`desconectar`, `enviar_mensaje`) y en `src/conexion.ts`; el log, en
`src/log.ts`, alimentado por el evento `mensaje-midi`, que ya trae la
descripción armada en Rust (`describir_mensaje`). Parte del comportamiento ya
está especificado en `estado-de-la-interfaz`, `ejecucion-de-workflow` y
`navegacion-por-tabs`.

## Goals / Non-Goals

**Goals:**
- Que las dos specs nuevas describan lo que la aplicación hace hoy, con
  escenarios verificables a mano contra la aplicación.
- Dejar registrado lo que se vio raro, para decidirlo después.

**Non-Goals:**
- Corregir o mejorar comportamiento, aunque sea obvio.
- Reorganizar las specs existentes para mover a las nuevas lo que ya cubren.

## Decisions

### Dos capabilities, siguiendo los módulos

`conexion-midi` y `log-de-mensajes` coinciden con `conexion.ts` / `log.ts` y
con los tabs. Se descartó una sola capability "midi" porque mezclaría el
transporte con la presentación, y el log podría cambiar (filtros, exportar)
sin que cambie la conexión.

### No repetir lo que ya está especificado

La coherencia de los controles, los errores al conectar y la lista de puertos
siguen en `estado-de-la-interfaz`; el reenvío del reloj, en
`ejecucion-de-workflow`. Las specs nuevas los mencionan en el Purpose y los dan
por sabidos. Repetirlos generaría dos lugares que actualizar y el riesgo de que
se contradigan.

### La tabla de descripciones entra a la spec

La descripción de cada mensaje es lo que la persona usuaria lee para aprender
el protocolo, así que es comportamiento visible y no detalle de
implementación. Por eso se especifica completa, con los textos exactos. Queda
fuera en qué lado se arma (hoy Rust): eso sí puede cambiar sin que se note.

### Lo que parece un defecto no se especifica

Cuando el comportamiento actual es claramente accidental (ver Hallazgos 1 a 3)
la spec no lo fija con un SHALL: se deja sin especificar y se anota abajo.
Fijarlo obligaría a "respetar" un bug; especificar lo contrario sería cambiar
comportamiento en un cambio que promete no hacerlo. Lo que es una decisión
discutible pero coherente (Hallazgo 4, el Sensor Activo en el log) sí se
especifica tal cual, porque es lo que la aplicación hace a propósito hoy.

## Hallazgos

Candidatos a cambios aparte. Ninguno se toca en este cambio.

1. **Conexión a medias.** `conectar` abre primero la salida y después busca la
   entrada. Si la entrada falla (no existe, o `midir` rechaza la conexión), la
   salida queda abierta en el backend mientras la interfaz dice
   "Desconectado". No se nota porque el próximo `conectar` la cierra, pero
   contradice el espíritu de "Un intento de conexión fallido deja la interfaz
   utilizable" y deja `enviar_mensaje` funcionando sin conexión.
2. **El puerto desaparece con la conexión activa.** Si se desenchufa el
   dispositivo, nada lo detecta: el encabezado sigue diciendo "Conectado" y
   los envíos fallan en silencio (el workflow no muestra el error). Choca con
   "La pantalla no muestra estados contradictorios".
3. **Falla al listar puertos.** Si `listar_puertos_*` devuelve error, la
   promesa queda sin atender: no aparece ningún mensaje y los selectores dicen
   "No hay puertos disponibles", como si el sistema no tuviera ninguno.
4. **Sensor Activo en el log.** Muchos dispositivos mandan `FE` unas tres
   veces por segundo. Con el máximo de 500 filas, en menos de tres minutos el
   log queda lleno de Sensor Activo y los mensajes interesantes se pierden. El
   reloj ya se excluye por la misma razón; podría excluirse también, o
   ofrecerse un filtro.
5. **Nombres de puerto repetidos.** Los puertos se identifican por nombre; si
   dos tienen el mismo, se conecta siempre al primero y el otro es inalcanzable.
6. **Mensajes de canal incompletos.** Si a un mensaje le faltan bytes de datos,
   la descripción los muestra como 0 (por ejemplo, "Nota On · … · velocidad 0")
   en vez de señalar que está incompleto.
7. **Menores.** `F7` (fin de SysEx) se describe como "sin reconocer"; el
   evento trae el nombre del puerto pero el log no lo muestra; la hora es la de
   recepción en la aplicación, no la marca de tiempo que da el driver.
8. **Status de sistema indefinidos, inalcanzables en macOS.** Visto al
   verificar: el sistema descarta `F4`, `F9` y `FD` antes de que lleguen a
   cualquier programa (probado mandando y escuchando en el mismo bus IAC, sin
   la aplicación en el medio). La rama "Mensaje de sistema sin reconocer" de la
   descripción queda, en la práctica, sin uso en macOS; el escenario de `F9`
   solo se pudo verificar leyendo el código.
9. **El IAC reescribe la Nota On con velocidad 0.** También visto al
   verificar: un `90 3C 00` mandado a un bus IAC llega como `80 3C 40`. Un
   dispositivo físico (Launchkey MK3) sí llega como `90 48 00` y la aplicación
   lo describe como "Nota Off · … · velocidad 0", así que el escenario se
   verificó con hardware. No es un problema de la aplicación, pero conviene
   saberlo al probar con IAC: podría sumarse a la sección de verificación de
   AGENTS.md.

## Risks / Trade-offs

- [Un escenario describe mal lo que pasa] → las tareas piden verificar cada
  escenario contra la aplicación antes de archivar; si no coincide, se corrige
  la spec, no el código.
- [Especificar el Sensor Activo en el log lo vuelve más difícil de cambiar] →
  cambiarlo después es un MODIFIED sobre un solo requirement; es preferible a
  tener comportamiento sin especificar.
