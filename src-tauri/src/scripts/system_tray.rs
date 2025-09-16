#[cfg(target_os = "windows")]
use tray_icon::{TrayIcon, TrayIconBuilder, menu::{Menu, MenuItem, PredefinedMenuItem}};
#[cfg(target_os = "windows")]
use std::sync::Arc;
use tauri::AppHandle;

pub struct SystemTray {
    #[cfg(target_os = "windows")]
    tray_icon: Option<TrayIcon>,
    #[cfg(not(target_os = "windows"))]
    _placeholder: (),
}

impl SystemTray {
    pub fn new() -> Self {
        Self { 
            #[cfg(target_os = "windows")]
            tray_icon: None,
            #[cfg(not(target_os = "windows"))]
            _placeholder: (),
        }
    }

    pub fn setup(&mut self, _app_handle: &AppHandle) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            // Create the tray menu
            let menu = Menu::new();
            
            // Add menu items
            let show_item = MenuItem::new("Afficher", true, None);
            let hide_item = MenuItem::new("Masquer", true, None);
            let separator = PredefinedMenuItem::separator();
            let quit_item = MenuItem::new("Quitter", true, None);
            
            menu.append(&show_item).map_err(|e| e.to_string())?;
            menu.append(&hide_item).map_err(|e| e.to_string())?;
            menu.append(&separator).map_err(|e| e.to_string())?;
            menu.append(&quit_item).map_err(|e| e.to_string())?;

            // Load the tray icon
            let icon_data = include_bytes!("../../icons/32x32.png");
            let icon = tray_icon::Icon::from_png(icon_data).map_err(|e| e.to_string())?;

            // Create the tray icon
            let tray_builder = TrayIconBuilder::new()
                .with_menu(Box::new(menu))
                .with_tooltip("Multitool V2")
                .with_icon(icon);

            let tray = tray_builder.build().map_err(|e| e.to_string())?;

            // Set up event handling
            self.setup_tray_events(_app_handle.clone(), &show_item, &hide_item, &quit_item)?;

            self.tray_icon = Some(tray);
        }
        
        #[cfg(not(target_os = "windows"))]
        {
            // On non-Windows platforms, system tray is not supported
            return Err("System tray is only supported on Windows".to_string());
        }
        
        #[cfg(target_os = "windows")]
        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn setup_tray_events(
        &self,
        app_handle: AppHandle,
        show_item: &MenuItem,
        hide_item: &MenuItem,
        quit_item: &MenuItem,
    ) -> Result<(), String> {
        let app_handle_clone = app_handle.clone();
        let show_id = show_item.id().clone();
        let hide_id = hide_item.id().clone();
        let quit_id = quit_item.id().clone();

        // Handle menu events
        tray_icon::menu::MenuEvent::set_event_handler(Some(Box::new(move |event| {
            if event.id == show_id {
                if let Some(window) = app_handle_clone.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            } else if event.id == hide_id {
                if let Some(window) = app_handle_clone.get_webview_window("main") {
                    let _ = window.hide();
                }
            } else if event.id == quit_id {
                app_handle_clone.exit(0);
            }
        })));

        // Handle tray icon click
        let app_handle_for_click = app_handle.clone();
        tray_icon::TrayIconEvent::set_event_handler(Some(Box::new(move |event| {
            match event {
                tray_icon::TrayIconEvent::Click { button, button_state, .. } => {
                    if button == tray_icon::MouseButton::Left && button_state == tray_icon::MouseButtonState::Up {
                        // Left click to show/hide window
                        if let Some(window) = app_handle_for_click.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                }
                _ => {}
            }
        })));

        Ok(())
    }

    pub fn destroy(&mut self) {
        #[cfg(target_os = "windows")]
        {
            if let Some(tray) = self.tray_icon.take() {
                // The tray icon will be automatically destroyed when dropped
                drop(tray);
            }
        }
    }
}

impl Drop for SystemTray {
    fn drop(&mut self) {
        self.destroy();
    }
}