# Design

## Context

Ver `proposal.md` — Why para la motivación. Lo que condiciona el diseño:

- El frontend es TypeScript vanilla sobre Vite, con tres módulos
  (`conexion.ts`, `log.ts`, `tabs.ts`) que buscan sus nodos en `index.html` y
  enganchan listeners. Hoy el estado real vive repartido entre el DOM (el puerto
  elegido es `select.value`, el tab activo es un atributo `aria-selected`) y
  funciones que lo empujan a mano (`establecerEstadoConectado`).
- El público del código es explícito: tiene que poder seguirlo alguien que recién
  empieza a programar. Eso pesa más que la elegancia o la generalidad.
- AGENTS.md prohíbe abstracciones pensadas para necesidades futuras. La solución
  tiene que resolver el problema de hoy — dos paneles, un puñado de controles — y
  no el editor de flujos del roadmap.
- El log recibe mensajes MIDI a alta frecuencia (el backend ya filtra el reloj,
  pero un teclado tocando genera decenas de mensajes por segundo). La spec
  `navegacion-por-tabs` exige además que el log siga acumulando mensajes mientras
  su panel está oculto.

## Goals / Non-Goals

**Goals:**

- Que agregar un control a la interfaz no obligue a tocar ninguna función de
  coordinación: se agrega al componente y lee del estado.
- Que la ventana se lea de arriba hacia abajo desde un solo lugar: qué partes
  tiene y en qué orden, con cada parte desarrollada en su propio archivo.
- Que todo el mecanismo (estado + suscripción + dibujado) entre en unas treinta
  líneas que se leen de una sentada, sin conceptos nuevos más allá de "hay un
  objeto con la verdad, las vistas lo leen, y cuando cambia se vuelven a dibujar".
- Que el marcado se escriba como HTML, no como `document.createElement`.
- Que la migración se pueda hacer por partes, con la aplicación funcionando en
  cada paso.

**Non-Goals:**

- Los componentes no tienen estado propio, ni ciclo de vida, ni se registran en
  ningún lado. Son funciones que devuelven HTML: si una necesita recordar algo,
  ese algo va al estado compartido.
- No se buscan componentes reutilizables ni una librería de controles propia.
  Cada componente de este cambio se usa en un solo lugar.
- No se agregan estados nuevos que hoy no existen (por ejemplo "conectando…"
  mientras el comando está en vuelo). El diseño los deja a un paso de distancia,
  pero agregarlos es otro cambio.
- No se toca `src-tauri/`, ni los estilos, ni el aspecto de la ventana.
- No se agregan tests automatizados: el proyecto no tiene infraestructura de
  tests y montarla es un cambio aparte.

## Decisions

### 1. El estado es un objeto plano con dos funciones, escrito a mano

`src/estado.ts` contiene la forma completa del estado de la interfaz y dos
funciones:

```ts
export interface Estado {
  conectado: boolean;
  puertosEntrada: string[];
  puertosSalida: string[];
  puertoEntradaElegido: string;
  puertoSalidaElegido: string;
  mensajeConexion: string;
  panelActivo: string;
}

export const estado: Estado = { /* valores iniciales */ };

const observadores: Array<() => void> = [];

export function suscribir(observador: () => void) {
  observadores.push(observador);
}

export function actualizar(cambios: Partial<Estado>) {
  Object.assign(estado, cambios);
  for (const observador of observadores) observador();
}
```

Son unas veinte líneas sin magia: `actualizar` modifica el objeto y avisa, y
quien se suscribió se vuelve a dibujar. La interfaz `Estado` funciona además
como inventario: de un vistazo se ve todo lo que la pantalla puede mostrar.

`estado.ts` no importa lit-html. El estado no sabe que existe una librería de
plantillas, y por eso cambiarla más adelante no lo toca.

**Alternativas consideradas.** Una librería de señales (`nanostores`,
`@preact/signals-core`) da lo mismo que estas veinte líneas a cambio de una
dependencia y de un concepto extra (`.get()` / `.set()` / señales derivadas);
no compensa. `Proxy` para detectar escrituras sin llamar a `actualizar` sería
más cómodo de usar pero mucho más difícil de entender: la línea
`estado.conectado = true` dispararía un redibujado invisible. Se elige la
función explícita justamente porque hace visible el momento en que algo cambia.

**Lo que este diseño no hace, a propósito:** no agrupa cambios ni evita
redibujados repetidos. Los cambios de estado son consecuencia de clics, no de
mensajes MIDI; redibujar de más no se nota y el código queda la mitad de largo.

### 2. Las plantillas se escriben con lit-html

`lit-html` (~3 kB, sin JSX, sin configuración de build) permite escribir el
marcado como HTML dentro de una plantilla de texto y actualizar solo lo que
cambió:

