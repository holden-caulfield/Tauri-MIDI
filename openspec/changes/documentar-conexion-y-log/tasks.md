# Tasks

Este cambio no toca código. Cada tarea verifica escenarios de las specs nuevas
contra la aplicación real (`npm run tauri dev`); si un escenario no coincide con
lo que pasa, se corrige la spec y se anota la diferencia en design.md
(Hallazgos), nunca el código. Para generar mensajes sin un dispositivo físico
alcanza con el bus IAC de macOS (Configuración de Audio MIDI) y cualquier
herramienta que mande bytes arbitrarios a un puerto.

## 1. Conexión

- [x] 1.1 Verificar "Los puertos se ofrecen por nombre": los selectores muestran
      las entradas y salidas del sistema por separado, y un puerto nuevo solo
      aparece después de "Actualizar puertos"
- [x] 1.2 Verificar "Una conexión es siempre un par entrada/salida": conectar un
      par recibe mensajes de la entrada elegida, y conectar con un puerto
      desenchufado sin actualizar la lista muestra "No se encontró el puerto de
      …" con su nombre
- [x] 1.3 Verificar "Conectar reemplaza cualquier conexión anterior" y
      "Desconectar cierra los dos puertos": tras desconectar no llegan filas al
      log ni sale nada por la salida (reloj incluido), y tras reconectar a otra
      entrada solo llegan mensajes de la nueva
- [x] 1.4 Verificar "Se reciben todos los tipos de mensaje": un SysEx y un
      Sensor Activo (`FE`) enviados a la entrada aparecen en el log
- [x] 1.5 Verificar "Enviar a la salida requiere una conexión activa" leyendo
      `enviar_mensaje` en `src-tauri/src/lib.rs` (el caso sin conexión no se
      puede provocar desde la interfaz) y, con conexión, que dos notas enviadas
      por el flujo por defecto salen en orden

## 2. Log

- [x] 2.1 Verificar "El log muestra los mensajes que entran, salvo el reloj" y
      "Cada fila muestra hora, bytes y descripción": mandar notas y reloj
      intercalado con `FA`, y comprobar las filas y su formato
- [x] 2.2 Verificar las dos tablas de descripciones contra `describir_mensaje`
      en `src-tauri/src/lib.rs`, texto por texto, y en la aplicación los
      escenarios de ejemplo (`90 3C 00`, `B9 07 64`, `E0 00 40`, `FC`, `F9`)
      — `90 … 00` se verificó con un teclado físico (Hallazgo 9) y `F9` solo
      leyendo el código, porque macOS lo descarta antes de llegar a la
      aplicación (Hallazgo 8)
- [x] 2.3 Verificar "Los mensajes más nuevos van arriba" y "El log conserva los
      últimos 500 mensajes": con más de 500 mensajes enviados, la lista tiene
      500 filas y la de arriba es la última enviada
- [x] 2.4 Verificar "Limpiar vacía el log": limpiar con conexión activa deja
      solo lo que llega después, y desconectar y reconectar no borra filas

## 3. Cierre

- [x] 3.1 Correr `npx openspec validate documentar-conexion-y-log --strict` y
      verificar que pasa sin errores
- [x] 3.2 Repasar los Hallazgos de design.md con la persona usuaria y anotar
      cuáles quiere convertir en cambios nuevos — elegidos: 1 (conexión a
      medias), 2 (el puerto desaparece con la conexión activa) y 3 (falla al
      listar puertos)
- [x] 3.3 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
