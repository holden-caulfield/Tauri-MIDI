# Tasks

Para provocar la falla: salida "IAC Driver Bus 2" y como entrada un
dispositivo físico que se desenchufa sin presionar "Actualizar puertos". Para
ver si la salida quedó abierta: escuchar el Bus 2 y, desde la consola del
inspector de la ventana, correr
`window.__TAURI_INTERNALS__.invoke('enviar_mensaje', { datos: [0x90, 0x3C, 0x64] })`.

## 1. Reproducir

- [x] 1.1 Con el código actual, provocar la falla de la entrada y verificar
      que el envío desde la consola **sí** sale por el Bus 2 (confirma el
      Hallazgo 1 antes de tocar nada)

## 2. Implementación

- [x] 2.1 En `src-tauri/src/lib.rs`, pasar el cuerpo de `conectar` a una
      función auxiliar que devuelve `Result` y hacer que `conectar` llame a
      `cerrar_conexiones` si falla (design.md, "Cerrar todo ante cualquier
      error"); verificar con `cargo check` desde `src-tauri/`

## 3. Verificación

- [x] 3.1 Verificar el escenario "Falla la entrada después de abrir la salida"
      y "Envío después de un intento fallido": repetir 1.1 con el código nuevo;
      el envío desde la consola falla con "No hay una conexión de salida
      activa" y no sale nada por el Bus 2
- [x] 3.2 Verificar que no se rompió lo que funcionaba: una conexión exitosa
      (entrada Bus 1, salida Bus 2) recibe mensajes, los emite por el flujo por
      defecto y reenvía el reloj; desconectar y reconectar sigue funcionando
- [x] 3.3 Correr la verificación de AGENTS.md: `cargo check` desde
      `src-tauri/` y `npx tsc --noEmit` desde la raíz
- [ ] 3.4 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
