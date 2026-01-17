import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./components/utils/routes";
import './index.css';
import { ThemeProvider } from "@/components/utils/theme-provider";
import ControlMenu from "@/components/custom/control-menu";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SecurityWarning } from "@/components/custom/SecurityWarning";
import AdminElevateButton from "@/components/custom/AdminElevateButton";
import { ErrorBoundary } from "@/components/custom/ErrorBoundary";
import { UpdateModal } from "@/components/custom/UpdateModal";
import { updateService } from "@/services/updateService";
import { invoke } from "@tauri-apps/api/core";

invoke<boolean>('is_minimized_start').then((isMinimizedStart) => {
  updateService.setMinimizedStart(isMinimizedStart);

  if (!isMinimizedStart) {
    setTimeout(() => {
      updateService.autoUpdate().catch(console.error);
    }, 3000);
  } else {
    setTimeout(() => {
      updateService.autoUpdate().catch(console.error);
    }, 10000);
  }
}).catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <SecurityWarning onContinue={() => { }} />
        <ControlMenu />
        <AppRouter />
        <AdminElevateButton />
        <UpdateModal autoShow={true} />
        <BorderBeam duration={8} size={150} colorFrom="#FAFAFA" colorTo="#FAFAFA" />
        <BorderBeam delay={4} duration={8} size={150} colorFrom="#FAFAFA" colorTo="#FAFAFA" />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
);
