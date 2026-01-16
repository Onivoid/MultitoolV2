use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager,
};

/// Configure le system tray de l'application avec les options d'affichage et de fermeture.
pub fn setup_system_tray(app: &AppHandle) -> Result<(), String> {
    let show_item = MenuItem::with_id(app, "show", "Afficher", true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let hide_item =
        MenuItem::with_id(app, "hide", "Masquer", true, None::<&str>).map_err(|e| e.to_string())?;
    let quit_item =
        MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>).map_err(|e| e.to_string())?;

    let menu =
        Menu::with_items(app, &[&show_item, &hide_item, &quit_item]).map_err(|e| e.to_string())?;

    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("Multitool V2")
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                println!("[System Tray] Show button clicked");
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }
            "hide" => {
                println!("[System Tray] Hide button clicked");
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "quit" => {
                println!("[System Tray] Quit button clicked");
                app.exit(0);
            }
            _ => {
                println!("[System Tray] Unhandled menu event: {:?}", event.id);
            }
        })
        .build(app)
        .map_err(|e| e.to_string())?;

    Ok(())
}
