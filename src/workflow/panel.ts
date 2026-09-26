import { html } from "lit-html";
import { live } from "lit-html/directives/live.js";

import { actualizar, estado, type NodoDelFlujo } from "../estado";
import { TIPOS_DE_NODO, TRIGGER, type IdDeTipo } from "./catalogo";
import { dibujarIcono } from "./iconos";
import { agregarNodo, eliminarNodo, posicionDesdeEvento } from "./lienzo";
import type { Parametro, ValorDeParametro } from "./tipos";

const FORMATO_ARRASTRE = "application/x-tipo-de-nodo";

function cambiarParametro(nodoId: string, clave: string, valor: ValorDeParametro) {
  actualizar({
    flujo: {
      ...estado.flujo,
      nodos: estado.flujo.nodos.map((nodo) =>
        nodo.id === nodoId ? { ...nodo, parametros: { ...nodo.parametros, [clave]: valor } } : nodo,
      ),
    },
  });
}

function soltarEnElLienzo(evento: DragEvent) {
  const tipo = evento.dataTransfer?.getData(FORMATO_ARRASTRE);
  if (!tipo || !(tipo in TIPOS_DE_NODO)) return;
  evento.preventDefault();
  agregarNodo(tipo as IdDeTipo, posicionDesdeEvento(evento));
}

function barraDeHerramientas() {
  const ids = Object.keys(TIPOS_DE_NODO) as IdDeTipo[];
  return html`
    <div class="barra-herramientas" role="toolbar" aria-label="Cajas para agregar">
      ${ids.map((id) => {
        const tipo = TIPOS_DE_NODO[id];
        return html`
          <button
            type="button"
            draggable="true"
            @dragstart=${(evento: DragEvent) => evento.dataTransfer?.setData(FORMATO_ARRASTRE, id)}
            @click=${() => agregarNodo(id)}
          >
            ${dibujarIcono(tipo.icono)} ${tipo.nombre}
          </button>
        `;
      })}
    </div>
  `;
}

function campo(nodo: NodoDelFlujo, parametro: Parametro) {
  const id = `parametro-${nodo.id}-${parametro.clave}`;
  const valor = nodo.parametros[parametro.clave];

  switch (parametro.tipo) {
    case "entero":
      return html`
        <div class="campo">
          <label for=${id}>${parametro.etiqueta}</label>
          <input
            id=${id}
            type="number"
            step="1"
            .value=${live(String(valor))}
            @change=${(evento: Event) => {
              const escrito = (evento.target as HTMLInputElement).value;
              const numero = Number(escrito);
              if (escrito.trim() !== "" && Number.isInteger(numero)) {
                cambiarParametro(nodo.id, parametro.clave, numero);
              } else {
                // Redibujar vuelve a mostrar el valor que la caja conserva.
                actualizar({});
              }
            }}
          />
        </div>
      `;
    case "si-no":
      return html`
        <div class="campo campo-si-no">
          <input
            id=${id}
            type="checkbox"
            .checked=${live(Boolean(valor))}
            @change=${(evento: Event) =>
              cambiarParametro(nodo.id, parametro.clave, (evento.target as HTMLInputElement).checked)}
          />
          <label for=${id}>${parametro.etiqueta}</label>
        </div>
      `;
    case "opciones":
      return html`
        <div class="campo">
          <label for=${id}>${parametro.etiqueta}</label>
          <select
            id=${id}
            @change=${(evento: Event) => {
              const indice = (evento.target as HTMLSelectElement).selectedIndex;
              cambiarParametro(nodo.id, parametro.clave, parametro.opciones[indice].valor);
            }}
          >
            ${parametro.opciones.map(
              (opcion) =>
                html`<option .selected=${live(opcion.valor === valor)}>${opcion.texto}</option>`,
            )}
          </select>
        </div>
      `;
  }
}

function panelDeConfiguracion() {
  const nodo = estado.flujo.nodos.find((candidato) => candidato.id === estado.nodoSeleccionado);
  if (!nodo) {
    return html`
      <aside class="configuracion" aria-label="Configuración de la caja">
        <p class="configuracion-vacia">Seleccioná una caja del lienzo para configurarla.</p>
      </aside>
    `;
  }

  const tipo = nodo.tipo === "trigger" ? null : TIPOS_DE_NODO[nodo.tipo];
  const nombre = tipo ? tipo.nombre : TRIGGER.nombre;
  const parametros = tipo ? tipo.parametros : [];

  return html`
    <aside class="configuracion" aria-label="Configuración de la caja">
      <h3>${nombre}</h3>
      ${parametros.length === 0
        ? html`<p class="configuracion-vacia">Esta caja no tiene nada para configurar.</p>`
        : parametros.map((parametro) => campo(nodo, parametro))}
      ${tipo
        ? html`<button type="button" @click=${() => eliminarNodo(nodo.id)}>Eliminar caja</button>`
        : null}
    </aside>
  `;
}

export function panelWorkflow() {
  return html`
    ${barraDeHerramientas()}
    <p class="ayuda-workflow">
      Solo sale por el puerto lo que llega a una caja Emitir. Para borrar una conexión,
      arrastrala desde su entrada y soltala en un lugar vacío.
    </p>
    <div class="area-workflow">
      <div
        id="lienzo-workflow"
        class="lienzo"
        @dragover=${(evento: DragEvent) => evento.preventDefault()}
        @drop=${soltarEnElLienzo}
      ></div>
      ${panelDeConfiguracion()}
    </div>
  `;
}
