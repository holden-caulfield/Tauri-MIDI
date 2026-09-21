import { html, type TemplateResult } from "lit-html";

import { actualizar } from "./estado";

export interface Panel {
  id: string;
  titulo: string;
  contenido: () => TemplateResult;
}

export function barraDeTabs(paneles: Panel[], activo: string) {
  return html`
    <div class="barra-tabs" role="tablist" aria-label="Secciones">
      ${paneles.map(
        (panel) => html`
          <button
            id="tab-${panel.id}"
            type="button"
            role="tab"
            aria-controls="panel-${panel.id}"
            aria-selected=${panel.id === activo}
            @click=${() => actualizar({ panelActivo: panel.id })}
          >
            ${panel.titulo}
          </button>
        `,
      )}
    </div>
  `;
}
