# Tasks

## 1. Implementación

- [x] 1.1 En `src/conexion.ts`, hacer que `actualizarListaDePuertos` limpie
      `mensajeConexion` al empezar y capture la falla del `Promise.all`,
      escribiendo solo "No se pudo obtener la lista de puertos: …" (design.md,
      "El error se captura dentro de `actualizarListaDePuertos`"); verificar
      con `npx tsc --noEmit`

## 2. Verificación en el navegador integrado

Con el servidor de Vite en el navegador integrado, según design.md ("Cómo se
verifica").

- [x] 2.1 Verificar "Falla al actualizar": con una lista y una elección
      cargadas desde la consola, presionar "Actualizar puertos"; aparece el
      mensaje y los selectores quedan iguales
- [x] 2.2 Verificar "Falla al abrir": con `window.__TAURI_INTERNALS__`
      reemplazado para rechazar los comandos, llamar a `inicializarConexion`
      en un estado recién cargado; aparece el mensaje y los selectores no
      ofrecen puertos
- [x] 2.3 Verificar "Actualizar con éxito después de una falla": con el
      mensaje a la vista, hacer que los comandos de listado devuelvan una
      lista y presionar "Actualizar puertos"; el mensaje desaparece y los
      selectores muestran la lista nueva

## 3. Cierre

- [x] 3.1 Verificar en la aplicación real (`npm run tauri dev`) que al abrir
      se listan los puertos como siempre, sin ningún mensaje
- [x] 3.2 Correr la verificación de AGENTS.md: `cargo check` desde
      `src-tauri/` y `npx tsc --noEmit` desde la raíz
- [x] 3.3 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
