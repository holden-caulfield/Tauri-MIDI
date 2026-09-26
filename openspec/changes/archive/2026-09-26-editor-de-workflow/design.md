# Design

## Context

Ver `proposal.md` — Why para la motivación, y las specs del cambio para el
comportamiento esperado. Lo que condiciona el diseño:

- **Backend.** Hoy el callback de entrada de `midir` (en su propio hilo) reenvía
  cada mensaje a la salida y, salvo el reloj, emite el evento `mensaje-midi` al
  frontend con los bytes crudos. La salida vive en un
  `Arc<Mutex<Option<MidiOutputConnection>>>`.
- **Frontend.** Es TypeScript con lit-html. Todo lo que se dibuja sale de
  `src/estado.ts` vía `actualizar()`, y cada cambio redibuja la ventana entera
  (sin agrupar redibujados). El log es la única excepción: agrega filas a mano.
  Los paneles ocultos se ocultan con `?hidden`, nunca se desmontan.
- **Público del código.** El código lo tiene que poder seguir alguien que recién
  empieza, y crear un tipo de nodo tiene que ser una tarea chica y aislada (ver
  spec `tipos-de-nodo`).
- **Decisiones de la persona usuaria** para este cambio: el flujo se ejecuta en
  el frontend, reemplaza al pass-through (que pasa a ser el flujo por defecto:
  trigger → Emitir), el reloj MIDI lo saltea, y el lienzo se hace con una
  librería. Que los tipos de nodo no dependan de esa librería es un requisito
  no negociable. Los tipos se registran a mano en un catálogo explícito, cuyo
  orden es el de la barra, y los íconos salen de Lucide.
- **Tests.** El proyecto no tiene infraestructura de tests automatizados.

## Goals / Non-Goals

**Goals:**

- Que crear un tipo de nodo sea escribir un archivo con una declaración y una
  función, y sumarlo con una línea al catálogo, sin saber nada del lienzo.
- Que la librería del lienzo quede confinada en un solo módulo, reemplazable sin
  tocar el ejecutor, el panel de configuración ni los tipos de nodo.
- Que el grafo del flujo (qué cajas hay, cómo están configuradas y cómo se
  conectan) tenga una sola fuente de verdad, `estado.ts`, que es lo que lee el
  ejecutor.
- Que arrastrar cajas no genere un redibujado por cada movimiento del mouse.

**Non-Goals:**

- Guardar el flujo en disco, tener varios flujos, deshacer/rehacer, o
  copiar y pegar cajas.
- Conectar y mover cajas con el teclado. Agregar cajas y configurarlas sí es
  accesible; armar las conexiones queda para un cambio aparte.
- Mostrar en el log lo que sale, o señalar en el lienzo por dónde pasa cada
  mensaje.
- Mostrar en la caja un resumen de su configuración (por ejemplo, "+4 datos 1").
  Obligaría a sincronizar parámetros con la vista del lienzo; queda para
  después.
- Corregir mensajes que un nodo deje sin sentido MIDI. Por ejemplo, desplazar el
  status de un Nota On (tres bytes) hasta un Program Change (dos bytes) deja un
  byte de más: se envía igual.
- Tests automatizados, por la misma razón que en cambios anteriores. La
  aritmética de Desplazar se verifica a mano desde la consola.

## Decisions

### 1. El flujo se ejecuta en el frontend

Cada mensaje que no es reloj llega al frontend por el evento `mensaje-midi`, que
ya existe. El ejecutor recorre el grafo de `estado.ts` y, cuando llega a un
Emitir, pide al backend que lo envíe con un comando nuevo.

**Por qué:** es la única opción en la que un tipo de nodo es un solo archivo en
un solo lenguaje. Con la ejecución en Rust, cada nodo necesita su declaración
de interfaz en TS y su procesamiento en Rust, y además hay que serializar el
grafo al backend en cada cambio.

**Alternativas descartadas:** ejecutar en Rust (lo más rápido, pero duplica cada
nodo en dos lenguajes). Embeber un motor de JavaScript en Rust (QuickJS, Boa)
para correr los mismos archivos TS en el backend: da baja latencia y un solo
archivo, pero suma una pieza pesada y difícil de depurar para un proyecto de
este tamaño. Queda como salida si la latencia resulta un problema (ver
Riesgos).

