import { ArrowUpDown } from "lucide";

import type { TipoDeNodo } from "../tipos";

// En MIDI el primer bit de cada byte es fijo (1 en el status, 0 en los datos):
// se separa, se desplazan los 7 bits restantes y se vuelve a poner.
const LEADING_BIT = 0b1000_0000;
const RESTO = 0b0111_1111;

export default {
  nombre: "Desplazar",
  icono: ArrowUpDown,
  parametros: [
    {
      clave: "byte",
      etiqueta: "Byte",
      tipo: "opciones",
      inicial: 1,
      opciones: [
        { valor: 0, texto: "1.º (status)" },
        { valor: 1, texto: "2.º (datos 1)" },
        { valor: 2, texto: "3.º (datos 2)" },
      ],
    },
    { clave: "desplazamiento", etiqueta: "Desplazamiento", tipo: "entero", inicial: 0 },
    { clave: "overflow", etiqueta: "Overflow", tipo: "si-no", inicial: false },
  ],
  procesar(mensaje, parametros) {
    const posicion = Number(parametros.byte);
    if (posicion >= mensaje.length) {
      return mensaje;
    }

    const byte = mensaje[posicion];
    const leading = byte & LEADING_BIT;
    const desplazado = (byte & RESTO) + Number(parametros.desplazamiento);
    // `& RESTO` se queda con los 7 bits de abajo: es tomar módulo 128, y por el
    // complemento a dos también da bien con resultados negativos.
    const resto = parametros.overflow
      ? desplazado & RESTO
      : Math.min(Math.max(desplazado, 0), RESTO);

    mensaje[posicion] = leading | resto;
    return mensaje;
  },
} satisfies TipoDeNodo;