```ts
const plantilla = () => html`
  <button @click=${conectar} ?disabled=${estado.conectado}>Conectar</button>
`;
```

Razones por sobre el resto: la sintaxis es HTML de verdad (quien viene de tocar
`index.html` lo lee sin traducir nada), los tres tipos de hueco se distinguen a
simple vista (`${}` para contenido, `?` para atributos que están o no están,
`@` para eventos), no hay paso de compilación ni DOM virtual, y —lo que habilita
la decisión 3— una plantilla se puede meter adentro de otra sin ninguna
ceremonia.

**Alternativas consideradas.** `uhtml` es aún más chica y casi idéntica en API,
pero con mucha menos documentación y comunidad — para el público objetivo, eso
pesa más que un kilobyte. `van.js` compone el DOM con funciones (`button({...},
"Conectar")`), que es volver a construir elementos programáticamente, justo lo
que se quiere evitar. `htm` + Preact acerca a JSX pero arrastra el modelo de
componentes de Preact. Alpine.js y Preact + signals se descartaron con la
persona usuaria antes de escribir esta propuesta: el primero reparte la lógica
entre atributos del HTML y deja de estar chequeado por TypeScript; el segundo
suma JSX, DOM virtual y configuración de build.

### 3. Un componente es una función que devuelve HTML

Esa es toda la definición, y no hay una segunda regla:

```ts
// conexion.ts
export function panelConexion() {
  return html`
    <p class="subtitulo">Elegí un puerto de entrada y uno de salida…</p>
    ${selectorDePuerto("Puerto de entrada", estado.puertosEntrada, …)}
    …
  `;
}
```

Un componente puede leer del estado directamente, o recibir lo que necesita por
parámetro cuando eso lo hace más claro (`selectorDePuerto(etiqueta, opciones,
elegido, alElegir)`, `barraDeTabs(paneles, activo)`). Eso es todo lo que hay de
"props": argumentos de una función. No hay estado interno, no hay ciclo de vida,
no hay registro de componentes, y un componente se prueba llamándolo.

**Se dibuja una sola vez, desde la raíz.** `main.ts` es el componente raíz y el
único archivo que habla con lit-html y con la suscripción:

```ts
const raiz = document.querySelector<HTMLElement>("#app")!;
const dibujar = () => render(ventana(), raiz);

suscribir(dibujar);
dibujar();
```

Tres líneas, una sola vez en todo el proyecto. Comparado con que cada módulo se
suscriba por su cuenta, esto es menos código, menos que entender, y hace que el
orden de dibujado sea el orden en que se leen los componentes en la raíz.

**Redibujar todo en cada cambio no es un problema** porque lit-html no rehace el
DOM: compara los huecos `${}` contra lo que ya está y toca solo los que
cambiaron. Los nodos que no tienen huecos ni se visitan.

### 4. `panelActivo` vive en el estado, y los paneles se ocultan sin desmontarse

`estado.panelActivo` guarda el identificador del panel visible (`"conexion"`,
`"log"`). Un clic en la barra llama a `actualizar({ panelActivo: "log" })` y
listo: la barra marca el nuevo activo y los paneles se muestran o se esconden,
porque todos leen el mismo dato en el mismo dibujado. Es imposible que la barra
diga una cosa y la pantalla muestre otra.

Un panel oculto se marca con `?hidden=${estado.panelActivo !== id}`, **nunca con
renderizado condicional**:

```ts
// Sí:  <section ?hidden=${estado.panelActivo !== "log"}>${panelLog()}</section>
// No:  ${estado.panelActivo === "log" ? panelLog() : nothing}
```

La spec `navegacion-por-tabs` ya exige que un panel oculto siga vivo (el log
tiene que seguir acumulando mensajes con su panel escondido), y con lit-html eso
además es obligatorio a nivel técnico: la segunda forma destruye los nodos del
panel al cambiar de tab, y con ellos los mensajes acumulados. La regla vale para
cualquier panel que se agregue en el futuro.

### 5. La lista de paneles se declara una sola vez

En `main.ts`:

```ts
const PANELES = [
  { id: "conexion", titulo: "Conexión", contenido: panelConexion },
  { id: "log", titulo: "Log", contenido: panelLog },
];
```

De esa lista salen las tres cosas que hoy hay que mantener sincronizadas a mano
en `index.html`: los botones de la barra, las `<section>` de los paneles, y el
cableado de accesibilidad entre unos y otros (`id="tab-<id>"`,
`aria-controls="panel-<id>"`, `aria-labelledby`, `aria-selected`). Agregar un
panel pasa a ser agregar una línea acá y el módulo con su componente — no hay
forma de que el `aria-controls` quede apuntando a un panel que no existe, que es
justamente el error que `tabs.ts` chequea hoy en tiempo de ejecución.

