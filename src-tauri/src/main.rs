
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serialport::*;
use log::*;
use lazy_static::lazy_static;
use std::sync::Mutex;
use core::time::Duration;

const GLOBAL_POWER_SCALE: f64 = 32767.0;
lazy_static! {
    static ref GLOBAL_SERIAL_PORT: Mutex<Option<Box<dyn SerialPort>>> = Mutex::new(None);
}


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn open_device(port_name: &str) -> Result<()> {
    let mut global_port = GLOBAL_SERIAL_PORT.lock().unwrap();
    if let Some(ref mut port) = *global_port {
        // Do nothing
        Ok(())
    } else {
        match serialport::new(port_name, 9600)
        .timeout(Duration::from_millis(0))
        .open() {
            Ok(port) => {
                *global_port = Some(port);
                Ok(())
            },
            Err(err) => {
                Err(err)
            }
        }
    }


}

#[tauri::command]
fn set_value(input: &str) {
    let parts: Vec<&str> = input.split(":").collect();
    let key = parts[0];
    let value = parts[1];
    info!("{}", key);
    let mut global_port = GLOBAL_SERIAL_PORT.lock().unwrap();
    if key == "power" {
        let mut num = value.parse::<f64>().unwrap();
                println!("Parsed integer: {}", num);
                if num < 5.0 {
                    num = 5.0;
                }
                let power_scale = GLOBAL_POWER_SCALE;
                info!("{}", power_scale);
                num = num/100.0;
                info!("{}", num);
                num = num * power_scale;
                info!("{}", num);
                let int_num: i32 = num as i32;
                let scaled_value = &int_num.to_string().clone();
        let command = "axis.0.".to_string() + key + "=" + scaled_value + "\n\r";
        info!("{}", command);

        if let Some(ref mut port) = *global_port {
            match port.write(command.as_bytes()) {
                Ok(_) => println!("Command sent successfully"),
                Err(e) => println!("Failed to send command: {}", e),
            }
        } else {
            println!("Serial port not initialized");
        }
    }
}

#[tauri::command]
fn get_device() -> String {
    let mut selected_port_pid = 0;
    let mut selected_port_name = String::new();
    let ports = serialport::available_ports().expect("No ports found!");
    for p in ports {
        //info!("{:#?}", p);
        match &p.port_type {
            SerialPortType::UsbPort(usb_info) => {
                if (usb_info.pid == 65456) {
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
    if (selected_port_name == "") {
        return "".to_string()
    }

    match open_device(&selected_port_name) {
        Ok(()) => {},
        Err(err) => info!("{}", err),
    }

    return selected_port_name.clone();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![greet, get_device, set_value])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
