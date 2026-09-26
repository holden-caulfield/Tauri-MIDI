import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { html } from "lit-html";

import { actualizar, estado } from "./estado";

function puertoVigente(elegido: string, puertos: string[]): string {
  return puertos.includes(elegido) ? elegido : "";
}

async function actualizarListaDePuertos() {
  const [puertosEntrada, puertosSalida] = await Promise.all([
    invoke<string[]>("listar_puertos_entrada"),
    invoke<string[]>("listar_puertos_salida"),
  ]);

  actualizar({
    puertosEntrada,
    puertosSalida,
    puertoEntradaElegido: puertoVigente(estado.puertoEntradaElegido, puertosEntrada),
    puertoSalidaElegido: puertoVigente(estado.puertoSalidaElegido, puertosSalida),
  });
}

async function conectar() {
  actualizar({ mensajeConexion: "" });

  const puertoEntrada = estado.puertoEntradaElegido;
  const puertoSalida = estado.puertoSalidaElegido;

  if (!puertoEntrada || !puertoSalida) {
    actualizar({ mensajeConexion: "Elegí un puerto de entrada y uno de salida" });
    return;
  }

  try {
    await invoke("conectar", { puertoEntrada, puertoSalida });
    actualizar({ conectado: true });
  } catch (error) {
    actualizar({ mensajeConexion: `Error al conectar: ${error}` });
  }
}

async function desconectar() {
  actualizar({ mensajeConexion: "" });

  try {
    await invoke("desconectar");
  } finally {
    actualizar({ conectado: false });
  }
}

function selectorDePuerto(
  id: string,
  etiqueta: string,
  puertos: string[],
  elegido: string,
  alElegir: (puerto: string) => void,
) {
  return html`
    <div class="campo">
      <label for=${id}>${etiqueta}</label>
      <select
        id=${id}
        ?disabled=${estado.conectado}
        @change=${(evento: Event) =>
          alElegir((evento.target as HTMLSelectElement).value)}
      >
        ${puertos.length === 0
          ? html`<option disabled selected>No hay puertos disponibles</option>`
          : html`
              <option value="" disabled .selected=${elegido === ""}>
                Elegí un puerto
              </option>
              ${puertos.map(
                (puerto) =>
                  html`<option value=${puerto} .selected=${puerto === elegido}>${puerto}</option>`,
              )}
            `}
      </select>
    </div>
  `;
}

export function indicadorDeEstado() {
  return html`
    <p
      class="estado ${estado.conectado
        ? "estado-conectado"
        : "estado-desconectado"}"
      aria-live="polite"
    >
      ${estado.conectado ? "Conectado" : "Desconectado"}
    </p>
  `;
}

export function panelConexion() {
  return html`
    <p class="subtitulo">
      Elegí un puerto de entrada y uno de salida para ver los mensajes MIDI que
      pasan por la aplicación.
    </p>

    ${selectorDePuerto(
      "select-puerto-entrada",
      "Puerto de entrada",
      estado.puertosEntrada,
      estado.puertoEntradaElegido,
      (puerto) => actualizar({ puertoEntradaElegido: puerto }),
    )}
    ${selectorDePuerto(
      "select-puerto-salida",
      "Puerto de salida",
      estado.puertosSalida,
      estado.puertoSalidaElegido,
      (puerto) => actualizar({ puertoSalidaElegido: puerto }),
    )}

    <div class="fila-botones">
      <button
        type="button"
        ?disabled=${estado.conectado}
        @click=${actualizarListaDePuertos}
      >
        Actualizar puertos
      </button>
      <button type="button" ?disabled=${estado.conectado} @click=${conectar}>
        Conectar
      </button>
      <button type="button" ?disabled=${!estado.conectado} @click=${desconectar}>
        Desconectar
      </button>
    </div>

    <p class="mensaje-conexion">${estado.mensajeConexion}</p>
  `;
}

export async function inicializarConexion() {
  await listen<string>("conexion-perdida", (evento) => {
    actualizar({ conectado: false, mensajeConexion: evento.payload });
  });

  await actualizarListaDePuertos();
}
