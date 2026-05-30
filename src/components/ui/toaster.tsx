"use client";

import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { AlertTriangle, CheckCircle2, CircleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function ToastIcon({ variant }: { variant?: string | null }) {
  const className = "mt-0.5 h-4 w-4 shrink-0 opacity-90";

  switch (variant) {
    case "destructive":
      return <CircleAlert className={cn(className, "text-destructive")} />;
    case "warning":
      return <AlertTriangle className={cn(className, "text-amber-500")} />;
    case "success":
      return <CheckCircle2 className={cn(className, "text-primary")} />;
    default:
      return <Info className={cn(className, "text-primary/80")} />;
  }
}

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div
            className="absolute bottom-2 left-0 top-2 w-1 rounded-full bg-[var(--toast-accent)]"
            aria-hidden
          />
          <ToastIcon variant={props.variant} />
          <div className="min-w-0 flex-1 space-y-0.5">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
