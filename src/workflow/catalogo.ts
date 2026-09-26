import { Zap } from "lucide";

import desplazar from "./nodos/desplazar";
import emitir from "./nodos/emitir";
import type { TipoDeNodo } from "./tipos";

// Para sumar un tipo de nodo: importarlo arriba y agregarlo acá. El orden de
// esta lista es el orden de la barra de herramientas.
const tipos = {
  desplazar,
  emitir,
} satisfies Record<string, TipoDeNodo>;

export type IdDeTipo = keyof typeof tipos;

// `satisfies` conserva el tipo exacto de cada entrada (en Desplazar, por
// ejemplo, `tieneSalida` ni existe); acá se lo generaliza a `TipoDeNodo`.
export const TIPOS_DE_NODO: Record<IdDeTipo, TipoDeNodo> = tipos;

export const TRIGGER = {
  nombre: "Mensaje MIDI recibido",
  icono: Zap,
};

// El valor por defecto vive acá y en ningún otro lado: leer `tipo.tieneSalida`
// directo daría `undefined` en los tipos que no lo declaran, y eso cuenta como
// "sin salida".
export function tieneSalida(tipo: TipoDeNodo): boolean {
  return tipo.tieneSalida ?? true;
}
