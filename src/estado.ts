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
}

export const estado: Estado = {
  conectado: false,
  puertosEntrada: [],
  puertosSalida: [],
  puertoEntradaElegido: "",
  puertoSalidaElegido: "",
  mensajeConexion: "",
  panelActivo: "conexion",
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
