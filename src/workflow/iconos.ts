import { createElement, type IconNode } from "lucide";

export function dibujarIcono(icono: IconNode) {
  return createElement(icono, { width: 18, height: 18, "aria-hidden": "true" });
}
