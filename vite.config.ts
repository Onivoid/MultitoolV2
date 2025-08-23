import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

const host = process.env.TAURI_DEV_HOST;

// Lire la version depuis tauri.conf.json pour la cohérence
const tauriConfig = JSON.parse(
    readFileSync("./src-tauri/tauri.conf.json", "utf8")
);
const appVersion = tauriConfig.version;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [react()],
    define: {
        "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
        // Injecter les variables d'environnement Tauri pour la détection de distribution
        "process.env.TAURI_ENV_MS_STORE": JSON.stringify(
            process.env.TAURI_ENV_MS_STORE
        ),
        "process.env.TAURI_ENV_PORTABLE": JSON.stringify(
            process.env.TAURI_ENV_PORTABLE
        ),
        "process.env.TAURI_ENV_DISTRIBUTION": JSON.stringify(
            process.env.TAURI_ENV_DISTRIBUTION
        ),
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 1421,
              }
            : undefined,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
}));
