import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/routes";
import "./index.css";
import { ThemeProvider } from "@/components/utils/theme-provider";
import ControlMenu from "@/components/custom/control-menu";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SecurityWarning } from "@/components/custom/SecurityWarning";
import { ErrorBoundary } from "@/components/custom/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppBackground } from "@/components/custom/AppBackground";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <>
    <AppBackground />
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider delayDuration={0}>
          <div className="relative z-10 flex h-screen min-h-0 w-screen flex-col overflow-hidden">
            <ErrorBoundary>
              <SecurityWarning onContinue={() => {}} />
              <ControlMenu />
              <AppRouter />
              <BorderBeam
                duration={8}
                size={150}
                colorFrom="#FAFAFA"
                colorTo="#FAFAFA"
              />
              <BorderBeam
                delay={4}
                duration={8}
                size={150}
                colorFrom="#FAFAFA"
                colorTo="#FAFAFA"
              />
            </ErrorBoundary>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </React.StrictMode>
  </>,
);
