# Tauri MIDI

Aplicación de escritorio hecha con [Tauri](https://tauri.app) para experimentar
con mensajes MIDI. Su intención principal es educativa, orientada a músicos con
ganas de aprender conceptos básicos de programación y profundizar su
entendimiento del protocolo MIDI.

## Qué hace hoy

- Permite elegir un puerto MIDI de **entrada** y uno de **salida** entre los
  disponibles en el sistema.
- Reenvía (pass-through) cada mensaje que llega por la entrada hacia la
  salida elegida.
- Muestra en pantalla un log en tiempo real de los mensajes que pasan, con
  una descripción legible (Nota On/Off, Control Change, Pitch Bend, etc.)
  pensada para gente que recién se acerca al protocolo.
- Filtra del log los mensajes de reloj MIDI (*Timing Clock*, `0xF8`): siguen
  reenviándose a la salida con normalidad, pero no saturan la pantalla.

## Hacia dónde va

A futuro se van a agregar componentes visuales que permitan a usuarios
semi-técnicos armar sus propios flujos de trabajo manipulando mensajes MIDI
(por ejemplo: filtrar, transformar o remapear mensajes mediante un editor
visual de nodos). La idea no es evitarles la programación, sino darles una
puerta de entrada visual para que además vayan aprendiendo conceptos básicos
de programación en el proceso. Ese trabajo todavía no arrancó.

## Arquitectura

La app sigue el modelo estándar de Tauri: un backend en Rust con acceso al
sistema operativo, y un frontend web embebido que corre en un WebView nativo.

```
┌─────────────────────────┐        eventos ("mensaje-midi")        ┌──────────────────────────┐
│   Frontend (WebView)    │  ───────────────────────────────────►  │   Backend (Rust / Tauri)  │
│  src/main.ts, index.html│                                         │      src-tauri/src/       │
│                          │  ◄───────────────────────────────────  │                            │
└─────────────────────────┘        comandos (invoke)                └──────────────────────────┘
                                                                              │
                                                                              ▼
                                                                     midir (CoreMIDI/ALSA/WinMM)
                                                                              │
                                                                              ▼
                                                                    Puertos MIDI del sistema
```

- **Backend** ([src-tauri/src/lib.rs](src-tauri/src/lib.rs)): usa la
  librería [`midir`](https://docs.rs/midir) para listar puertos y abrir
  conexiones de entrada/salida. El estado de las conexiones activas se
  guarda en `tauri::State` (protegido con `Mutex`/`Arc` porque el callback
  de MIDI corre en su propio hilo). Expone:
  - Comandos (`invoke` desde el frontend): `listar_puertos_entrada`,
    `listar_puertos_salida`, `conectar`, `desconectar`.
  - Un evento (`listen` desde el frontend): `mensaje-midi`, emitido por
    cada mensaje MIDI recibido que no sea de reloj.
- **Frontend** ([src/main.ts](src/main.ts), [index.html](index.html)):
  vanilla TypeScript + Vite, sin frameworks. Popula los selects de puertos,
  dispara los comandos de conectar/desconectar y renderiza el log a medida
  que llegan eventos.

## Cómo correr el proyecto

Requisitos: [Node.js](https://nodejs.org) y [Rust](https://rustup.rs)
(instalado vía `rustup`, para poder actualizar el toolchain si hace falta).

```bash
npm install
npm run tauri dev
```

Esto compila el backend, levanta el frontend con Vite y abre la ventana
nativa de la app.

### Probar sin hardware MIDI

Si no tenés un instrumento o interfaz MIDI a mano, podés crear puertos
virtuales para elegir como entrada y salida, y mandar mensajes de prueba con
cualquier app o controlador virtual que hable con esos puertos:

- **macOS**: usá el **IAC Driver**, que ya viene instalado. Abrí *Audio MIDI
  Setup* → *MIDI Studio* → doble clic en *IAC Driver* → tildar *"Device is
  online"*.
- **Windows**: no trae un driver virtual de fábrica, hace falta instalar uno
  de terceros como [loopMIDI](https://www.tobias-erichsen.de/software/loopmidi.html).
  Abrí loopMIDI, creá un puerto con el botón `+` (por ejemplo `loopMIDI Port`)
  y ese puerto va a aparecer tanto como entrada como salida en la app.

## Estructura del repositorio

```
├── index.html              # Punto de entrada del frontend
├── src/                    # Frontend (TypeScript, CSS)
│   ├── main.ts
│   └── styles.css
└── src-tauri/              # Backend (Rust)
    ├── src/
    │   ├── lib.rs          # Lógica de MIDI y comandos de Tauri
    │   └── main.rs
    ├── Cargo.toml
    └── tauri.conf.json     # Configuración de la app (ventana, bundle, etc.)
```

## Convenciones del proyecto

Ver [AGENTS.md](AGENTS.md) para las convenciones de código y de trabajo
(incluye el criterio de escribir todo el material del proyecto en
castellano).

## Licencia

[MIT](LICENSE)
