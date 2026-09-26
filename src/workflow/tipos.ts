import type { IconNode } from "lucide";

/** Un mensaje MIDI: la lista de sus bytes, del status en adelante. */
export type MensajeMidi = number[];

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

/**
 * Todo lo que hace falta para definir un tipo de nodo. Ver la guía en
 * `nodos/LEEME.md`.
 */
export interface TipoDeNodo {
  nombre: string;
  icono: IconNode;
  /** Si se omite, la caja tiene salida. */
  tieneSalida?: boolean;
  parametros: Parametro[];
  /**
   * Recibe una copia del mensaje (se puede modificar sin afectar a otras
   * ramas) y devuelve el mensaje que pasa a las cajas siguientes, o nada para
   * descartarlo.
   */
  procesar(
    mensaje: MensajeMidi,
    parametros: Record<string, ValorDeParametro>,
  ): MensajeMidi | null | void;
}
