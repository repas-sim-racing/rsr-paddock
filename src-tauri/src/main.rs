
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serialport::*;
use log::*;
use lazy_static::lazy_static;
use std::sync::Mutex;
use core::time::Duration;
use serde::Serialize;

const GLOBAL_POWER_SCALE: f64 = 32767.0;
const GLOBAL_255_SCALE: f64 = 255.0;
lazy_static! {
    static ref GLOBAL_SERIAL_PORT: Mutex<Option<Box<dyn SerialPort>>> = Mutex::new(None);
}

#[derive(Serialize)]
struct Device {
    port: String,
    message: String,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn open_device(port_name: &str) -> Result<()> {
    let mut global_port = GLOBAL_SERIAL_PORT.lock().unwrap();
    if let Some(ref mut _port) = *global_port {
        // Do nothing
        Ok(())
    } else {
        match serialport::new(port_name, 9600)
        .timeout(Duration::from_millis(0))
        .open() {
            Ok(_port) => {
                *global_port = Some(_port);
                Ok(())
            },
            Err(err) => {
                Err(err)
            }
        }
    }
}

fn close_device() {
    let mut global_port = GLOBAL_SERIAL_PORT.lock().unwrap();
    *global_port = None;
}

#[tauri::command]
fn set_value(input: &str) {
    let parts: Vec<&str> = input.split(":").collect();
    let key = parts[0];
    let value = parts[1];
    let mut global_port = GLOBAL_SERIAL_PORT.lock().unwrap();
    let mut num = value.parse::<f64>().unwrap();
    match key {
    "center" => {
        let command = "axis.0.".to_string() + "zeroenc\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => {}, 
                Err(e) => {
                    info!("Failed to send command: {}", e);
                },
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "power" => {
        if num < 5.0 {
            num = 5.0;
        }
        let scale = GLOBAL_POWER_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "axis.0.".to_string() + key + "=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => {}, 
                Err(e) => {
                    info!("Failed to send command: {}", e);
                },
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "bumpstop" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "axis.0.".to_string() + "esgain=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "intensity" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "axis.0.".to_string() + "fxratio=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "idlespring" => {
        // Max value is too strong and dangerous. Set it to 50 max
        if num > 50.0 {
            num = 50.0;
        }
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "axis.0.".to_string() + key +  "=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "mechanicaldamper" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "axis.0.".to_string() + "axisdamper=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "degrees" => {
        // No scale is needed, but the minimum value is 10
        if num < 10.0 {
            num = 10.0;
        }
        let command = "axis.0.".to_string() + "degrees=" + &num.to_string().clone() + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "spring" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "fx.0.".to_string() + key + "=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "damper" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "fx.0.".to_string() + key + "=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "friction" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "fx.0.".to_string() + key + "=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "inertia" => {
        let scale = GLOBAL_255_SCALE;
        num = num/100.0;
        num = num * scale;
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "fx.0.".to_string() + key + "=" + scaled_value + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "filterfreq" => {
        // No scale, pass the value as is
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "fx.0.".to_string() + "filterCfFreq=" + &num.to_string().clone() + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    "filterq" => {
        // No scale, pass the value as is
        let int_num: i32 = num as i32;
        let scaled_value = &int_num.to_string().clone();
        let command = "fx.0.".to_string() + "filterCfQ=" + &num.to_string().clone() + "\n\r";
        info!("{}", command);
        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => info!("Command sent successfully"),
                Err(e) => info!("Failed to send command: {}", e),
            }
        } else {
            info!("Serial port not initialized");
        }
    },
    _ => {
            info!("Do nothing");
    },
    }
}

#[tauri::command]
fn get_device() -> Device {
    let mut selected_port_pid = 0;
    let mut selected_port_name = String::new();
    let ports = serialport::available_ports().expect("No ports found!");
    for p in ports {
        //info!("{:#?}", p);
        match &p.port_type {
            SerialPortType::UsbPort(usb_info) => {
                if usb_info.pid == 65456 { // FFB0
                    selected_port_name = p.port_name.to_string();
                    selected_port_pid = usb_info.pid;
                    break;
                }
            },
            SerialPortType::PciPort => {
                info!("The port is a PCI port.");
            },
            SerialPortType::BluetoothPort => {
                info!("The port is a Bluetooth port.");
            },
            SerialPortType::Unknown => {
                info!("The port type is unknown.");
            },
        }
    }
    if selected_port_name == "" {
        close_device();
        let device = Device {
            port: "".to_string(),
            message: "not_found".to_string(),
        };
        return device
    }

    match open_device(&selected_port_name) {
        Ok(()) => {},
        Err(err) => {
            info!("Open device err: {}", err);
            return Device {
                port: "".to_string(),
                message: err.to_string(),
            }
        },
    }

    return Device {
        port: selected_port_name.clone(),
        message: "".to_string(),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, get_device, set_value])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
