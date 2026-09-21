# Design

## Context

Ver `proposal.md` — Why. El frontend es TypeScript vanilla con Vite: un
`index.html` con todo el markup, un `src/main.ts` de ~150 líneas y un
`src/styles.css`. `main.ts` guarda cada nodo del DOM en una variable mutable a
nivel de módulo, las asigna en `DOMContentLoaded` y mezcla en un solo archivo
el formateo de mensajes, el render del log, el wiring de la conexión y el
arranque.

Dos particularidades del estado actual que condicionan el diseño:

- El layout es el de una página web: `.contenedor` centrado con ancho máximo,
  que crece hacia abajo. Una barra de tabs al pie necesita que la ventana
  mande sobre la altura, no el contenido.
- El subtítulo ("Elegí un puerto de entrada y uno de salida para ver los
  mensajes MIDI…") es guía de la pantalla de conexión, no de la aplicación
  entera; en un encabezado común a todos los tabs quedaría fuera de lugar.
- `#texto-estado` cumple hoy dos funciones a la vez: indicar
  Conectado/Desconectado y mostrar errores de conexión y avisos de
  validación, pisando el estado con el mensaje de turno.

Restricciones que marcan el enfoque:

- No se agregan frameworks (AGENTS.md — Arquitectura y convenciones).
- No se introducen abstracciones para necesidades que todavía no llegaron
  (AGENTS.md — Estilo de código): el sistema de tabs tiene que alcanzar para
  dos tabs y no pretender más.
- El log se alimenta de un evento de Tauri (`mensaje-midi`) que llega en
  cualquier momento, sin importar qué está mirando la persona usuaria.

## Goals / Non-Goals

**Goals:**

- Un mecanismo de tabs mínimo, declarado en el markup, que no haya que tocar
  para agregar un tab más adelante.
- Un layout de aplicación de escritorio: encabezado arriba, barra al pie, el
  panel activo ocupando el medio.
- Que cada panel sea un módulo con dueño claro, dentro del tamaño actual del
  proyecto.
- Que ocultar un panel no cambie nada de su comportamiento.

**Non-Goals:**

- Ruteo, URLs o historial de navegación entre tabs.
- Persistir el tab activo entre ejecuciones.
- Carga diferida (lazy) de paneles: con dos paneles chicos no hay nada que
  ganar y complicaría el requisito de que el log acumule estando oculto.
- Un registro/API genérica de tabs (registrar, ordenar, habilitar): con dos
  tabs declarados en el HTML no hace falta.
- Detalle del estado más allá de conectado/desconectado (nombres de puertos,
  contadores) en el indicador del encabezado.

## Decisions

### Tabs declarados en el markup, resueltos por convención

La barra es un contenedor con un `<button>` por tab; cada botón referencia el
`id` de su panel (vía `aria-controls`), y cada panel es una `<section>`. El
módulo de tabs recorre los botones del contenedor, deriva de ahí la lista de
paneles y conmuta la visibilidad. Agregar un tab es agregar un botón y una
sección en `index.html`, sin tocar TypeScript.

Alternativas descartadas:

- **Dos tabs hardcodeados en TypeScript**: más código que la versión por
  convención y hay que editarlo en cada tab nuevo.
- **Solo CSS** (radios + `:checked`): evita JavaScript pero obliga a un markup
  torcido y pierde la semántica de tabs para tecnologías de asistencia.

### La barra va última en el DOM, no solo abajo en la pantalla

Con los tabs al pie, el orden visual es encabezado → panel → barra, y el DOM
sigue ese mismo orden: los paneles primero, el `tablist` al final. Así el
recorrido por teclado y el de un lector de pantalla coinciden con lo que se
ve, sin trucos de CSS (`order`, `column-reverse`) que los desalinearían. El
patrón de tabs de WAI-ARIA admite la barra después de los paneles; el vínculo
lo da `aria-controls`, no la posición.

### Layout de ventana completa

`body` pasa a ser una columna de alto `100dvh` con tres franjas: encabezado,
área de paneles (la que crece y, si hace falta, scrollea) y barra de tabs. El
ancho máximo de 900px centrado se conserva dentro del encabezado y del área
de paneles; la barra se extiende de borde a borde para que se lea como parte
del marco de la ventana.

Alternativa descartada: dejar la barra como último elemento del flujo normal,
sin fijarla. Con poco contenido quedaría flotando en el medio de la ventana,
que es justamente lo que una barra al pie no debería hacer.

### El encabezado queda mínimo

El encabezado pasa a ser una fila con el título a la izquierda y el indicador
de estado a la derecha: lo único que vale la pena tener a la vista en todo
momento. El subtítulo baja al panel de conexión, arriba de los selectores,
donde es la instrucción de lo que hay que hacer ahí. La regla que queda para
el futuro es la misma: en el encabezado va lo que aplica a todos los tabs.

### El estado de conexión se separa en dos nodos

El indicador del encabezado muestra únicamente Conectado/Desconectado (texto
y color). Los errores y avisos de validación van a una línea propia dentro
del panel de conexión, que se limpia en cada intento nuevo. Es lo que hace
falta para que el indicador pueda estar siempre a la vista: un mensaje de
error permanente en el encabezado sería peor que el problema que resuelve.

`conexion.ts` sigue siendo dueño de los dos nodos, aunque uno viva en el
encabezado y el otro en el panel: lo que el módulo encapsula es el
comportamiento de la conexión, no una región de la pantalla. Un módulo
`estado.ts` aparte, con algún canal para notificarle los cambios, sería
maquinaria para un solo dato.

### Semántica ARIA nativa, sin navegación con flechas

El contenedor lleva `role="tablist"`, los botones `role="tab"` con
`aria-selected` y `aria-controls`, y los paneles `role="tabpanel"`. Al ser
`<button>` nativos, el foco y la activación con Enter o barra espaciadora
salen gratis. El indicador de estado lleva `aria-live="polite"` para que su
cambio se anuncie sin robar el foco.

No se implementa el patrón completo de WAI-ARIA con flechas y *roving
tabindex*: con dos tabs, tenerlos a ambos en el orden de tabulación es
navegable y correcto, y el patrón completo agrega código sin un problema
concreto que resolver.

### Ocultar con el atributo `hidden`, sin desmontar

Los paneles inactivos se ocultan con el atributo `hidden` y permanecen en el
DOM con su estado intacto. Es lo que hace cumplir el requisito de que el log
siga acumulando mensajes oculto: el `listen("mensaje-midi")` se registra una
sola vez al arrancar y escribe siempre en el mismo nodo.

Alternativa descartada: crear y destruir el contenido de cada panel al
cambiar de tab — obligaría a bufferear los mensajes fuera del DOM sin que
nadie lo haya pedido.

### `main.ts` se parte en un módulo por responsabilidad

- `src/tabs.ts`: `inicializarTabs()` — conmutación y estado de la barra.
- `src/conexion.ts`: `inicializarConexion()` — selectores, botones, indicador
  de estado, línea de mensajes, y los `invoke` de `listar_puertos_*`,
  `conectar` y `desconectar`.
- `src/log.ts`: `inicializarLog()` — formateo, render de filas, tope de
  mensajes, botón de limpiar y el `listen` del evento.
- `src/main.ts`: escucha `DOMContentLoaded` y llama a los tres.

Cada módulo busca sus propios nodos al inicializarse y los guarda en
constantes locales, lo que hace desaparecer las variables mutables a nivel de
módulo. Los selectores fijos siguen usando `!`, como hasta ahora: fallan al
arrancar y con un id roto la app no llega a pintarse. El límite entre módulos es el panel: hoy no hay
estado compartido entre conexión y log, así que no hace falta ningún canal
entre ellos.

Alternativa descartada: dejar todo en `main.ts`. Es viable con dos paneles,
pero el archivo ya mezcla cuatro responsabilidades y los tabs hacen explícita
la frontera por la que conviene cortar.

### CSS

Los estilos actuales de `.panel-conexion` y `.panel-log` (borde, fondo,
padding) pasan a una clase común de panel; se agregan los estilos de la barra
al pie, del tab activo y del indicador de estado (que reusa los colores de
`.estado-conectado` / `.estado-desconectado`). El encabezado deja de estar
centrado y `.subtitulo` pierde el centrado al pasar al panel. `hidden` necesita
`[hidden] { display: none; }` explícito porque los paneles usan
`display: flex`, y va después de las reglas de panel porque compite con ellas
en especificidad.

La hoja de estilos trae un `outline: none` para todo `select`/`button` sin
nada que lo reemplace. En los botones del panel el borde y el `:hover` todavía
dan alguna pista, pero los de la barra no tienen borde ni fondo: un tab
enfocado quedaba idéntico a uno sin foco. Por eso la barra define su propio
`:focus-visible`. El `outline: none` global sigue afectando al resto de los
controles; corregirlo es un cambio aparte.

## Risks / Trade-offs

- **Convención implícita entre HTML y TypeScript**: un botón sin
  `aria-controls`, o apuntando a un `id` inexistente, rompe el tab en tiempo
  de ejecución y no lo detecta `tsc`. A diferencia de los selectores fijos de
  los otros módulos, acá el selector se arma en runtime y el panel queda
  capturado en un closure, así que un `!` dejaría el error para el primer
  click → `buscarPanel()`, local a `tabs.ts`, valida al inicializar y nombra
  el tab y el id en el error, en vez de dejar un tab muerto en silencio.
- **Partir `main.ts` mueve casi todo el frontend** → El diff se lee peor, pero
  el código movido no cambia; conviene hacerlo en un commit aparte del que
  agrega los tabs.
- **El layout de alto fijo se rompe distinto que el actual**: si una ventana
  muy baja deja el panel sin lugar, el scroll tiene que quedar en el área de
  paneles y no en `body`, o la barra al pie se pierde → Se verifica a mano
  achicando la ventana durante `npm run tauri dev`.

## Migration Plan

No hay datos ni API que migrar: es un cambio de interfaz en un binario de
escritorio. Verificación según AGENTS.md: `npx tsc --noEmit` desde la raíz y
`npm run tauri dev` para revisar la ventana real (el backend no se toca, así
que `cargo check` es solo confirmación de que sigue compilando).

## Open Questions

- Estética de la barra y del indicador (subrayado del tab activo vs. pastilla
  con fondo; punto de color vs. texto solo): se decide al implementar, no
  afecta ni las specs ni las tareas.
