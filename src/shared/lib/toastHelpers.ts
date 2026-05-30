type ToastFn = (props: Record<string, unknown>) => void;

export function toastSuccess(toast: ToastFn, title: string, description: string) {
  toast({ title, description, variant: "success", duration: 3000 });
}

export function toastError(toast: ToastFn, title: string, description: string) {
  toast({ title, description, variant: "destructive", duration: 4000 });
}

export function toastLegacySuccess(toast: ToastFn, title: string, description: string) {
  toast({ title, description, success: "true", duration: 3000 });
}

export function toastLegacyError(toast: ToastFn, title: string, description: string) {
  toast({ title, description, success: "false", duration: 3000 });
}