### 2. Cambios en el backend

- En el callback de entrada, el reenvío pasa a hacerse solo para el reloj:

  ```rust
  if es_mensaje_de_reloj(mensaje) {
      // reenviar directo a la salida y volver: el reloj no pasa por el flujo
      return;
  }
  // emitir `mensaje-midi` como hoy, sin reenviar
  ```

  El `Arc` sobre la conexión de salida sigue haciendo falta, porque el reloj se
  reenvía desde el hilo del callback.
- Comando nuevo `enviar_mensaje(estado, datos: Vec<u8>) -> Result<(), String>`,
  que escribe en la conexión de salida si hay una. Es un comando sincrónico
  (`fn`, no `async fn`): Tauri corre los comandos sincrónicos en el hilo
  principal, uno detrás de otro, y eso ayuda a conservar el orden.
- `MensajeMidi`, `describir_mensaje` y el evento no cambian. El log sigue
  mostrando lo que entra, tal como pide la spec `ejecucion-de-workflow`.

### 3. El grafo vive en `estado.ts`; la vista del lienzo, en la librería

`Estado` suma dos campos:

```ts
export interface NodoDelFlujo {
  id: string;
  tipo: "trigger" | IdDeTipo;                     // IdDeTipo: una clave del catálogo (decisión 5)
  parametros: Record<string, ValorDeParametro>;
}

export interface Conexion {
  desde: string;                                  // id del nodo de origen
  hacia: string;                                  // id del nodo de destino
}

// en Estado:
flujo: { nodos: NodoDelFlujo[]; conexiones: Conexion[] };
nodoSeleccionado: string | null;
```

El valor inicial tiene dos nodos y una conexión entre ellos:

```ts
flujo: {
  nodos: [
    { id: "trigger", tipo: "trigger", parametros: {} },
    { id: "emitir-inicial", tipo: "emitir", parametros: {} },
  ],
  conexiones: [{ desde: "trigger", hacia: "emitir-inicial" }],
}
```

El Emitir inicial no tiene nada especial: el `id` fijo es solo para escribir el
valor inicial a mano, y se borra como cualquier otra caja. Por eso el flujo por
defecto se comporta como el pass-through de antes. Como el estado inicial nombra
el tipo `emitir`, borrar ese tipo del catálogo sin corregir el estado inicial es
un error de compilación, porque `tipo` solo admite claves del catálogo. Cada
caja tiene un único conector de
entrada y, como mucho, uno de salida. Por eso una conexión se identifica con el
par `desde`/`hacia`, y ese mismo par permite rechazar duplicados. Los cambios
reemplazan `flujo` entero (`actualizar({ flujo: { ...estado.flujo, conexiones:
[...] } })`), porque `actualizar` hace un `Object.assign` superficial.

La **posición de las cajas, el zoom y el arrastre en curso no están en
`Estado`**: son de la librería. Es la segunda excepción a la regla de
`estado.ts`, después del log, y se justifica igual: si el arrastre pasara por
`actualizar()`, cada movimiento del mouse redibujaría la ventana entera. Nada
fuera del lienzo necesita las posiciones (ni el ejecutor, ni el panel de
configuración). Cuando haga falta guardar el flujo en disco, habrá que
llevarlas al estado.

Como las posiciones no están en el estado, `montarLienzo` ubica las cajas que
dibuja por primera vez (el flujo inicial) en fila, de izquierda a derecha y en
el orden de `estado.flujo.nodos`, separadas lo suficiente para no superponerse.

**Alternativa descartada:** posiciones en `Estado` y lienzo dibujado por
lit-html. Es coherente con la regla, pero obliga a agrupar redibujados durante
el arrastre, y la persona usuaria prefirió una librería.

### 4. El contrato de un tipo de nodo (`src/workflow/tipos.ts`)

