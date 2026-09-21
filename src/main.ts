import { inicializarConexion } from "./conexion";
import { inicializarLog } from "./log";

window.addEventListener("DOMContentLoaded", async () => {
  await inicializarLog();
  await inicializarConexion();
});
