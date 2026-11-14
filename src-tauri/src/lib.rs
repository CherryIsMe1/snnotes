use tauri::Manager;

#[tauri::command]
fn trigger_system_alarm(app: tauri::AppHandle, title: String, message: String) -> Result<(), String> {
    println!("[SNNotes] Alarm Triggered: {} - {}", title, message);
    
    // Attempt window focus/unminimize so user sees the alarm immediately
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            trigger_system_alarm
        ])
        .run(tauri::generate_context!())
        .expect("error while running SNNotes");
}
