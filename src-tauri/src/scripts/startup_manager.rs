use tauri::command;

#[cfg(target_os = "windows")]
use auto_launch::AutoLaunch;

/// Active le démarrage automatique de l'application au démarrage de Windows.
///
/// L'application sera lancée minimisée dans le system tray.
#[command]
pub fn enable_auto_startup() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let app_name = "MultitoolV2";
        let app_path = std::env::current_exe()
            .map_err(|e| format!("Impossible de récupérer le chemin de l'exécutable: {}", e))?;

        let auto_launch = AutoLaunch::new(
            app_name,
            app_path.to_str().ok_or("Chemin invalide")?,
            &["--minimized"],
        );

        auto_launch.enable().map_err(|e| {
            format!(
                "Erreur lors de l'activation du démarrage automatique: {}",
                e
            )
        })?;

        println!("[Startup Manager] Démarrage automatique activé");
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Le démarrage automatique n'est supporté que sur Windows".to_string())
    }
}

/// Désactive le démarrage automatique de l'application.
#[command]
pub fn disable_auto_startup() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let app_name = "MultitoolV2";
        let app_path = std::env::current_exe()
            .map_err(|e| format!("Impossible de récupérer le chemin de l'exécutable: {}", e))?;

        let auto_launch = AutoLaunch::new(
            app_name,
            app_path.to_str().ok_or("Chemin invalide")?,
            &["--minimized"],
        );

        auto_launch.disable().map_err(|e| {
            format!(
                "Erreur lors de la désactivation du démarrage automatique: {}",
                e
            )
        })?;

        println!("[Startup Manager] Démarrage automatique désactivé");
        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Le démarrage automatique n'est supporté que sur Windows".to_string())
    }
}

/// Vérifie si le démarrage automatique est activé.
#[command]
pub fn is_auto_startup_enabled() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let app_name = "MultitoolV2";
        let app_path = std::env::current_exe()
            .map_err(|e| format!("Impossible de récupérer le chemin de l'exécutable: {}", e))?;

        let auto_launch = AutoLaunch::new(
            app_name,
            app_path.to_str().ok_or("Chemin invalide")?,
            &["--minimized"],
        );

        auto_launch.is_enabled().map_err(|e| {
            format!(
                "Erreur lors de la vérification du démarrage automatique: {}",
                e
            )
        })
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}
