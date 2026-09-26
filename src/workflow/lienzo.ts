// Única frontera con Rete: ningún otro módulo lo importa. Las posiciones, el
// zoom y el arrastre son de la librería; qué cajas hay y cómo se conectan vive
// en `estado.flujo`, y este módulo mantiene las dos cosas de acuerdo.
import { LitPlugin, Presets as PresetsDeDibujo, type LitArea2D } from "@retejs/lit-plugin";
import { html } from "lit-html";
import type { IconNode } from "lucide";
import { ClassicPreset, NodeEditor, type GetSchemes } from "rete";
import { AreaPlugin } from "rete-area-plugin";
import { ConnectionPlugin, Presets as PresetsDeConexion } from "rete-connection-plugin";

import { actualizar, estado, type Conexion, type NodoDelFlujo } from "../estado";
import { tieneSalida, TIPOS_DE_NODO, TRIGGER, type IdDeTipo } from "./catalogo";
import { dibujarIcono } from "./iconos";

const ANCHO_CAJA = 240;
const ALTO_CAJA = 44;
const SEPARACION_INICIAL = 320;

class Caja extends ClassicPreset.Node {
  constructor(
    id: string,
    public nombre: string,
    public icono: IconNode,
    conEntrada: boolean,
    conSalida: boolean,
  ) {
    super(nombre);
    this.id = id;
    const socket = new ClassicPreset.Socket("midi");
    if (conEntrada) this.addInput("entrada", new ClassicPreset.Input(socket, "", true));
    if (conSalida) this.addOutput("salida", new ClassicPreset.Output(socket, ""));
  }
}

type Enlace = ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>;
type Esquema = GetSchemes<Caja, Enlace>;
type Senales = LitArea2D<Esquema>;

let editor: NodeEditor<Esquema> | null = null;
let area: AreaPlugin<Esquema, Senales>;
let cajasAgregadasConClic = 0;

// Mientras se copian al lienzo cosas que ya están en el estado, los eventos
// del editor no se tienen que volver a volcar al estado.
let copiandoDesdeElEstado = false;

function crearCaja(nodo: NodoDelFlujo): Caja {
  if (nodo.tipo === "trigger") {
    return new Caja(nodo.id, TRIGGER.nombre, TRIGGER.icono, false, true);
  }
  const tipo = TIPOS_DE_NODO[nodo.tipo];
  return new Caja(nodo.id, tipo.nombre, tipo.icono, true, tieneSalida(tipo));
}

function dibujarCaja(caja: Caja, emit: (senal: Senales) => void) {
  const conector = (lado: "input" | "output", clave: string, socket: ClassicPreset.Socket) => html`
    <rete-ref
      class="conector conector-${lado === "input" ? "entrada" : "salida"}"
      .data=${{ type: "socket", side: lado, key: clave, nodeId: caja.id, payload: socket }}
      .emit=${emit}
    ></rete-ref>
  `;
  return html`
    <div class="caja" style="width: ${ANCHO_CAJA}px">
      ${caja.inputs.entrada ? conector("input", "entrada", caja.inputs.entrada.socket) : null}
      <span class="caja-icono">${dibujarIcono(caja.icono)}</span>
      <span class="caja-nombre">${caja.nombre}</span>
      ${caja.outputs.salida ? conector("output", "salida", caja.outputs.salida.socket) : null}
    </div>
  `;
}

// Rete no vuelve a ejecutar la plantilla de una caja personalizada (solo sabe
// redibujar componentes Lit), así que la selección se marca con una clase en
// el contenedor que Rete le da a cada caja.
function seleccionar(id: string | null) {
  for (const [idDeCaja, vista] of area.nodeViews) {
    vista.element.classList.toggle("caja-seleccionada", idDeCaja === id);
  }
  actualizar({ nodoSeleccionado: id });
}

function alcanzable(desde: string, objetivo: string, conexiones: Conexion[]): boolean {
  const pendientes = [desde];
  const visitados = new Set<string>();
  while (pendientes.length > 0) {
    const actual = pendientes.pop()!;
    if (actual === objetivo) return true;
    if (visitados.has(actual)) continue;
    visitados.add(actual);
    for (const conexion of conexiones) {
      if (conexion.desde === actual) pendientes.push(conexion.hacia);
    }
  }
  return false;
}

function conexionPermitida(desde: string, hacia: string): boolean {
  const { conexiones } = estado.flujo;
  if (desde === hacia) return false;
  if (conexiones.some((conexion) => conexion.desde === desde && conexion.hacia === hacia)) {
    return false;
  }
  // Si desde el destino se puede llegar al origen, la conexión cerraría un ciclo.
  return !alcanzable(hacia, desde, conexiones);
}

function agregarConexionAlEstado(desde: string, hacia: string) {
  actualizar({
    flujo: { ...estado.flujo, conexiones: [...estado.flujo.conexiones, { desde, hacia }] },
  });
}

