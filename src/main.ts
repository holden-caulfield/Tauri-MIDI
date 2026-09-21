import { html, render } from "lit-html";

import {
  indicadorDeEstado,
  inicializarConexion,
  panelConexion,
} from "./conexion";
import { estado, suscribir } from "./estado";
import { inicializarLog, panelLog } from "./log";
import { barraDeTabs, type Panel } from "./tabs";

const PANELES: Panel[] = [
  { id: "conexion", titulo: "Conexión", contenido: panelConexion },
  { id: "log", titulo: "Log", contenido: panelLog },
];

function ventana() {
  return html`
    <header class="encabezado">
      <h1>Tauri MIDI</h1>
      ${indicadorDeEstado()}
    </header>

    <main class="contenedor">
      ${PANELES.map(
        (panel) => html`
          <section
            id="panel-${panel.id}"
            class="panel panel-${panel.id}"
            role="tabpanel"
            aria-labelledby="tab-${panel.id}"
            ?hidden=${estado.panelActivo !== panel.id}
          >
            ${panel.contenido()}
          </section>
        `,
      )}
    </main>

    ${barraDeTabs(PANELES, estado.panelActivo)}
  `;
}

window.addEventListener("DOMContentLoaded", async () => {
  const raiz = document.querySelector<HTMLElement>("#app")!;
  const dibujar = () => render(ventana(), raiz);

  suscribir(dibujar);
  dibujar();

  await inicializarLog();
  await inicializarConexion();
});
