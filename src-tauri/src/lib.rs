use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use midir::{Ignore, MidiInput, MidiInputConnection, MidiOutput, MidiOutputConnection};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

/// Estado compartido de la aplicación: mantiene vivas las conexiones MIDI
/// mientras dure la sesión. La conexión de salida se comparte mediante un
/// `Arc` porque también la necesita el callback de la conexión de entrada
/// para reenviar los mensajes que recibe.
struct EstadoMidi {
    conexion_entrada: Mutex<Option<MidiInputConnection<()>>>,
    conexion_salida: Arc<Mutex<Option<MidiOutputConnection>>>,
}

impl Default for EstadoMidi {
    fn default() -> Self {
        Self {
            conexion_entrada: Mutex::new(None),
            conexion_salida: Arc::new(Mutex::new(None)),
        }
    }
}

#[derive(Clone, Serialize)]
struct MensajeMidi {
    puerto: String,
    marca_temporal_ms: u64,
    datos: Vec<u8>,
    descripcion: String,
}

fn marca_temporal_actual_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duracion| duracion.as_millis() as u64)
        .unwrap_or(0)
}

/// Traduce los bytes crudos de un mensaje MIDI a una descripción legible,
/// pensada para usuarios que están aprendiendo el protocolo.
fn describir_mensaje(datos: &[u8]) -> String {
    if datos.is_empty() {
        return "Mensaje vacío".to_string();
    }

    if datos[0] >= 0xF0 {
        return match datos[0] {
            0xF0 => "Mensaje de Sistema Exclusivo (SysEx)".to_string(),
            0xF1 => "Cuadro de Tiempo MIDI (MTC Quarter Frame)".to_string(),
            0xF2 => "Puntero de Posición de Canción (Song Position Pointer)".to_string(),
            0xF3 => "Selección de Canción (Song Select)".to_string(),
            0xF6 => "Solicitud de Afinación (Tune Request)".to_string(),
            0xF8 => "Reloj MIDI (Timing Clock)".to_string(),
            0xFA => "Inicio (Start)".to_string(),
            0xFB => "Continuar (Continue)".to_string(),
            0xFC => "Detener (Stop)".to_string(),
            0xFE => "Sensor Activo (Active Sensing)".to_string(),
            0xFF => "Reset del Sistema".to_string(),
            otro => format!("Mensaje de sistema sin reconocer (0x{otro:02X})"),
        };
    }

    let tipo = datos[0] & 0xF0;
    let canal = (datos[0] & 0x0F) + 1;
    let dato1 = datos.get(1).copied().unwrap_or(0);
    let dato2 = datos.get(2).copied().unwrap_or(0);

    match tipo {
        0x80 => format!("Nota Off · canal {canal} · nota {dato1} · velocidad {dato2}"),
        0x90 if dato2 == 0 => format!("Nota Off · canal {canal} · nota {dato1} · velocidad 0"),
        0x90 => format!("Nota On · canal {canal} · nota {dato1} · velocidad {dato2}"),
        0xA0 => format!("Presión Polifónica · canal {canal} · nota {dato1} · presión {dato2}"),
        0xB0 => format!("Cambio de Control · canal {canal} · controlador {dato1} · valor {dato2}"),
        0xC0 => format!("Cambio de Programa · canal {canal} · programa {dato1}"),
        0xD0 => format!("Presión de Canal · canal {canal} · presión {dato1}"),
        0xE0 => {
            let valor = ((dato2 as u16) << 7) | dato1 as u16;
            format!("Pitch Bend · canal {canal} · valor {valor}")
        }
        _ => format!("Mensaje MIDI sin reconocer: {datos:02X?}"),
    }
}

/// Los mensajes de reloj MIDI (Timing Clock) se envían constantemente
/// (24 por negra) y solo sirven para sincronización; se excluyen del log
/// para no saturar la pantalla, pero igual se siguen reenviando a la salida.
fn es_mensaje_de_reloj(datos: &[u8]) -> bool {
    datos.first() == Some(&0xF8)
}

