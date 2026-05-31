use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

/// Lit le contenu à partir d'un offset (pour scan incrémental de gros fichiers).
pub fn read_from_offset(path: &Path, offset: u64) -> Result<String, String> {
    let mut file =
        fs::File::open(path).map_err(|e| format!("Impossible d'ouvrir {}: {e}", path.display()))?;
    let len = file.metadata().map_err(|e| e.to_string())?.len();
    if offset >= len {
        return Ok(String::new());
    }
    file.seek(SeekFrom::Start(offset))
        .map_err(|e| e.to_string())?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).map_err(|e| e.to_string())?;
    Ok(String::from_utf8_lossy(&buf).into_owned())
}

pub fn read_log_file_lossy(path: &Path) -> Result<String, String> {
    let bytes =
        fs::read(path).map_err(|e| format!("Impossible de lire {}: {e}", path.display()))?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}
