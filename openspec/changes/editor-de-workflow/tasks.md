# Tasks

## 1. Preparación y prueba de concepto del lienzo

- [x] 1.1 Crear la rama local del cambio desde `main` actualizado y verificar con
      `git status` que la rama activa no es `main`
- [x] 1.2 Instalar `rete`, `rete-area-plugin`, `rete-connection-plugin`,
      `rete-render-utils`, `@retejs/lit-plugin`, `lit` y `lucide` con
      `npm install`. Verificar que quedaron en `dependencies`, que
      `npm ls lit-html` muestra una sola versión y que `npm run dev` levanta sin
      errores en la consola
- [x] 1.3 Prueba de concepto descartable (design.md, decisiones 7, 8 y 10): en
      un panel de prueba, montar Rete con el preset clásico de Lit y dos cajas
      personalizadas con ícono SVG y nombre. Tienen que funcionar: conectarlas,
      cancelar una conexión desde el evento de creación, levantar una conexión
      desde su entrada para borrarla, soltar un botón HTML5 arrastrable sobre
      el lienzo y crear una caja en ese punto, y elegir una caja. Montar el
      lienzo recién la primera vez que el tab se muestra, y comprobar que al
      ocultarlo y volver a mostrarlo las conexiones siguen bien dibujadas.
      Verificar todo en `npm run tauri dev` (WKWebView) y anotar el resultado
      en la descripción del PR. Si algún punto no se logra, parar y consultar
      a la persona usuaria antes de pasar al plan B (Drawflow detrás de
      `lienzo.ts`)
- [x] 1.4 Descartar el código de la prueba de concepto y verificar con
      `git status` que no queda nada de ella

## 2. Backend

- [x] 2.1 En el callback de entrada de `src-tauri/src/lib.rs`, reenviar a la
      salida solo los mensajes de reloj y seguir emitiendo `mensaje-midi` para
      el resto sin reenviarlos (design.md, decisión 2). Actualizar el comentario
      de `EstadoMidi` que habla del pass-through. Verificar con `cargo check`
- [x] 2.2 Agregar el comando sincrónico `enviar_mensaje(datos: Vec<u8>)`, que
      escribe en la conexión de salida si hay una y devuelve error si no, y
      registrarlo en `generate_handler!`. Verificar con `cargo check`

## 3. Contrato, catálogo y tipos de nodo

- [x] 3.1 Escribir `src/workflow/tipos.ts` con `ValorDeParametro`, `Parametro` y
      `TipoDeNodo`, con `tieneSalida` opcional y `icono` de tipo `IconNode`
      (decisión 4). Verificar con `npx tsc --noEmit` y que el archivo solo
      importe el tipo `IconNode` de `lucide`
- [x] 3.2 Escribir `src/workflow/salida.ts` con `enviarMensaje(datos)`, que
      encola los `invoke("enviar_mensaje", { datos })` para que cada uno espere
      al anterior y registra los errores por consola (decisión 6). Verificar con
      `npx tsc --noEmit`
- [x] 3.3 Escribir `src/workflow/nodos/desplazar.ts` según la spec
      `nodo-desplazar`: ícono `ArrowUpDown`, sin declarar `tieneSalida`, tres
      parámetros con sus valores iniciales, aritmética de bits que separa el
      leading bit, desplaza los 7 bits restantes (con `& 0x7F` si hay overflow,
      tope 0–127 si no) y lo vuelve a poner, y mensaje sin cambios si le falta el
      byte (design.md, decisión 4). Verificar con `npx tsc --noEmit`
      y, en la consola de `npm run dev` (importando el módulo), cada escenario
      numérico de la spec, incluidos 125 +5 → 127 / 2, 2 −5 → 0 / 125,
      10 +300 → 54 y status `FF` +1 → `FF` / `80`
- [x] 3.4 Escribir `src/workflow/nodos/emitir.ts` (ícono `Send`,
      `tieneSalida: false`, sin parámetros, `procesar` llama a `enviarMensaje`).
      Verificar con `npx tsc --noEmit` y que solo importe su ícono de `lucide`,
      `../tipos` y `../salida`