#[tauri::command]
fn listar_puertos_entrada() -> Result<Vec<String>, String> {
    let midi_in = MidiInput::new("tauri-midi-listado-entrada").map_err(|error| error.to_string())?;
    Ok(midi_in
        .ports()
        .iter()
        .map(|puerto| {
            midi_in
                .port_name(puerto)
                .unwrap_or_else(|_| "Puerto desconocido".to_string())
        })
        .collect())
}

#[tauri::command]
fn listar_puertos_salida() -> Result<Vec<String>, String> {
    let midi_out = MidiOutput::new("tauri-midi-listado-salida").map_err(|error| error.to_string())?;
    Ok(midi_out
        .ports()
        .iter()
        .map(|puerto| {
            midi_out
                .port_name(puerto)
                .unwrap_or_else(|_| "Puerto desconocido".to_string())
        })
        .collect())
}

fn cerrar_conexiones(estado: &EstadoMidi) {
    if let Some(conexion) = estado.conexion_entrada.lock().unwrap().take() {
        conexion.close();
    }
    if let Some(conexion) = estado.conexion_salida.lock().unwrap().take() {
        conexion.close();
    }
}

#[tauri::command]
fn conectar(
    app: AppHandle,
    estado: State<EstadoMidi>,
    puerto_entrada: String,
    puerto_salida: String,
) -> Result<(), String> {
    cerrar_conexiones(&estado);

    let midi_out = MidiOutput::new("tauri-midi-salida").map_err(|error| error.to_string())?;
    let puerto_salida_encontrado = midi_out
        .ports()
        .into_iter()
        .find(|puerto| {
            midi_out
                .port_name(puerto)
                .map(|nombre| nombre == puerto_salida)
                .unwrap_or(false)
        })
        .ok_or_else(|| format!("No se encontró el puerto de salida '{puerto_salida}'"))?;
    let conexion_salida = midi_out
        .connect(&puerto_salida_encontrado, "tauri-midi-conexion-salida")
        .map_err(|error| error.to_string())?;
    *estado.conexion_salida.lock().unwrap() = Some(conexion_salida);

    let mut midi_in = MidiInput::new("tauri-midi-entrada").map_err(|error| error.to_string())?;
    midi_in.ignore(Ignore::None);
    let puerto_entrada_encontrado = midi_in
        .ports()
        .into_iter()
        .find(|puerto| {
            midi_in
                .port_name(puerto)
                .map(|nombre| nombre == puerto_entrada)
                .unwrap_or(false)
        })
        .ok_or_else(|| format!("No se encontró el puerto de entrada '{puerto_entrada}'"))?;

    let nombre_puerto_entrada = puerto_entrada.clone();
    let conexion_salida_compartida = estado.conexion_salida.clone();
    let app_para_eventos = app.clone();

    let conexion_entrada = midi_in
        .connect(
            &puerto_entrada_encontrado,
            "tauri-midi-conexion-entrada",
            move |_marca_temporal_us, mensaje, _contexto| {
                if let Ok(mut salida) = conexion_salida_compartida.lock() {
                    if let Some(conexion) = salida.as_mut() {
                        let _ = conexion.send(mensaje);
                    }
                }

                if es_mensaje_de_reloj(mensaje) {
                    return;
                }

                let evento = MensajeMidi {
                    puerto: nombre_puerto_entrada.clone(),
                    marca_temporal_ms: marca_temporal_actual_ms(),
                    datos: mensaje.to_vec(),
                    descripcion: describir_mensaje(mensaje),
                };
                let _ = app_para_eventos.emit("mensaje-midi", evento);
            },
            (),
        )
        .map_err(|error| error.to_string())?;

    *estado.conexion_entrada.lock().unwrap() = Some(conexion_entrada);

    Ok(())
}

#[tauri::command]
fn desconectar(estado: State<EstadoMidi>) {
    cerrar_conexiones(&estado);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(EstadoMidi::default())
        .invoke_handler(tauri::generate_handler![
            listar_puertos_entrada,
            listar_puertos_salida,
            conectar,
            desconectar
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
