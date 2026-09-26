# Cómo crear un tipo de nodo

Cada caja que aparece en la barra del tab **Workflow** es un *tipo de nodo*, y
cada tipo de nodo vive en un archivo de esta carpeta. Para crear uno nuevo no
hace falta saber nada del editor ni del lienzo: alcanza con escribir un archivo
y agregar una línea en el catálogo.

## Los pasos

1. **Creá el archivo** en esta carpeta, con un nombre en minúsculas que diga
   qué hace la caja: por ejemplo, `sin-nota-off.ts`. Lo más fácil es copiar
   `desplazar.ts` y cambiarlo.
2. **Registralo en el catálogo.** Abrí `src/workflow/catalogo.ts`, importá tu
   archivo arriba y agregalo a la lista `tipos`:

   ```ts
   import sinNotaOff from "./nodos/sin-nota-off";

   const tipos = {
     desplazar,
     sinNotaOff,
     emitir,
   } satisfies Record<string, TipoDeNodo>;
   ```

   El nombre que uses en la lista (`sinNotaOff`) es el identificador del tipo:
   no puede repetirse. El orden de la lista es el orden de la barra.

   Si te olvidás de este paso, no aparece ningún error: la caja simplemente no
   aparece en la barra. Es lo primero que conviene revisar cuando "no anda".
3. **Probalo.** Levantá la aplicación, andá al tab Workflow y usá tu caja como
   cualquier otra.

## Qué va en el archivo

Un tipo de nodo es un objeto con estos campos:

- **`nombre`**: el texto que se ve en la barra y en la caja.
- **`icono`**: un ícono de [Lucide](https://lucide.dev/icons/). Buscá uno en
  esa página, copiá su nombre tal como aparece en el código de ejemplo (en
  *PascalCase*, por ejemplo `ArrowUpDown` o `Filter`) e importalo arriba del
  archivo: `import { Filter } from "lucide";`. Si escribís mal el nombre, el
  editor de código te lo marca.
- **`tieneSalida`**: solo hace falta escribirlo, con `false`, si la caja
  *termina* el flujo, como Emitir. Si no lo escribís, la caja tiene salida.
- **`parametros`**: lo que la persona usuaria puede configurar en la caja. Cada
  parámetro tiene una `clave` (el nombre con que lo vas a leer), una `etiqueta`
  (el texto que se ve en el panel), un `tipo` y un valor `inicial`. Los tipos
  disponibles son:
  - `"entero"`: un número entero (acepta negativos).
  - `"si-no"`: una casilla para marcar o desmarcar.
  - `"opciones"`: una lista cerrada. Cada opción tiene un `valor` y un `texto`.

  Si la caja no se configura, poné `parametros: []`.
- **`procesar(mensaje, parametros)`**: la función donde la caja hace su trabajo.

Terminá el objeto con `satisfies TipoDeNodo`: así el editor de código te avisa
si falta algún campo o si alguno tiene la forma equivocada.

## La función `procesar`

Se llama una vez por cada mensaje MIDI que llega a la caja, y recibe:

- **`mensaje`**: el mensaje como una lista de números, uno por byte. Por
  ejemplo, un *Nota On* en el canal 1, nota 60 (Do central) y velocidad 100 es
  `[0x90, 60, 100]`. La lista es una copia solo para esta caja: la podés
  modificar tranquila, sin afectar a las otras ramas del flujo.
- **`parametros`**: los valores que tiene configurados esta caja, por `clave`.
  Por ejemplo, `parametros.desplazamiento`. Para usarlos como número, envolvelos
  en `Number(...)`.

Lo que devuelve decide qué pasa después:

- **Una lista de bytes**: ese mensaje sigue hacia las cajas conectadas a la
  salida. Puede ser la misma lista que recibiste, modificada.
- **Nada** (`return;` o `return null;`): el mensaje se descarta y esa rama del
  flujo termina ahí.

Cada byte tiene que ser un entero entre 0 y 255. Si la función devuelve otra
cosa, o si tira un error, el mensaje se descarta, aparece un aviso en la
consola de desarrollo y el resto del flujo sigue funcionando.

Tené en cuenta que la aplicación no verifica que el mensaje tenga sentido MIDI.
Por ejemplo, si desplazás el status de un *Nota On* (tres bytes) hasta un
*Program Change* (que usa dos), queda un byte de más, y el mensaje sale igual.
Si tu caja puede generar casos así, conviene que los revise y los descarte.

## Ejemplo completo: descartar los Nota Off

Esta caja deja pasar todo salvo los *Nota Off*. En MIDI, un Nota Off puede
llegar de dos maneras: con status `0x80` a `0x8F`, o como un *Nota On*
(`0x90` a `0x9F`) con velocidad 0.

```ts
import { Filter } from "lucide";

import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Sin Nota Off",
  icono: Filter,
  parametros: [],
  procesar(mensaje) {
    const tipo = mensaje[0] & 0xf0; // los 4 bits de arriba del status dicen el tipo
    const esNotaOff = tipo === 0x80 || (tipo === 0x90 && mensaje[2] === 0);
    if (esNotaOff) {
      return;
    }
    return mensaje;
  },
} satisfies TipoDeNodo;
```

No escribe `tieneSalida` porque la caja deja pasar los mensajes hacia las
siguientes.

## Si necesitás código compartido

Si varias cajas usan la misma función auxiliar, ponela en un archivo **fuera**
de esta carpeta (por ejemplo, en `src/workflow/`) e importala desde tus nodos.
Esta carpeta es solo para los tipos de nodo, así queda claro qué hay.

Tampoco importes nada del editor, del lienzo ni de la interfaz: un tipo de nodo
solo usa `../tipos`, su ícono de `lucide` y, si le hace falta, utilidades para
MIDI como `../salida`, que es lo que usa Emitir para mandar el mensaje al
puerto.
