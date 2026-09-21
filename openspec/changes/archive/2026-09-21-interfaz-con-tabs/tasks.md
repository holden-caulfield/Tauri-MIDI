# Tasks

## 1. Refactor previo (sin cambios de comportamiento)

- [x] 1.1 Mover a `src/log.ts` el formateo (`formatearBytes`, `formatearHora`),
      el render de filas, el tope de mensajes, el botón de limpiar y el
      `listen("mensaje-midi")`, expuestos como `inicializarLog()` que busca
      sus propios nodos; verificar con `npx tsc --noEmit`
- [x] 1.2 Mover a `src/conexion.ts` los selectores, los botones, el texto de
      estado y los `invoke` de `listar_puertos_*`, `conectar` y `desconectar`,
      expuestos como `inicializarConexion()`; verificar con `npx tsc --noEmit`
- [x] 1.3 Dejar `src/main.ts` solo con el `DOMContentLoaded` que llama a los
      inicializadores, sin variables mutables a nivel de módulo; verificar que
      no quedan `let` de nodos con `grep -n "^let " src/*.ts`
- [x] 1.4 Correr `npm run tauri dev` y confirmar que la app se comporta igual
      que antes del refactor: listar puertos, conectar, ver mensajes, limpiar,
      desconectar

## 2. Estado de conexión en el encabezado

- [x] 2.1 En `index.html`, agregar al encabezado el indicador de estado
      (`aria-live="polite"`), mover el subtítulo al inicio del panel de
      conexión y agregar ahí la línea propia para errores y avisos; verificar
      que el indicador y la línea de mensajes tienen `id` distintos
- [x] 2.2 En `src/conexion.ts`, separar las dos funciones del antiguo
      `#texto-estado`: el indicador solo alterna Conectado/Desconectado con su
      color, y la línea del panel muestra el aviso de puertos faltantes y el
      error de conexión, limpiándose en cada intento nuevo; verificar con
      `npx tsc --noEmit`
- [x] 2.3 En `src/styles.css`, maquetar el encabezado como fila (título a la
      izquierda, indicador a la derecha), ajustar `.subtitulo` para su nuevo
      lugar dentro del panel, y reusar los colores de `.estado-conectado` / `.estado-desconectado`;
      verificar en `npm run tauri dev` que conectar y desconectar cambian
      texto y color, y que un error aparece solo en el panel

## 3. Estructura de tabs

- [x] 3.1 En `index.html`, marcar las dos `<section>` como `role="tabpanel"`
      con `id` y agregar **después de ellas** la barra (`role="tablist"`) con
      los botones "Conexión" y "Log" (`role="tab"`, `aria-controls` al `id` de
      su panel); verificar en el markup que cada `aria-controls` apunta a un
      `id` que existe
- [x] 3.2 Crear `src/tabs.ts` con `inicializarTabs()`: recorre los botones del
      tablist, resuelve los paneles por `aria-controls`, activa el primer tab
      y conmuta `hidden` + `aria-selected` al hacer click; que falle con un
      error claro si un botón apunta a un panel inexistente
- [x] 3.3 Llamar a `inicializarTabs()` desde `src/main.ts` antes de los otros
      inicializadores; verificar con `npx tsc --noEmit`
- [x] 3.4 En `src/styles.css`, pasar `body` a columna de `100dvh` con
      encabezado, área de paneles (la que scrollea) y barra al pie de borde a
      borde; extraer la clase común de panel (borde, fondo, padding) de
      `.panel-conexion`/`.panel-log`, agregar los estilos de la barra y del
      tab activo, y `[hidden] { display: none; }`
- [x] 3.5 Verificar en `npm run tauri dev` que el tab inactivo no se ve, que
      la barra queda al pie sin irse con el scroll al achicar la ventana, y
      que el modo oscuro sigue bien

## 4. Verificación

- [x] 4.1 Con `npm run tauri dev`: la app abre en "Conexión", cambiar a "Log"
      y volver mantiene los puertos elegidos
- [x] 4.2 Con una conexión activa y el tab "Conexión" a la vista, generar
      mensajes MIDI (IAC Driver en macOS) y confirmar al pasar a "Log" que
      están todos y en orden
- [x] 4.3 Estando en el tab "Log", desconectar desde el tab "Conexión" y al
      revés: confirmar que el indicador del encabezado acompaña el cambio
      desde cualquier tab
- [x] 4.4 Recorrer la barra con Tab y activar cada tab con Enter y con barra
      espaciadora; confirmar que el tab enfocado se distingue, que
      `aria-selected` queda en `true` solo para el tab activo, y que el orden
      de tabulación es panel → barra
- [x] 4.5 Correr `npx tsc --noEmit` desde la raíz y `cargo check` desde
      `src-tauri/`
