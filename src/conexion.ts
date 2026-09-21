import { invoke } from "@tauri-apps/api/core";

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

export async function inicializarConexion() {
  const selectPuertoEntrada = document.querySelector<HTMLSelectElement>(
    "#select-puerto-entrada",
  )!;
  const selectPuertoSalida = document.querySelector<HTMLSelectElement>(
    "#select-puerto-salida",
  )!;
  const botonActualizarPuertos = document.querySelector<HTMLButtonElement>(
    "#boton-actualizar-puertos",
  )!;
  const botonConectar = document.querySelector<HTMLButtonElement>(
    "#boton-conectar",
  )!;
  const botonDesconectar = document.querySelector<HTMLButtonElement>(
    "#boton-desconectar",
  )!;
  const textoEstado = document.querySelector<HTMLParagraphElement>(
    "#texto-estado",
  )!;

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

  botonActualizarPuertos.addEventListener("click", actualizarListaDePuertos);
  botonConectar.addEventListener("click", conectar);
  botonDesconectar.addEventListener("click", desconectar);

  await actualizarListaDePuertos();
}
