import React, { useEffect, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

interface DragRegionProps {
  children: React.ReactNode;
  className?: string;
}

export function DragRegion({ children, className = '' }: DragRegionProps) {
  const appWindow = getCurrentWindow();
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Vérifier si l'élément cliqué est interactif
      const target = e.target as HTMLElement;
      const isInteractive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) || 
                           target.closest('button, a, input, select, textarea, [role="button"]');
      
      if (!isInteractive) {
        // Pour les éléments non-interactifs, activer le drag immédiatement
        appWindow.startDragging();
      } else {
        // Pour les éléments interactifs, enregistrer la position initiale
        startPosRef.current = { x: e.clientX, y: e.clientY };
        isMouseDownRef.current = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Si la souris est enfoncée sur un élément interactif et que nous détectons 
      // un mouvement significatif, commencer le drag
      if (isMouseDownRef.current && startPosRef.current) {
        const deltaX = Math.abs(e.clientX - startPosRef.current.x);
        const deltaY = Math.abs(e.clientY - startPosRef.current.y);
        
        // Si l'utilisateur a bougé la souris d'au moins 5 pixels, commencer le drag
        if (deltaX > 5 || deltaY > 5) {
          appWindow.startDragging();
          isMouseDownRef.current = false;
          startPosRef.current = null;
        }
      }
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      startPosRef.current = null;
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <main ref={containerRef} className={className}>
      {children}
    </main>
  );
}