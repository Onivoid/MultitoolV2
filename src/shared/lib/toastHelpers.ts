type ToastFn = (props: Record<string, unknown>) => void;

export function toastSuccess(toast: ToastFn, title: string, description?: string) {
  toast({
    title,
    ...(description ? { description } : {}),
    variant: "success",
  });
}

export function toastError(toast: ToastFn, title: string, description?: string) {
  toast({
    title,
    ...(description ? { description } : {}),
    variant: "destructive",
  });
}

export function toastWarning(toast: ToastFn, title: string, description?: string) {
  toast({
    title,
    ...(description ? { description } : {}),
    variant: "warning",
  });
}
