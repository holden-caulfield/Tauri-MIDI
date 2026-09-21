import { listen } from "@tauri-apps/api/event";

interface MensajeMidi {
  puerto: string;
  marca_temporal_ms: number;
  datos: number[];
  descripcion: string;
}

const MAXIMO_MENSAJES_EN_PANTALLA = 500;

function formatearBytes(datos: number[]): string {
  return datos
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

function formatearHora(marcaTemporalMs: number): string {
  const fecha = new Date(marcaTemporalMs);
  const hora = fecha.toLocaleTimeString("es-AR", { hour12: false });
  const milisegundos = String(fecha.getMilliseconds()).padStart(3, "0");
  return `${hora}.${milisegundos}`;
}

function crearFilaMensaje(mensaje: MensajeMidi): HTMLDivElement {
  const fila = document.createElement("div");
  fila.className = "fila-mensaje";

  const columnaHora = document.createElement("span");
  columnaHora.className = "columna-hora";
  columnaHora.textContent = formatearHora(mensaje.marca_temporal_ms);

  const columnaBytes = document.createElement("span");
  columnaBytes.className = "columna-bytes";
  columnaBytes.textContent = formatearBytes(mensaje.datos);

  const columnaDescripcion = document.createElement("span");
  columnaDescripcion.className = "columna-descripcion";
  columnaDescripcion.textContent = mensaje.descripcion;

  fila.append(columnaHora, columnaBytes, columnaDescripcion);
  return fila;
}

export async function inicializarLog() {
  const listaMensajes = document.querySelector<HTMLDivElement>(
    "#lista-mensajes",
  )!;
  const botonLimpiar = document.querySelector<HTMLButtonElement>(
    "#boton-limpiar-log",
  )!;

  botonLimpiar.addEventListener("click", () => {
    listaMensajes.innerHTML = "";
  });

  await listen<MensajeMidi>("mensaje-midi", (evento) => {
    listaMensajes.prepend(crearFilaMensaje(evento.payload));

    while (listaMensajes.childElementCount > MAXIMO_MENSAJES_EN_PANTALLA) {
      listaMensajes.removeChild(listaMensajes.lastChild as ChildNode);
    }
  });
}
