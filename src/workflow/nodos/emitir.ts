import { Send } from "lucide";

import { enviarMensaje } from "../salida";
import type { TipoDeNodo } from "../tipos";

export default {
  nombre: "Emitir",
  icono: Send,
  tieneSalida: false,
  parametros: [],
  procesar(mensaje) {
    enviarMensaje(mensaje);
  },
} satisfies TipoDeNodo;
