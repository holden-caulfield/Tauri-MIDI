# Tasks

## 1. Preparación

- [x] 1.1 Crear la rama local del cambio desde `main` actualizado y verificar con
      `git status` que la rama activa no es `main`
- [x] 1.2 Instalar `lit-html` con `npm install lit-html` y verificar que quedó en
      `dependencies` de `package.json` y que `npm run dev` sigue levantando la
      aplicación sin errores en la consola

## 2. El estado

- [x] 2.1 Escribir `src/estado.ts` con la interfaz `Estado` (conectado, puertos
      de entrada y salida, puertos elegidos, mensaje de conexión, panel activo),
      el objeto `estado` con sus valores iniciales, `suscribir` y `actualizar`
      (design.md — decisión 1); verificar con `npx tsc --noEmit` y que el archivo
      no importe nada de lit-html

## 3. Andamio: componente raíz y tabs por estado

- [x] 3.1 Mudar el contenido de cada panel de `index.html` a un componente
      (`panelConexion()` en `conexion.ts`, `panelLog()` en `log.ts`), copiando el
      marcado tal cual y conservando los `id` existentes; verificar con
      `npx tsc --noEmit`
- [x] 3.2 Convertir `tabs.ts` en el componente de la barra: recibe la lista de
      paneles y el activo, y devuelve los botones con `aria-selected`,
      `aria-controls` e `id` derivados del identificador de cada panel
      (decisión 5); verificar con `npx tsc --noEmit`
- [x] 3.3 Escribir el componente raíz en `main.ts`: la lista `PANELES`, el
      encabezado, las `<section>` con `?hidden=${estado.panelActivo !== id}` —
      nunca renderizado condicional (decisión 4)— la barra al final, y las tres
      líneas que dibujan y se suscriben; verificar con `npx tsc --noEmit`
- [x] 3.4 Reducir `index.html` a `<div id="app"></div>` y verificar en la
      aplicación que se ve exactamente igual que antes del cambio, incluidos los
      estilos y el orden de los elementos
- [x] 3.5 Verificar que sigue valiendo la spec `navegacion-por-tabs`: el panel
      inicial es "Conexión", cambiar de tab muestra un solo panel, el panel
      señalado en la barra es el que se ve, y los tabs se activan con Enter y
      barra espaciadora en la ventana real (la inyección de teclas del navegador
      no sirve para esto)
- [x] 3.6 Verificar que el orden de tabulación sigue el orden visual: recorrer la
      ventana con Tab desde el principio y comprobar que la barra queda al final

## 4. Conexión por estado

- [x] 4.1 Pasar `panelConexion()` a leer todo del estado: texto y clase del
      indicador del encabezado, opciones de los dos `<select>` con
      `.selected` por opción (decisión 6), `?disabled` de los tres botones y el
      mensaje de conexión; verificar con `npx tsc --noEmit`
- [x] 4.2 Pasar `actualizarListaDePuertos`, `conectar` y `desconectar` a escribir
      en el estado con `actualizar` en lugar de tocar el DOM, y agregar el
      `@change` de cada `<select>`; borrar `establecerEstadoConectado` y
      `rellenarSelect`; verificar con `grep -rn "establecerEstadoConectado\|querySelector" src/conexion.ts` que no queda ninguna aparición
- [x] 4.3 Verificar a mano en la aplicación, con el IAC Driver o un dispositivo
      real, los escenarios de la spec: sin conexión, con conexión, conexión
      fallida, falta elegir un puerto, el mensaje que no queda pegado, y que el
      indicador del encabezado nunca contradice a los botones
- [x] 4.4 Verificar que la elección de puerto sobrevive a un redibujado: elegir
      los dos puertos, provocar un error de conexión y comprobar que los
      selectores siguen mostrando lo elegido; repetir cambiando de panel y
      volviendo (es el riesgo principal del cambio, ver design.md — Risks)

## 5. Log

- [x] 5.1 Dejar en `panelLog()` solo el marco (título, botón "Limpiar" con su
      `@click`, contenedor vacío de la lista) y mover a `inicializarLog()` la
      referencia al contenedor tomada después del primer dibujado, más el
      `listen` de Tauri (decisión 7); verificar en la aplicación que llegan
      mensajes y se ven igual que antes
- [x] 5.2 Verificar que las filas del log sobreviven a los redibujados de otras
      partes de la ventana: con mensajes ya en la lista, conectar, desconectar y
      cambiar de panel varias veces, y comprobar que la lista queda intacta y
      respeta el tope de 500 mensajes
- [x] 5.3 Verificar el escenario de la spec `navegacion-por-tabs` que este diseño
      podría romper: con el panel "Log" oculto y una conexión activa, tocar
      mensajes MIDI y comprobar al volver al panel que están todos y en orden

## 6. Cierre

- [x] 6.1 Revisar que ningún módulo busque nodos en el DOM salvo `log.ts` para su
      contenedor de filas, y que no queden funciones ni importaciones sin uso;
      verificar con `npx tsc --noEmit` y `npm run build`
- [x] 6.2 Correr la verificación completa que pide AGENTS.md: `cargo check` desde
      `src-tauri/`, `npx tsc --noEmit` desde la raíz y `npm run tauri dev` para
      probar la aplicación real
- [x] 6.3 Proponer a la persona usuaria el diff de AGENTS.md que reemplaza las
      secciones "Organización del frontend" y "Tabs" (el texto está en design.md
      — decisión 9) y esperar su aprobación explícita antes de aplicarlo
- [x] 6.4 Subir la rama, abrir el PR contra `main` y verificar que el PR quedó
      creado
