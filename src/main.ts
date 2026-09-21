import { inicializarConexion } from "./conexion";
import { inicializarLog } from "./log";
import { inicializarTabs } from "./tabs";

window.addEventListener("DOMContentLoaded", async () => {
  inicializarTabs();
  await inicializarLog();
  await inicializarConexion();
});
