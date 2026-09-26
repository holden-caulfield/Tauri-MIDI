import { invoke } from "@tauri-apps/api/core";

import type { MensajeMidi } from "./tipos";

// `invoke` es asincrónico y nada garantiza que dos pedidos simultáneos lleguen
// al backend en orden, así que cada envío espera al anterior.
let ultimoEnvio: Promise<void> = Promise.resolve();

export function enviarMensaje(datos: MensajeMidi) {
  ultimoEnvio = ultimoEnvio
    .then(() => invoke<void>("enviar_mensaje", { datos }))
    .catch((error) => console.error("No se pudo enviar el mensaje MIDI:", error));
}