```ts
export type MensajeMidi = number[];     // alias: deja claro qué es cada number[]

export type ValorDeParametro = number | boolean | string;

// Genérico para que el valor inicial y los de las opciones sean del mismo tipo.
interface ParametroDeOpciones<T extends ValorDeParametro> {
  clave: string;
  etiqueta: string;
  tipo: "opciones";
  inicial: T;
  opciones: { valor: T; texto: string }[];
}

export type Parametro =
  | { clave: string; etiqueta: string; tipo: "entero"; inicial: number }
  | { clave: string; etiqueta: string; tipo: "si-no"; inicial: boolean }
  | ParametroDeOpciones<number>
  | ParametroDeOpciones<string>
  | ParametroDeOpciones<boolean>;

export interface TipoDeNodo {
  nombre: string;
  icono: IconNode;         // un ícono de Lucide, importado por su nombre
  tieneSalida?: boolean;   // si se omite, la caja tiene salida
  parametros: Parametro[];
  procesar(
    mensaje: MensajeMidi,
    parametros: Record<string, ValorDeParametro>,
  ): MensajeMidi | null | void;
}
```

Así queda un tipo de nodo, a grandes rasgos:

```ts
// src/workflow/nodos/desplazar.ts
import { ArrowUpDown } from "lucide";
import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Desplazar",
  icono: ArrowUpDown,
  parametros: [
    { clave: "byte", etiqueta: "Byte", tipo: "opciones", inicial: 1, opciones: [/* … */] },
    { clave: "desplazamiento", etiqueta: "Desplazamiento", tipo: "entero", inicial: 0 },
    { clave: "overflow", etiqueta: "Overflow", tipo: "si-no", inicial: false },
  ],
  procesar(mensaje, parametros) {
    // …
    return mensaje;
  },
} satisfies TipoDeNodo;
```

- `export default` con `satisfies TipoDeNodo`: el editor de código completa los
  campos y marca lo que falta.
- **`tieneSalida` es opcional y vale `true` si se omite.** Casi todos los nodos
  reciben y emiten mensajes, así que solo lo escribe el que cierra el flujo.
  Hoy ese es solo Emitir, y no se esperan otros a corto plazo. Todo el código
  que lo consulta pasa por una sola función, `tieneSalida(tipo)` en
  `catalogo.ts` (`tipo.tieneSalida ?? true`), para que el valor por defecto
  viva en un solo lugar.
- **El tipo no declara su identificador.** El identificador es la clave con que
  se lo registra en el catálogo (decisión 5), así que no puede quedar
  desincronizado con el archivo, y dos tipos no pueden compartirlo.
- `procesar` recibe una copia del mensaje, así que puede modificarla y
  devolverla sin cuidarse de las otras ramas (spec `tipos-de-nodo`).
- `emitir.ts` es un tipo más, con `tieneSalida: false`, y su `procesar` llama a
  `enviarMensaje(mensaje)` de `src/workflow/salida.ts`. Los tipos de nodo pueden
  importar ese módulo, pero ningún otro de la interfaz.
- El trigger **no** es un tipo de nodo: hay uno solo, no se agrega desde la barra
  y no procesa nada. Su nombre y su ícono son una constante en `catalogo.ts`.
  Convertirlo en un tipo sería diseñar para triggers futuros que todavía no se
  pidieron.
- Los tipos de parámetro son exactamente los tres que necesita Desplazar. Sumar
  uno nuevo (por ejemplo, texto) implica tocar `tipos.ts` y el panel de
  configuración. Eso no lo hace quien crea un nodo.

**La aritmética de Desplazar: separar el leading bit.** En MIDI, el bit más
significativo de cada byte es fijo: 1 en el status y 0 en los datos. Por eso los
dos rangos tienen 128 valores: 128–255 y 0–127. En vez de tratar distinto cada
clase de byte, `desplazar.ts` separa el leading bit con una máscara, desplaza
los 7 bits restantes (siempre en el rango 0–127) y vuelve a poner el leading
bit:

```ts
const LEADING_BIT = 0b1000_0000;
const RESTO = 0b0111_1111;

const byte = mensaje[posicion];
const leading = byte & LEADING_BIT;
const desplazado = (byte & RESTO) + desplazamiento;
const resto = overflow
  ? desplazado & RESTO
  : Math.min(Math.max(desplazado, 0), 127);
mensaje[posicion] = leading | resto;
```

