import { listen } from "@tauri-apps/api/event";

import { estado } from "../estado";
import { tieneSalida, TIPOS_DE_NODO } from "./catalogo";
import type { MensajeMidi } from "./tipos";

interface EventoMidi {
  datos: MensajeMidi;
}

function esMensajeValido(resultado: unknown): resultado is MensajeMidi {
  return (
    Array.isArray(resultado) &&
    resultado.length > 0 &&
    resultado.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)
  );
}

function entregar(desde: string, mensaje: MensajeMidi) {
  for (const conexion of estado.flujo.conexiones) {
    if (conexion.desde === desde) {
      procesarEn(conexion.hacia, [...mensaje]);
    }
  }
}

function procesarEn(nodoId: string, mensaje: MensajeMidi) {
  const nodo = estado.flujo.nodos.find((candidato) => candidato.id === nodoId);
  if (!nodo || nodo.tipo === "trigger") {
    return;
  }

  const tipo = TIPOS_DE_NODO[nodo.tipo];
  let resultado;
  try {
    resultado = tipo.procesar(mensaje, nodo.parametros);
  } catch (error) {
    console.error(`La caja "${tipo.nombre}" falló al procesar un mensaje:`, error);
    return;
  }

  if (!tieneSalida(tipo) || resultado == null) {
    return;
  }
  if (!esMensajeValido(resultado)) {
    console.warn(`La caja "${tipo.nombre}" produjo un mensaje MIDI inválido:`, resultado);
    return;
  }
  entregar(nodoId, resultado);
}

export function procesarMensaje(mensaje: MensajeMidi) {
  entregar("trigger", mensaje);
}

export async function inicializarWorkflow() {
  await listen<EventoMidi>("mensaje-midi", (evento) => {
    procesarMensaje(evento.payload.datos);
  });
}