El orden de la lista es el orden visual y el de tabulación. La barra se dibuja
al final de la raíz, después de los paneles, para que el recorrido por teclado
siga el orden visual — la misma razón por la que hoy va última en `index.html`.

`tabs.ts` queda como el componente de la barra: recibe la lista y el activo, y
devuelve los botones. Es el ejemplo más claro de un componente con parámetros.

**Alternativa considerada.** Seguir derivando la barra del HTML por
`aria-controls`, como hoy. Se descarta: obliga a mantener `index.html` y los
componentes en dos mitades que se tienen que corresponder, que es la clase de
desincronización que este cambio viene a eliminar.

### 6. El puerto elegido pasa a vivir en el estado

Hoy la verdad sobre qué puerto está elegido es `select.value`. Si la ventana se
redibuja (por ejemplo, al aparecer un mensaje de error), esa elección se perdería.
Por eso `puertoEntradaElegido` y `puertoSalidaElegido` son parte del estado, con
`@change` en cada `<select>` llamando a `actualizar`.

La opción elegida se marca por opción, con enlace de propiedad
(`.selected=${nombre === elegido}`), y no con `.value` sobre el `<select>`:
lit-html completa los huecos en el orden en que aparecen en la plantilla, así
que un `.value` puesto sobre el `<select>` se aplicaría antes de que existan las
`<option>`. Al implementar hay que verificar que la elección sobreviva a un
redibujado: es el punto más fácil de romper de todo el cambio.

Como el estado es ahora la única verdad, cuando no hay nada elegido el
`<select>` tiene que decirlo: si ninguna `<option>` está seleccionada, el
navegador muestra la primera resaltada igual, y la pantalla estaría afirmando
algo que el estado niega. Por eso, mientras `elegido` está vacío, el selector
abre con una opción deshabilitada "Elegí un puerto". Es la pieza que hace
sostenible la regla de que un puerto que desaparece deja la elección vacía en
vez de caer en el primero de la lista.

Consecuencia deseable: el escenario "Desapareció el puerto elegido" de la spec
deja de depender de un rodeo (comparar contra `select.value` antes de vaciar el
`<select>`) y pasa a resolverse comparando dos datos del estado.

### 7. El log: el marco es componente, las filas no

`panelLog()` devuelve el marco (título, botón "Limpiar" y el contenedor vacío de
la lista), pero las filas de mensajes se siguen agregando de a una con `prepend`,
como hoy. Meter los mensajes en el estado obligaría a redibujar hasta 500 filas
por cada mensaje MIDI que llega.

Esto convive bien con el dibujado desde la raíz porque lit-html solo vuelve a
tocar los huecos `${}`: el contenedor de la lista no tiene ninguno, así que se
crea una vez y no se lo visita nunca más. Las filas agregadas a mano adentro
sobreviven a cualquier redibujado provocado por otra parte de la ventana. Lo que
sí lo rompería es desmontar el panel, que es lo que prohíbe la decisión 4.

`inicializarLog()` toma la referencia al contenedor después del primer dibujado
y engancha el `listen` de Tauri. Cada módulo que necesite hablar con el backend
queda entonces con dos exportaciones de roles distintos: un componente, que
dibuja, y un `inicializar<X>()`, que se suscribe a lo que llega de afuera.

**Alternativa considerada.** Poner los mensajes en el estado y redibujar con la
directiva `repeat` sería más uniforme, pero exige juntar mensajes y redibujar a
lo sumo una vez por cuadro (`requestAnimationFrame`) para no trabarse: un
concepto más, y de los difíciles, a cambio de uniformidad.

### 8. `index.html` queda como esqueleto

`index.html` se reduce al `<head>` y a `<body><div id="app"></div></body>`. Todo
el marcado pasa a los componentes.

Se pierde algo real: hoy se puede leer `index.html` y ver la ventana entera de un
vistazo. Se acepta porque lo que reemplaza a esa lectura —el componente raíz en
`main.ts`— muestra lo mismo con los mismos nombres, y porque tener el marcado en
dos lugares es precisamente lo que obliga a mantenerlos sincronizados a mano.

De `styles.css` cambia una sola cosa: el `<div id="app">` se mete entre `body` y
el resto, así que las reglas de layout de columna que estaban en `body` pasan a
`#app`. Las clases que usan los componentes son las mismas de antes.

### 9. Qué hay que reescribir en AGENTS.md

Este cambio contradice tres cosas que dice hoy AGENTS.md, así que la sección
"Organización del frontend" y la de "Tabs" se reemplazan por algo como esto (el
diff se propone a la persona usuaria y se aplica con su aprobación, como pide el
propio AGENTS.md):

