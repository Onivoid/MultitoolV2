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
  "[data-scroll-container]",
  ".react-colorful",
  "[data-radix-popper-content-wrapper]",
].join(", ");

/** Marge pour attraper la scrollbar (4px custom + marge OS / WebView2). */
const SCROLLBAR_GUTTER_PX = 18;

function overflowAllowsScroll(value: string): boolean {
  return value === "auto" || value === "scroll" || value === "overlay";
}

function canScrollVertically(el: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(el);
  return overflowAllowsScroll(overflowY) && el.scrollHeight > el.clientHeight + 1;
}

function canScrollHorizontally(el: HTMLElement): boolean {
  const { overflowX } = window.getComputedStyle(el);
  return overflowAllowsScroll(overflowX) && el.scrollWidth > el.clientWidth + 1;
}

/** Clic dans la gouttière scrollbar — ne doit pas déclencher le drag fenêtre Tauri. */
function isScrollbarInteraction(e: MouseEvent, target: HTMLElement): boolean {
  let node: HTMLElement | null = target;
  while (node) {
    const vScroll = canScrollVertically(node);
    const hScroll = canScrollHorizontally(node);
    if (vScroll || hScroll) {
      const rect = node.getBoundingClientRect();
      const gutter = SCROLLBAR_GUTTER_PX;
      const vGutter = vScroll ? gutter : 0;
      const hGutter = hScroll ? gutter : 0;

      if (
        vScroll &&
        e.clientX >= rect.right - gutter &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom - (hScroll ? hGutter : 0)
      ) {
        return true;
      }

      if (
        hScroll &&
        e.clientY >= rect.bottom - gutter &&
        e.clientY <= rect.bottom &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right - (vScroll ? vGutter : 0)
      ) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

function isDragExcluded(target: HTMLElement, event: MouseEvent): boolean {
  if (target.closest(DRAG_EXCLUDED_SELECTOR)) return true;
  return isScrollbarInteraction(event, target);
}

export function DragRegion({ children, className = "" }: DragRegionProps) {
  const appWindow = getCurrentWindow();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!isDragExcluded(target, e)) {
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