- La misma cuenta sirve para los tres bytes, sin saber cuál es de status y
  cuál de datos, y el leading bit queda como vino.
- Con overflow, `& RESTO` se queda con los 7 bits de abajo, que es tomar módulo
  128. Como los operadores de bits de JavaScript trabajan en complemento a dos,
  también da bien con resultados negativos (`-3 & 0x7F` es 125) y con más de una
  vuelta. No hace falta ningún caso especial.
- Sin overflow, el tope es 0–127 para todos los bytes.

### 5. El catálogo es un registro explícito (`src/workflow/catalogo.ts`)

```ts
import desplazar from "./nodos/desplazar";
import emitir from "./nodos/emitir";

// El orden de esta lista es el orden de la barra de herramientas.
const tipos = {
  desplazar,
  emitir,
} satisfies Record<string, TipoDeNodo>;

export type IdDeTipo = keyof typeof tipos;

export const TIPOS_DE_NODO: Record<IdDeTipo, TipoDeNodo> = tipos;
```

- **Sumar un tipo** es crear su archivo en `nodos/` y agregar dos líneas acá: el
  `import` y la entrada en la lista.
- **La clave es el identificador del tipo.** TypeScript no admite dos claves
  iguales en un mismo objeto literal, así que un identificador repetido es un
  error de compilación. `satisfies` chequea que cada entrada cumpla el
  contrato. No hace falta ninguna validación en tiempo de ejecución.
- **Dos nombres para la misma lista.** `satisfies` conserva el tipo exacto de
  cada entrada, y eso es lo que permite derivar `IdDeTipo`. Pero entonces
  `tipos[id]` es la unión de esos tipos exactos, y en Desplazar `tieneSalida`
  ni existe. `TIPOS_DE_NODO` es la misma lista, generalizada a `TipoDeNodo`,
  y es la que usa el resto del código.
- **El orden de la barra es el de la lista.** Cuando haya muchos tipos, lo
  natural es agruparlos por afinidad (transformaciones, filtros, salidas), y no
  por orden alfabético. Con el registro, ese orden es explícito y se cambia
  moviendo una línea.
- **Lo lee alguien semi-técnico:** es una lista de imports y un objeto, sin
  magia del bundler.
- Acá viven también `tieneSalida(tipo)` (decisión 4) y la constante con el
  nombre ("Mensaje MIDI recibido") y el ícono del trigger.

**Alternativa descartada: descubrir los archivos solos con `import.meta.glob`.**
Ahorra el paso de registrar, pero el orden queda alfabético, depende de una
función de Vite, y obliga a validar en tiempo de ejecución lo que TypeScript no
ve de un archivo levantado por glob. Esa validación es más código que el
registro que ahorra. El riesgo del registro es olvidarse de agregar la línea, y
el síntoma es visible: el nodo no aparece en la barra. La guía lo pone como
paso explícito.

Ninguna de las dos variantes cambia la independencia de los tipos de nodo
respecto del lienzo, que es el requisito no negociable: el catálogo solo
importa los tipos, y `lienzo.ts` recibe `TipoDeNodo`, nunca al revés.

### 6. El ejecutor (`src/workflow/ejecutar.ts`)

`inicializarWorkflow()` escucha `mensaje-midi` (igual que el log, cada uno por
su lado) y, por cada mensaje, hace un recorrido en profundidad desde el trigger:

```
entregar(nodoId, mensaje):
  para cada conexión con desde === nodoId:
    procesarEn(conexión.hacia, copia de mensaje)

procesarEn(nodoId, mensaje):
  tipo = tipo del nodo
  resultado = try tipo.procesar(mensaje, nodo.parametros) / catch → console.error y cortar
  si tipo.tieneSalida y resultado es un mensaje válido: entregar(nodoId, resultado)
```

- El grafo se lee de `estado.flujo` en cada mensaje, así que los cambios de
  configuración rigen desde el mensaje siguiente.
