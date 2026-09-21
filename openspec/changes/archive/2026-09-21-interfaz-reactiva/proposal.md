# Proposal

## Why

Hoy cada interacción de la interfaz se programa a mano: `establecerEstadoConectado`
en `conexion.ts` sabe que conectarse implica tocar siete propiedades de seis nodos
distintos del DOM, y es el único lugar donde existe el dato "estoy conectado". Cada
control nuevo suma una línea ahí, cada módulo que necesite saber si hay conexión
tiene que enterarse por su cuenta, y basta con olvidarse de una línea para que la
pantalla muestre algo que no es cierto. Con dos tabs todavía se sostiene; con el
editor visual de flujos del roadmap, no.

## What Changes

- Se agrega un estado único de la interfaz (`src/estado.ts`): un objeto con los
  datos que la pantalla necesita (si hay conexión, qué puertos hay, cuál está
  elegido, qué mensaje de error mostrar, qué panel está activo), una función para
  modificarlo y otra para suscribirse a sus cambios. Son unas veinte líneas
  propias, sin librería de estado.
- Se incorpora **lit-html** como única dependencia nueva, para escribir el marcado
  como HTML dentro de plantillas de texto (`` html`<button ?disabled=${...}>` ``)
  en vez de `document.createElement` línea por línea. Pesa unos 3 kB, no necesita
  configuración de build ni JSX, y actualiza solo lo que cambió.
- Se adopta un **esquema de componentes liviano**: un componente es una función
  que devuelve HTML. Puede leer del estado, puede recibir datos por parámetro, y
  se puede meter adentro de otro componente. No tiene estado propio ni ciclo de
  vida: no hay nada más que aprender.
- `main.ts` pasa a ser el componente raíz que arma la ventana entera con los
  demás adentro (encabezado, paneles, barra de tabs), y el único lugar donde se
  dibuja y se escucha al estado. Los módulos dejan de buscar sus nodos en el DOM.
- Los tabs se manejan por estado: `panelActivo` dice qué panel se ve, la barra
  marca cuál está activo leyendo ese mismo dato, y los paneles se ocultan con
  `hidden` sin desmontarse. La lista de paneles queda declarada una sola vez, y
  de ahí salen tanto la barra como los paneles y su cableado de accesibilidad.
- `establecerEstadoConectado` y el resto de las funciones que empujan cambios al
  DOM desaparecen: conectar pasa a ser "anotar en el estado que hay conexión", y
  los botones, los selectores y el indicador del encabezado se acomodan solos.
- El marcado se muda de `index.html` a los componentes; `index.html` queda como
  el esqueleto mínimo de la ventana.
- La lista de mensajes del log queda fuera de este mecanismo a propósito: sus
  filas se siguen agregando de a una al DOM, porque redibujarla entera con cada
  mensaje MIDI sería un problema de rendimiento real. Del log se pasa a componente
  el marco (título, botón "Limpiar", contenedor de la lista), no el flujo de
  mensajes.
- Cambia una sola cosa de lo que la persona usuaria ve: los selectores de puerto
  arrancan sin nada elegido y lo dicen ("Elegí un puerto"), en vez de venir con
  el primer puerto de la lista elegido de entrada. Lo mismo pasa si el puerto
  que estaba elegido desaparece. El resto de la interfaz no cambia, ni el
  backend en Rust, ni el protocolo de comandos y eventos con Tauri.

## Capabilities

### New Capabilities

- `estado-de-la-interfaz`: garantiza que lo que la pantalla muestra siempre
  concuerde con el estado real de la aplicación — un mismo dato, una sola fuente,
  sin controles que se contradigan entre sí. Hasta ahora esa garantía existía por
  disciplina de quien escribía el código, no por construcción, y nunca estuvo
  escrita en ningún lado.

### Modified Capabilities

<!-- Ninguna: `navegacion-por-tabs` sigue valiendo tal cual está. El cambio de
     panel pasa a resolverse leyendo y escribiendo el estado compartido, pero lo
     que la spec describe (barra al pie, un panel visible a la vez, paneles
     ocultos que siguen activos, accesibilidad por teclado) no se toca. -->

## Impact

- **Código afectado**: `src/main.ts`, `src/conexion.ts`, `src/log.ts`,
  `src/tabs.ts`, `index.html`. Se agrega `src/estado.ts`.
- **Dependencias**: se suma `lit-html` a `dependencies`. Es la primera librería
  de interfaz del proyecto; AGENTS.md pide no agregar frameworks sin pedido
  explícito de la persona usuaria, y este cambio nace de ese pedido.
- **Convenciones**: la sección "Organización del frontend" de AGENTS.md describe
  el esquema que este cambio reemplaza (módulos que buscan sus propios nodos,
  marcado de los paneles en `index.html`, tabs derivados de `aria-controls`).
  Hay que reescribirla. `design.md` trae el texto de reemplazo propuesto; se
  aplica con aprobación explícita de la persona usuaria, antes de archivar.
- **Estilos**: `styles.css` solo cambia en que las reglas de layout de columna
  pasan de `body` al nuevo `<div id="app">`. Las clases son las mismas.
- **Sin impacto**: `src-tauri/` no se toca.
