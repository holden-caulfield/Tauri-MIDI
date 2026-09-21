function buscarPanel(tab: HTMLButtonElement): HTMLElement {
  const nombreTab = tab.textContent?.trim();
  const idPanel = tab.getAttribute("aria-controls");

  if (!idPanel) {
    throw new Error(`El tab "${nombreTab}" no declara aria-controls`);
  }

  const panel = document.querySelector<HTMLElement>(`#${idPanel}`);

  if (!panel) {
    throw new Error(
      `El tab "${nombreTab}" apunta a "#${idPanel}", que no existe`,
    );
  }

  return panel;
}

export function inicializarTabs() {
  const barra = document.querySelector<HTMLElement>('[role="tablist"]')!;
  const tabs = Array.from(
    barra.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  );

  if (tabs.length === 0) {
    throw new Error("La barra de tabs no tiene ningún tab");
  }

  const paneles = tabs.map(buscarPanel);

  function activarTab(indiceActivo: number) {
    tabs.forEach((tab, indice) => {
      const activo = indice === indiceActivo;
      tab.setAttribute("aria-selected", String(activo));
      paneles[indice].hidden = !activo;
    });
  }

  tabs.forEach((tab, indice) => {
    tab.addEventListener("click", () => activarTab(indice));
  });

  activarTab(0);
}