> - **Frontend**: TypeScript con Vite y `lit-html` para las plantillas. No
>   agregar un framework de componentes (React, Vue, Svelte) sin que la persona
>   usuaria lo pida explícitamente.
> - **Estado de la interfaz**: todo lo que la pantalla muestra vive en
>   `src/estado.ts`. Se modifica solo con `actualizar()`, que avisa a quien se
>   suscribió. Ningún módulo guarda estado propio ni lee el estado del DOM: si
>   un dato hace falta para dibujar, va en `Estado`.
> - **Componentes**: un componente es una función que devuelve una plantilla de
>   `lit-html`. Lee del estado, o recibe lo que necesita por parámetro. No tiene
>   estado interno ni ciclo de vida. Un módulo por área de la interfaz
>   (`conexion.ts`, `log.ts`, `tabs.ts`), y si además tiene que escuchar al
>   backend, exporta un `inicializar<X>()` aparte del componente.
> - **`main.ts`** es el componente raíz: arma la ventana con los demás adentro y
>   es el único lugar que llama a `render` y a `suscribir`. `index.html` es solo
>   el esqueleto (`<div id="app">`).
> - **Paneles y tabs**: la lista `PANELES` de `main.ts` es la única fuente; de
>   ahí salen la barra, las `<section>` y los atributos ARIA. Agregar un panel es
>   agregar una entrada y su módulo. La barra va última en la raíz, después de los
>   paneles, para que el recorrido por teclado siga el orden visual. Ocultar un
>   panel es `?hidden`, nunca renderizado condicional: desmontarlo le borraría al
>   log los mensajes acumulados.
> - **Excepción**: las filas del log se agregan al DOM a mano, no por plantilla,
>   porque redibujar la lista entera con cada mensaje MIDI no escala.

## Risks / Trade-offs

- **La elección de puerto se pierde en un redibujado** → es el riesgo concreto
  de la decisión 6. Se prueba a mano: elegir puertos, provocar un error de
  conexión (por ejemplo desconectando el puerto antes de conectar) y verificar
  que los selectores siguen como estaban.
- **Alguien "simplifica" un panel con renderizado condicional** → le borra al log
  los mensajes acumulados al cambiar de tab, y es un bug difícil de atribuir. Se
  mitiga escribiéndolo en AGENTS.md (decisión 9), con la razón, y verificándolo
  como escenario propio.
- **TypeScript no chequea lo que hay adentro de las plantillas** → un `<butonn>`
  mal escrito no lo detecta nadie. Mitigación: los componentes son cortos y se
  ven al correr la app; existe además un plugin oficial de lit para el editor,
  que queda como opción de cada quien y no como requisito del proyecto.
- **Primera dependencia de interfaz del proyecto** → si mañana no convence, el
  estado propio (decisión 1) es independiente de lit-html: volver a construir el
  DOM a mano afecta a los componentes, no al mecanismo de estado.
- **Redibujar mueve el foco del teclado** → lit-html reusa los nodos, así que el
  foco se conserva; la excepción es cuando el elemento enfocado queda
  deshabilitado (presionar "Conectar" y que se deshabilite), que ya pasa hoy.
  Hay que confirmar que el comportamiento no empeora, sobre todo al cambiar de
  panel.
- **Se pierde la lectura de la ventana en `index.html`** → aceptado en la
  decisión 8.
- **Redibujados de más** → aceptado a conciencia (decisión 1). Si alguna vez se
  nota, la solución es agrupar los avisos en `actualizar`, en un solo lugar.

## Migration Plan

Cada paso deja la aplicación andando y verificable a mano:

1. Agregar `lit-html` y escribir `src/estado.ts` (estado + `suscribir` +
   `actualizar`), sin que nadie lo use todavía.
2. Armar el andamio: `main.ts` como componente raíz con `PANELES`, la barra desde
   `tabs.ts`, las `<section>` con `?hidden` contra `estado.panelActivo` y las tres
   líneas de dibujado; vaciar `index.html`. El contenido de cada panel se muda tal
   cual a un componente, sin tocarle nada: como los `id` no cambian, `conexion.ts`
   y `log.ts` siguen encontrando sus nodos con `querySelector` después del primer
   dibujado y funcionan igual que antes. Al terminar este paso los tabs ya andan
   por estado y la ventana se ve idéntica.
3. Migrar `conexion.ts`: su parte del estado, el `@change` de los selectores, los
   botones y el indicador del encabezado. `establecerEstadoConectado` y
   `rellenarSelect` desaparecen.
4. Migrar `log.ts`: el marco pasa a leerse como componente y las filas siguen
   agregándose a mano, con la referencia al contenedor tomada después del primer
   dibujado.
5. Limpiar lo que quedó sin uso y revisar que ningún módulo busque nodos en el
   DOM salvo el log para su contenedor de filas.

Volver atrás es descartar la rama: el cambio es enteramente del frontend y no
deja nada persistido ni ningún contrato con el backend modificado.
