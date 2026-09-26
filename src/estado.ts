import type { IdDeTipo } from "./workflow/catalogo";
import type { ValorDeParametro } from "./workflow/tipos";

export interface NodoDelFlujo {
  id: string;
  tipo: "trigger" | IdDeTipo;
  parametros: Record<string, ValorDeParametro>;
}

export interface Conexion {
  desde: string;
  hacia: string;
}

export interface Flujo {
  nodos: NodoDelFlujo[];
  conexiones: Conexion[];
}

/**
 * Todo lo que la pantalla muestra vive acá: los componentes lo leen para
 * dibujarse y nadie lo modifica sin pasar por `actualizar`.
 */
export interface Estado {
  conectado: boolean;
  puertosEntrada: string[];
  puertosSalida: string[];
  puertoEntradaElegido: string;
  puertoSalidaElegido: string;
  mensajeConexion: string;
  panelActivo: string;
  flujo: Flujo;
  nodoSeleccionado: string | null;
}

export const estado: Estado = {
  conectado: false,
  puertosEntrada: [],
  puertosSalida: [],
  puertoEntradaElegido: "",
  puertoSalidaElegido: "",
  mensajeConexion: "",
  panelActivo: "conexion",
  flujo: {
    nodos: [
      { id: "trigger", tipo: "trigger", parametros: {} },
      { id: "emitir-inicial", tipo: "emitir", parametros: {} },
    ],
    conexiones: [{ desde: "trigger", hacia: "emitir-inicial" }],
  },
  nodoSeleccionado: null,
};

const observadores: Array<() => void> = [];

export function suscribir(observador: () => void) {
  observadores.push(observador);
}

export function actualizar(cambios: Partial<Estado>) {
  Object.assign(estado, cambios);

  for (const observador of observadores) {
    observador();
  }
}