- [x] 3.5 Escribir `src/workflow/catalogo.ts`: el registro explícito
      `TIPOS_DE_NODO` (Desplazar y Emitir, en ese orden) con
      `satisfies Record<string, TipoDeNodo>`, el tipo `IdDeTipo`, la función
      `tieneSalida(tipo)` con valor por defecto `true`, y la constante con nombre
      ("Mensaje MIDI recibido") e ícono (`Zap`) del trigger (decisión 5).
      Verificar con `npx tsc --noEmit`, y que al duplicar temporalmente una clave
      o registrar un objeto sin `procesar`, `npx tsc --noEmit` falla. Deshacer
      después esas pruebas
- [x] 3.6 Escribir `src/workflow/iconos.ts` con `dibujarIcono(icono)`, que usa
      `createElement` de Lucide con un tamaño común (decisión 10). Verificar con
      `npx tsc --noEmit`, en el navegador que `Zap`, `ArrowUpDown` y `Send` se
      dibujan, y con `npm run build` que el paquete final no incluye el set
      completo de Lucide (el tamaño del bundle no crece en proporción a los
      más de mil íconos)

## 4. Estado y ejecución

- [x] 4.1 Sumar a `src/estado.ts` las interfaces `NodoDelFlujo` y `Conexion` y
      los campos `flujo` (valor inicial: trigger conectado a un Emitir con id
      `emitir-inicial`; `tipo` restringido a `"trigger" | IdDeTipo`) y
      `nodoSeleccionado` (decisión 3). Verificar con
      `npx tsc --noEmit`
- [x] 4.2 Escribir `src/workflow/ejecutar.ts` con `inicializarWorkflow()`, que
      escucha `mensaje-midi` y recorre el flujo desde el trigger. Cada entrega
      lleva su copia, el procesamiento va con try/catch por caja, lo inválido se
      descarta con aviso, y el flujo se lee de `estado.flujo` en cada mensaje
      (decisión 6). Llamarla desde `main.ts`. Verificar con `npx tsc --noEmit` y,
      en el navegador, armando `estado.flujo` a mano desde la consola y
      simulando mensajes con la función de recorrido: rama doble
      (`90 3C 64` → `90 3C 64` y `90 43 64`), cadena de dos Desplazar
      (→ `90 43 64`), camino sin Emitir (no sale nada) y una caja que tira error
      sin frenar a la otra rama

## 5. Lienzo y panel del tab Workflow

- [x] 5.1 Escribir `src/workflow/lienzo.ts`, único módulo que importa Rete, con
      `montarLienzo` (dibuja lo que haya en `estado.flujo`, con las cajas
      iniciales en fila sin superponerse), `asegurarLienzo`
      idempotente, `agregarNodo`, `eliminarNodo`, `posicionDesdeEvento`, y cajas
      con ícono y nombre, sin entrada en el trigger y sin salida donde
      `tieneSalida(tipo)` da falso (decisiones 3, 7 y 8). Verificar con `npx tsc --noEmit`,
      con `grep -rl "rete" src/` que ningún otro archivo importe Rete, y en
      `npm run dev` los escenarios "Lienzo inicial" y "El Emitir inicial se
      puede borrar" de la spec `editor-de-workflow`
- [x] 5.2 En `lienzo.ts`, validar cada conexión nueva contra `estado.flujo` y
      cancelar las que unen una caja consigo misma, las duplicadas y las que
      cierran un ciclo. Reflejar en el estado las conexiones creadas y borradas,
      y la caja elegida o el clic en el vacío en `nodoSeleccionado`. Verificar en
      `npm run dev`, mirando `estado.flujo` desde la consola, los escenarios
      "Ciclo rechazado", "Conexión consigo misma rechazada" y "Una salida hacia
      varias cajas" de la spec `editor-de-workflow`
- [x] 5.3 Escribir `src/workflow/panel.ts` con `panelWorkflow()`: la barra con
      un botón arrastrable por tipo del catálogo, en el orden del registro
      (ícono y nombre; el drop agrega
      la caja en el punto, el clic la agrega a la vista), el contenedor estable
      del lienzo, y un texto de ayuda que explica que hay que llegar a un Emitir
      para que salga algo y cómo borrar una conexión (decisión 9). Verificar en
      `npm run dev` los escenarios de la barra de la spec `editor-de-workflow`
      (arrastrar, clic, varias cajas del mismo tipo, sin trigger en la barra)
