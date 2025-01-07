import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./components/utils/routes";
import './index.css';
import { ThemeProvider } from "@/components/utils/theme-provider";
import ControlMenu from "@/components/custom/control-menu";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ControlMenu />
      <AppRouter />
    </ThemeProvider>
  </React.StrictMode>,
);
