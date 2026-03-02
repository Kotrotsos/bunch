use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

static WATCHER: Mutex<Option<RecommendedWatcher>> = Mutex::new(None);

#[tauri::command]
pub fn start_watching(app: AppHandle) -> Result<(), String> {
    let claude_home = dirs::home_dir()
        .ok_or("Could not determine home directory")?
        .join(".claude");

    let app = Arc::new(app);
    let app_clone = Arc::clone(&app);

    let watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
        if let Ok(event) = res {
            let dominated_by_relevant = event.paths.iter().any(|p| {
                let p_str = p.to_string_lossy();
                p_str.ends_with(".md")
                    || p_str.ends_with(".json")
                    || p_str.contains("agents")
                    || p_str.contains("commands")
            });

            if dominated_by_relevant {
                let _ = app_clone.emit("config-file-changed", ());
            }
        }
    })
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    let mut watcher = watcher;
    watcher
        .watch(&claude_home, RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch directory: {}", e))?;

    watcher
        .configure(Config::default())
        .map_err(|e| format!("Failed to configure watcher: {}", e))?;

    let mut guard = WATCHER.lock().map_err(|e| e.to_string())?;
    *guard = Some(watcher);

    Ok(())
}

#[tauri::command]
pub fn stop_watching() -> Result<(), String> {
    let mut guard = WATCHER.lock().map_err(|e| e.to_string())?;
    *guard = None;
    Ok(())
}