- [x] 5.4 Sumar a `panel.ts` el panel de configuración: nombre de la caja
      seleccionada, un campo por parámetro según su tipo, rechazo de valores no
      enteros, avisos de "sin parámetros" y "nada seleccionado", y el botón
      "Eliminar caja" salvo para el trigger. Verificar en `npm run dev` los
      escenarios de configuración y borrado de la spec `editor-de-workflow`
      (dos Desplazar con valores propios, "2.5" y campo vacío rechazados,
      borrar la caja seleccionada, borrar una caja conectada con sus
      conexiones)
- [x] 5.5 Agregar a `PANELES` de `main.ts` la entrada `workflow` ("Workflow",
      después de "Log"). Después de cada `render`, llamar a `asegurarLienzo()`
      si el panel activo es `workflow`. Sumar los estilos del tab a
      `src/styles.css` (lienzo que ocupa el alto disponible, barra y panel de
      configuración al costado, caja seleccionada distinguible). Verificar en
      `npm run dev` los escenarios de `navegacion-por-tabs` (tres tabs en orden,
      contenido de "Workflow", el lienzo se conserva al cambiar de tab) y los
      atributos ARIA del tab nuevo

## 6. Guía para crear tipos de nodo

- [x] 6.1 Escribir `src/workflow/nodos/LEEME.md` en castellano, para
      principiantes: qué archivo crear, cómo registrarlo en `catalogo.ts`
      (paso numerado, con el síntoma de olvidarlo: el nodo no aparece), cada
      campo de la declaración (y que `tieneSalida` solo se escribe para cerrar
      el flujo), cómo buscar un ícono en lucide.dev e importarlo, qué recibe y
      qué devuelve `procesar`, cómo descartar un mensaje, y un ejemplo completo
      (por ejemplo, un nodo que descarta los Nota Off). Verificar siguiendo la
      guía al pie de la letra: crear ese nodo de ejemplo, registrarlo, comprobar
      que aparece en la barra en el lugar del registro y funciona, y después
      deshacerlo

## 7. Verificación de punta a punta

- [x] 7.1 Correr `cargo check` (desde `src-tauri/`) y `npx tsc --noEmit` (desde
      la raíz) sin errores
- [x] 7.2 En `npm run tauri dev` con el IAC Driver como entrada y salida (u otro
      par de puertos), verificar los escenarios de `ejecucion-de-workflow`:
      lienzo inicial (sale igual), sin ningún Emitir (no sale nada), transposición
      +4, ramas original y transpuesta, Nota On/Nota Off en orden, el reloj sale
      aunque no haya ningún Emitir, el log muestra lo que entra, y el flujo sigue
      funcionando con otro tab a la vista y después de desconectar y reconectar
- [x] 7.3 Con la misma configuración, tocar acordes y notas rápidas a través de
      trigger → Desplazar → Emitir, también mientras se arrastra una caja, y
      anotar en la descripción del PR si la latencia es perceptible (riesgo de
      latencia del design.md). Si lo es, consultar a la persona usuaria antes de
      seguir
- [x] 7.4 Probar en la ventana real la activación con teclado (Enter y barra
      espaciadora) de los botones de la barra de herramientas y de "Eliminar
      caja", y del tab "Workflow"

## 8. Cierre

- [x] 8.1 Preparar y proponerle a la persona usuaria el diff de AGENTS.md:
      ejecución del flujo en el frontend, y el pass-through, que deja de ser
      fijo y pasa a ser el flujo por defecto (con el reloj como excepción), el lienzo como segunda excepción a `estado.ts`, la
      carpeta `src/workflow/` y `nodos/` como forma de sumar tipos, `lit` como
      dependencia del lienzo sin escribir componentes Lit, y sacar del Roadmap
      y de "Estilo de código" las menciones a que el editor visual todavía no
      arrancó. El ajuste del Roadmap sobre "sin necesidad de programar" ya se
      hizo durante la revisión de la propuesta. Aplicarlo solo con su aprobación
      explícita
- [x] 8.2 Subir la rama y abrir el PR contra `main`, con una descripción que
      explique que el pass-through pasa a ser el flujo por defecto (borrar el
      Emitir inicial silencia la salida) y los resultados de
      1.3 y 7.3
