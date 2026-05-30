import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/routes";
import './index.css';
import { ThemeProvider } from "@/components/utils/theme-provider";
import ControlMenu from "@/components/custom/control-menu";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SecurityWarning } from "@/components/custom/SecurityWarning";
import { ErrorBoundary } from "@/components/custom/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ErrorBoundary>
        <SecurityWarning onContinue={() => { }} />
        <ControlMenu />
        <AppRouter />
        <BorderBeam duration={8} size={150} colorFrom="#FAFAFA" colorTo="#FAFAFA" />
        <BorderBeam delay={4} duration={8} size={150} colorFrom="#FAFAFA" colorTo="#FAFAFA" />
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>,
);