- "Mensaje válido" es una lista no vacía de enteros entre 0 y 255. Si no lo es,
  se descarta con `console.warn`, que nombra el tipo de nodo.
- Como las conexiones que cierran un ciclo se rechazan al crearlas (decisión 7),
  el recorrido siempre termina.
- `enviarMensaje` (`salida.ts`) **encola** los envíos: cada `invoke` espera al
  anterior. `invoke` es asincrónico, y nada garantiza que dos pedidos
  simultáneos lleguen al backend en orden. La cola sí garantiza el orden que
  exige la spec. A cambio, en un acorde cada nota espera el ida y vuelta de la
  anterior (ver Riesgos).

### 7. El lienzo con Rete.js v2, confinado en `src/workflow/lienzo.ts`

Se usan `rete`, `rete-area-plugin` (paneo, zoom, mover cajas y selección),
`rete-connection-plugin` (conectar arrastrando, y soltar en el vacío una
conexión levantada desde su entrada para borrarla), `rete-render-utils` y
`@retejs/lit-plugin` con el preset clásico. El preset se personaliza para que la
caja muestre ícono y nombre. `lit` entra como dependencia del plugin; nuestro
código sigue usando solo `lit-html` (`lit` lo incluye, así que no se duplica).

**Por qué Rete:** está mantenida, está escrita en TypeScript y trae un
renderizador oficial basado en Lit, de la misma familia que lit-html. Además
permite interceptar la creación de una conexión y cancelarla, que es justo lo
que hace falta para rechazar ciclos.

**Alternativas descartadas:**

- **Drawflow**: vanilla y simple, pero con poco mantenimiento. Las cajas son
  strings de HTML, y la configuración queda atada a atributos `df-*` del DOM de
  la librería.
- **LiteGraph**: cada tipo de nodo es una clase de la librería, y eso choca con
  el contrato de tipos de nodo.
- **`@xyflow/system`**: el núcleo sin framework de React Flow. Es de muy bajo
  nivel y casi no tiene documentación para usarlo suelto.
- **Hacerlo a mano con SVG**: ver decisión 3.

**Frontera.** `lienzo.ts` es el único módulo que importa Rete. Expone:

- `montarLienzo(contenedor)`: crea el editor y dibuja lo que haya en
  `estado.flujo`.
- `agregarNodo(tipo, posicion?)` y `eliminarNodo(id)`: tocan a la vez el estado
  y la vista.
- `posicionDesdeEvento(evento)`: traduce un `drop` a coordenadas del lienzo.

Hacia el estado, escucha los eventos del editor:

- **Creación de conexión**: la valida contra `estado.flujo` (misma caja,
  duplicada o ciclo; el ciclo se detecta buscando si `desde` es alcanzable
  desde `hacia`). Si no pasa, la cancela; si pasa, la agrega al estado.
- **Conexión borrada**: la saca del estado.
- **Caja elegida o clic en el vacío**: actualiza `nodoSeleccionado`.

Dos detalles que aparecieron al implementarlo:

- **Selección.** Rete no vuelve a ejecutar la plantilla de una caja
  personalizada: solo sabe redibujar componentes Lit, y con una plantilla de
  lit-html tira `requestUpdate is not a function`. Por eso no se usa su
  extensión de selección. `lienzo.ts` marca la caja elegida con una clase en
  el contenedor que Rete le da a cada caja, siguiendo a `nodoSeleccionado`.
- **Conectores.** Rete ubica las conexiones sumando desplazamientos del DOM
  (`offsetTop`/`offsetLeft`), sin tener en cuenta `transform`. Por eso los
  conectores se centran con flexbox y no con `translateY(-50%)`.

No hay reconciliación general entre estado y vista: el flujo solo cambia por
esas funciones y eventos, y los parámetros no se ven en la caja. Si mañana se
reemplaza Rete, se reescribe este archivo y nada más.

### 8. Montaje del lienzo y el tab oculto

El contenedor del lienzo es un `<div class="lienzo">` sin contenido dinámico en
la plantilla. lit-html lo conserva entre redibujados y no toca lo que la
librería dibuja adentro, igual que pasa con la lista del log.

