mod commands;
mod models;
mod scanner;

use commands::{files, scan, watch};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan::scan_config_tree,
            scan::get_inheritance_chain,
            scan::search_config_content,
            files::read_config_file,
            files::write_config_file,
            watch::start_watching,
            watch::stop_watching,
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
