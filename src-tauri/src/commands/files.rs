use std::fs;
use std::path::Path;
use std::process::Command;

#[tauri::command]
pub fn read_config_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read {}: {}", path, e))
}

#[tauri::command]
pub fn write_config_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write {}: {}", path, e))
}

#[tauri::command]
pub fn delete_config_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("File does not exist: {}", path));
    }
    fs::remove_file(p).map_err(|e| format!("Failed to delete {}: {}", path, e))
}

#[tauri::command]
pub fn show_in_folder(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    let folder = if p.is_dir() {
        p
    } else {
        p.parent().ok_or_else(|| "No parent directory".to_string())?
    };

    #[cfg(target_os = "macos")]
    {
        if p.is_file() {
            Command::new("open")
                .args(["-R", &path])
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            Command::new("open")
                .arg(folder)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(folder)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