Rete mide cajas y conectores con el tamaño que tienen en pantalla, y dentro de
un panel `hidden` todo mide cero. Por eso el lienzo se monta **la primera vez
que el tab Workflow queda visible**: `main.ts`, después de cada `render`, llama
a `asegurarLienzo()`, que es idempotente, si `panelActivo === "workflow"`. El
lienzo no puede cambiar mientras está oculto, así que al volver a mostrarlo las
medidas siguen valiendo. El ejecutor no depende del lienzo: lee el estado, que
ya tiene el flujo inicial (trigger → Emitir) desde el arranque.

### 9. Barra de herramientas y panel de configuración (`src/workflow/panel.ts`)

`panelWorkflow()` es un componente lit-html común que arma tres partes: la
barra, el contenedor del lienzo y el panel de configuración.

- **Barra**: un `<button draggable="true">` por cada tipo de `TIPOS_DE_NODO`. El
  arrastre usa el drag and drop nativo de HTML5: `dragstart` guarda el `id` del
  tipo, y el `drop` sobre el lienzo llama a
  `agregarNodo(tipo, posicionDesdeEvento(e))`. El clic (y por lo tanto Enter y
  la barra espaciadora) llama a `agregarNodo(tipo)`, que ubica la caja en el
  centro de la zona visible, corrida un poco con cada agregado para que no
  queden apiladas.
  Para que el drag and drop de HTML5 funcione dentro de la ventana de Tauri, la
  ventana se configura con `"dragDropEnabled": false` en `tauri.conf.json`. Si
  no, Tauri captura todo arrastre sobre la ventana para su manejo de archivos
  soltados, y el `drop` nunca llega a la página (confirmado en la prueba de
  concepto). La aplicación no usa soltar archivos, así que no se pierde nada.
- **Panel de configuración**: lee `estado.nodoSeleccionado` y genera un campo
  por parámetro declarado. `entero` es un `<input type="number" step="1">` que
  solo actualiza si `Number.isInteger` da verdadero. `si-no` es un checkbox.
  `opciones` es un `<select>` que guarda el índice de la opción, para conservar
  el tipo del valor. Para cualquier caja que no sea el trigger hay un botón
  "Eliminar caja", y un texto de ayuda explica cómo borrar una conexión.

### 10. Íconos: Lucide

Se usa el paquete `lucide` (la versión sin framework). Cada tipo de nodo importa
su ícono por nombre (`import { ArrowUpDown } from "lucide"`) y lo pone en
`icono`. `src/workflow/iconos.ts` expone `dibujarIcono(icono)`, que usa
`createElement` de Lucide para generar el `<svg>` en línea con un tamaño común.
lit-html acepta ese elemento como contenido de una plantilla.

**Por qué Lucide:**

- **SVG por defecto.** Las cajas del lienzo las dibuja el plugin de Lit,
  posiblemente dentro de *shadow DOM*, adonde no llegan las clases CSS
  globales. Un SVG en línea se ve igual dentro y fuera de *shadow DOM*.
- **Estilos flexibles.** Los íconos se dibujan con trazo en `currentColor`, así
  que toman el color del texto y se les puede cambiar tamaño y grosor de línea.
- **Más variedad** que el set gratuito de Font Awesome.
- **Tree-shaking.** Como cada ícono se importa por nombre y el paquete está
  marcado sin efectos secundarios, al paquete final solo llegan los íconos
  usados.
- **Un ícono que no existe es un error de compilación**, no un ícono de
  pregunta en tiempo de ejecución, así que `iconos.ts` no necesita manejar ese
  caso.

Quien crea un nodo busca el ícono en lucide.dev, copia su nombre en PascalCase y
lo importa. Importar `lucide` en el archivo del nodo no afecta el requisito no
negociable: Lucide es la librería de íconos, no la del lienzo.

**Alternativa descartada:** Font Awesome Free. Es conocida, pero en versión SVG
nombrar íconos por texto obliga a cargar el set entero, y su set gratuito es
más chico.

Íconos iniciales: trigger `Zap`, Desplazar `ArrowUpDown`, Emitir `Send`.

