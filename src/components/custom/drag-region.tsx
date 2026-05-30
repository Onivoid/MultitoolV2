import React, { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface DragRegionProps {
  children: React.ReactNode;
  className?: string;
}

const DRAG_EXCLUDED_SELECTOR = [
  "button",
  "a",
  "input",
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="slider"]',
  '[role="tab"]',
  "[data-no-window-drag]",
  ".react-colorful",
  "[data-radix-popper-content-wrapper]",
].join(", ");

function isDragExcluded(target: HTMLElement): boolean {
  return Boolean(target.closest(DRAG_EXCLUDED_SELECTOR));
}

export function DragRegion({ children, className = "" }: DragRegionProps) {
  const appWindow = getCurrentWindow();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!isDragExcluded(target)) {
        appWindow.startDragging();
      }
    };

    container.addEventListener("mousedown", handleMouseDown);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
    };
  }, [appWindow]);

  return (
    <main ref={containerRef} className={className}>
      {children}
    </main>
  );
}
