use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init());

    // Deep-link plugin is the bridge for file-association opens on all platforms.
    builder = builder.plugin(tauri_plugin_deep_link::init());

    builder
        .setup(|app| {
            // On desktop platforms, register the scheme at runtime if it hasn't
            // been registered by the installer. On mobile, the OS handles this
            // via the bundle configuration.
            #[cfg(desktop)]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                let _ = app.deep_link().register_all();
            }
            let _ = app;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ScreenJSON Viewer");
}