### 11. Organización de archivos

```
src/workflow/
  tipos.ts        contrato TipoDeNodo y Parametro
  catalogo.ts     registro TIPOS_DE_NODO, tieneSalida() y datos del trigger
  ejecutar.ts     inicializarWorkflow(): escucha mensajes y recorre el flujo
  salida.ts       enviarMensaje(): cola de envíos al backend
  lienzo.ts       única frontera con Rete
  iconos.ts       dibujarIcono(icono)
  panel.ts        panelWorkflow(): barra, lienzo y configuración
  nodos/
    LEEME.md      guía para crear un tipo de nodo
    desplazar.ts
    emitir.ts
```

Es la primera subcarpeta de `src/`. Se justifica porque el área tiene varias
piezas, y porque `nodos/` le da a quien crea un tipo de nodo un lugar obvio
donde mirar y copiar, separado de la maquinaria del editor. Las demás áreas
siguen como un módulo suelto cada una.

## Risks / Trade-offs

- **[Latencia y jitter del ida y vuelta a la webview]** El mensaje va por evento
  al frontend y vuelve por `invoke`, a lo que se suma la cola de envíos. Se
  esperan pocos milisegundos, más si la webview está ocupada (por ejemplo,
  mientras se arrastra una caja). → Medirlo en la verificación con el IAC
  Driver, tocando acordes. Si resulta perceptible, hay mejoras de a pasos:
  primero juntar en un solo `invoke` todo lo que produce un mensaje, y después
  mover la ejecución al backend con un motor JS embebido (decisión 1).
- **[El ruteo depende de la ventana]** Si la webview se cuelga o recarga, deja
  de salir MIDI (salvo el reloj). → Se acepta: es una aplicación de escritorio
  de una ventana y la persona usuaria eligió esta opción.
- **[Rete + plugin de Lit no se comportan como se espera]** Puede fallar la
  personalización de la caja, el drop desde una barra externa, la selección, o
  la interacción con WKWebView. → La primera tarea es una prueba de concepto
  acotada, con criterios de salida claros. Si falla, el plan B es Drawflow
  detrás de la misma frontera (`lienzo.ts`), sin tocar specs ni el resto del
  diseño.
- **[`lit` entra como dependencia]** AGENTS.md prohíbe sumar un framework de
  componentes sin pedido explícito. → La persona usuaria pidió una librería para
  el lienzo, y `lit` viene con ella. Nuestro código no escribe `LitElement` ni
  componentes web: sigue usando funciones de lit-html. Esto se deja escrito en
  AGENTS.md al archivar.
- **[Paquete más pesado]** Rete y sus plugins suman peso al paquete. → Es una
  aplicación de escritorio que se carga desde disco, así que no afecta. Los
  íconos no suman casi nada: con el tree-shaking de Lucide solo entran los
  usados.
- **[Olvidar registrar un tipo de nodo]** Si alguien crea el archivo y no lo
  agrega al catálogo, el nodo no aparece. → El síntoma es inmediato y visible,
  y la guía lo pone como paso numerado.
- **[Borrar el Emitir inicial silencia la salida]** Como el flujo por defecto es
  trigger → Emitir, al actualizar no cambia nada visible. Pero si la persona
  usuaria borra ese Emitir, deja de salir MIDI, y puede no entender por qué. →
  La ayuda del tab Workflow explica que solo sale lo que llega a un Emitir.
- **[Desplazar el status puede generar mensajes raros]** → Queda en Non-Goals.
  La guía de nodos lo usa como ejemplo de por qué un nodo puede querer validar
  lo que produce.

## Migration Plan

No hay datos que migrar: el flujo no se guarda. Al instalar la versión nueva,
el comportamiento visible no cambia, porque el flujo por defecto reenvía todo
como el pass-through de antes. Para volver atrás se
revierte el PR: el backend vuelve a reenviar todo, y el frontend deja de tener
el tab.

## Open Questions

- Los íconos exactos de cada caja y el aspecto final del lienzo (colores, tamaño
  de las cajas) se ajustan viendo la aplicación y no cambian specs ni tareas.