function quitarConexionDelEstado(desde: string, hacia: string) {
  actualizar({
    flujo: {
      ...estado.flujo,
      conexiones: estado.flujo.conexiones.filter(
        (conexion) => !(conexion.desde === desde && conexion.hacia === hacia),
      ),
    },
  });
}

async function montarLienzo(contenedor: HTMLElement) {
  editor = new NodeEditor<Esquema>();
  area = new AreaPlugin<Esquema, Senales>(contenedor);
  const conexiones = new ConnectionPlugin<Esquema, Senales>();
  const dibujo = new LitPlugin<Esquema, Senales>();

  dibujo.addPreset(
    PresetsDeDibujo.classic.setup({
      customize: {
        node: (contexto) => ({ emit }) => dibujarCaja(contexto.payload as Caja, emit),
      },
    }),
  );
  conexiones.addPreset(PresetsDeConexion.classic.setup());

  editor.use(area);
  area.use(conexiones);
  area.use(dibujo);

  editor.addPipe((contexto) => {
    if (copiandoDesdeElEstado) return contexto;

    if (contexto.type === "connectioncreate") {
      return conexionPermitida(contexto.data.source, contexto.data.target) ? contexto : undefined;
    }
    if (contexto.type === "connectioncreated") {
      agregarConexionAlEstado(contexto.data.source, contexto.data.target);
    }
    if (contexto.type === "connectionremoved") {
      quitarConexionDelEstado(contexto.data.source, contexto.data.target);
    }
    return contexto;
  });

  area.addPipe((contexto) => {
    if (contexto.type === "nodepicked") {
      seleccionar(contexto.data.id);
    }
    if (contexto.type === "pointerdown") {
      const objetivo = contexto.data.event.target;
      if (objetivo === contenedor || objetivo === area.area.content.holder) {
        seleccionar(null);
      }
    }
    return contexto;
  });

  copiandoDesdeElEstado = true;
  const cajas = new Map<string, Caja>();
  for (const [indice, nodo] of estado.flujo.nodos.entries()) {
    const caja = crearCaja(nodo);
    cajas.set(nodo.id, caja);
    await editor.addNode(caja);
    await area.translate(caja.id, { x: indice * SEPARACION_INICIAL, y: 0 });
  }
  for (const conexion of estado.flujo.conexiones) {
    const origen = cajas.get(conexion.desde);
    const destino = cajas.get(conexion.hacia);
    if (origen && destino) {
      const enlace: Enlace = new ClassicPreset.Connection<ClassicPreset.Node, ClassicPreset.Node>(
        origen,
        "salida",
        destino,
        "entrada",
      );
      await editor.addConnection(enlace);
    }
  }
  copiandoDesdeElEstado = false;

  await area.area.translate(40, 60);
}

export function asegurarLienzo() {
  if (editor) return;
  const contenedor = document.querySelector<HTMLElement>("#lienzo-workflow");
  if (contenedor) montarLienzo(contenedor);
}

function centroVisible() {
  const { x, y, k } = area.area.transform;
  const { width, height } = area.container.getBoundingClientRect();
  const corrimiento = (cajasAgregadasConClic++ % 5) * 48;
  return {
    x: (width / 2 - x) / k - ANCHO_CAJA / 2 + corrimiento,
    y: (height / 2 - y) / k - ALTO_CAJA / 2 + corrimiento,
  };
}

export function posicionDesdeEvento(evento: MouseEvent) {
  area.area.setPointerFrom(evento);
  return {
    x: area.area.pointer.x - ANCHO_CAJA / 2,
    y: area.area.pointer.y - ALTO_CAJA / 2,
  };
}

export async function agregarNodo(id: IdDeTipo, posicion?: { x: number; y: number }) {
  if (!editor) return;

  const parametros = Object.fromEntries(
    TIPOS_DE_NODO[id].parametros.map((parametro) => [parametro.clave, parametro.inicial]),
  );
  const nodo: NodoDelFlujo = { id: crypto.randomUUID(), tipo: id, parametros };

  actualizar({ flujo: { ...estado.flujo, nodos: [...estado.flujo.nodos, nodo] } });

  const caja = crearCaja(nodo);
  await editor.addNode(caja);
  await area.translate(caja.id, posicion ?? centroVisible());
}

export async function eliminarNodo(id: string) {
  if (!editor || id === "trigger") return;

  // Rete no borra las conexiones de una caja al borrarla: se borran antes, y
  // cada una se quita del estado por el evento `connectionremoved`.
  for (const enlace of editor.getConnections()) {
    if (enlace.source === id || enlace.target === id) {
      await editor.removeConnection(enlace.id);
    }
  }
  await editor.removeNode(id);

  actualizar({
    flujo: { ...estado.flujo, nodos: estado.flujo.nodos.filter((nodo) => nodo.id !== id) },
    nodoSeleccionado: estado.nodoSeleccionado === id ? null : estado.nodoSeleccionado,
  });
}
