# Tasks

Las verificaciones usan la aplicación real (`npm run tauri dev`), el bus IAC
(Bus 1 como entrada, Bus 2 como salida) y un dispositivo físico que se pueda
desenchufar (el Launchkey MK3). Para ver si la salida quedó cerrada, igual que
en `conexion-fallida-sin-puertos-abiertos`: desde la consola del inspector,
`window.__TAURI_INTERNALS__.invoke('enviar_mensaje', { datos: [0x90, 0x3C, 0x64] })`.

## 1. Backend

- [x] 1.1 En `EstadoMidi`, sumar el contador de conexión detrás de un `Mutex`
      y hacer que `cerrar_conexiones` lo incremente; `conectar` y
      `desconectar` toman ese lock mientras cierran y abren (design.md, "Cada
      conexión tiene un número"); verificar con `cargo check`
- [x] 1.2 Agregar el hilo vigilante: se lanza al final de un `conectar`
      exitoso, crea sus clientes MIDI una vez, cada segundo busca los dos
      nombres, termina si el número cambió y, si falta algún puerto, cierra
      bajo el lock y emite `conexion-perdida` con el mensaje de design.md;
      verificar con `cargo check`

## 2. Frontend

- [x] 2.1 En `src/conexion.ts`, hacer que `inicializarConexion` escuche
      `conexion-perdida` y actualice `conectado` y `mensajeConexion`; verificar
      con `npx tsc --noEmit`

## 3. Verificación

- [x] 3.1 Verificar "Se desenchufa la entrada": entrada Launchkey, salida Bus
      2; al desenchufar, en menos de dos segundos aparece "Desconectado" y el
      mensaje con el puerto de entrada, y el envío desde la consola falla con
      "No hay una conexión de salida activa"
- [x] 3.2 Verificar "Se desenchufa la salida": entrada Bus 1, salida
      Launchkey; al desenchufar, la app se desconecta, el mensaje nombra la
      salida y lo que se manda al Bus 1 ya no aparece en el log
- [x] 3.3 Verificar "Se desenchufa un dispositivo que era entrada y salida"
      (Launchkey en los dos) y "Con otro tab a la vista" (desenchufar con el
      tab Log activo)
- [x] 3.4 Verificar "Volver a conectar cuando el dispositivo vuelve": enchufar
      de nuevo y presionar "Conectar" sin tocar los selectores; conecta y el
      mensaje desaparece
- [x] 3.5 Verificar "Desenchufar después de desconectar" y "La vigilancia no
      afecta a una conexión nueva": desconectar a mano (y reconectar a Bus 1 →
      Bus 2) antes de desenchufar el Launchkey; no aparece ningún mensaje y la
      conexión nueva sigue pasando notas y reloj al Bus 2
- [x] 3.6 Correr la verificación de AGENTS.md: `cargo check` desde
      `src-tauri/` y `npx tsc --noEmit` desde la raíz
- [ ] 3.7 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
