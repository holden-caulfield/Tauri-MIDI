import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface MensajeMidi {
  puerto: string;
  marca_temporal_ms: number;
  datos: number[];
  descripcion: string;
}

const MAXIMO_MENSAJES_EN_PANTALLA = 500;

let selectPuertoEntrada: HTMLSelectElement;
let selectPuertoSalida: HTMLSelectElement;
let botonActualizarPuertos: HTMLButtonElement;
let botonConectar: HTMLButtonElement;
let botonDesconectar: HTMLButtonElement;
let botonLimpiarLog: HTMLButtonElement;
let textoEstado: HTMLParagraphElement;
let listaMensajes: HTMLDivElement;

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

function agregarMensajeAlLog(mensaje: MensajeMidi) {
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
  listaMensajes.prepend(fila);

  while (listaMensajes.childElementCount > MAXIMO_MENSAJES_EN_PANTALLA) {
    listaMensajes.removeChild(listaMensajes.lastChild as ChildNode);
  }
}

function rellenarSelect(select: HTMLSelectElement, opciones: string[]) {
  const valorPrevio = select.value;
  select.innerHTML = "";

  if (opciones.length === 0) {
    const opcionVacia = document.createElement("option");
    opcionVacia.textContent = "No hay puertos disponibles";
    opcionVacia.disabled = true;
    opcionVacia.selected = true;
    select.append(opcionVacia);
    return;
  }

  for (const nombre of opciones) {
    const opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    select.append(opcion);
  }

  if (opciones.includes(valorPrevio)) {
    select.value = valorPrevio;
  }
}

async function actualizarListaDePuertos() {
  const [puertosEntrada, puertosSalida] = await Promise.all([
    invoke<string[]>("listar_puertos_entrada"),
    invoke<string[]>("listar_puertos_salida"),
  ]);

  rellenarSelect(selectPuertoEntrada, puertosEntrada);
  rellenarSelect(selectPuertoSalida, puertosSalida);
}

function establecerEstadoConectado(conectado: boolean) {
  textoEstado.textContent = conectado ? "Conectado" : "Desconectado";
  textoEstado.classList.toggle("estado-conectado", conectado);
  textoEstado.classList.toggle("estado-desconectado", !conectado);

  botonConectar.disabled = conectado;
  botonDesconectar.disabled = !conectado;
  botonActualizarPuertos.disabled = conectado;
  selectPuertoEntrada.disabled = conectado;
  selectPuertoSalida.disabled = conectado;
}

async function conectar() {
  const puertoEntrada = selectPuertoEntrada.value;
  const puertoSalida = selectPuertoSalida.value;

  if (!puertoEntrada || !puertoSalida) {
    textoEstado.textContent = "Elegí un puerto de entrada y uno de salida";
    return;
  }

  try {
    await invoke("conectar", { puertoEntrada, puertoSalida });
    establecerEstadoConectado(true);
  } catch (error) {
    textoEstado.textContent = `Error al conectar: ${error}`;
  }
}

async function desconectar() {
  try {
    await invoke("desconectar");
  } finally {
    establecerEstadoConectado(false);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  selectPuertoEntrada = document.querySelector("#select-puerto-entrada")!;
  selectPuertoSalida = document.querySelector("#select-puerto-salida")!;
  botonActualizarPuertos = document.querySelector(
    "#boton-actualizar-puertos",
  )!;
  botonConectar = document.querySelector("#boton-conectar")!;
  botonDesconectar = document.querySelector("#boton-desconectar")!;
  botonLimpiarLog = document.querySelector("#boton-limpiar-log")!;
  textoEstado = document.querySelector("#texto-estado")!;
  listaMensajes = document.querySelector("#lista-mensajes")!;

  botonActualizarPuertos.addEventListener("click", actualizarListaDePuertos);
  botonConectar.addEventListener("click", conectar);
  botonDesconectar.addEventListener("click", desconectar);
  botonLimpiarLog.addEventListener("click", () => {
    listaMensajes.innerHTML = "";
  });

  await listen<MensajeMidi>("mensaje-midi", (evento) => {
    agregarMensajeAlLog(evento.payload);
  });

  await actualizarListaDePuertos();
});
