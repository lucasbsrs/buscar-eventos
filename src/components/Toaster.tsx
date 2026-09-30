"use client";

import { Toast } from "@base-ui/react/toast";
import {
  ToastViewport,
  ToastRoot,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = Toast.useToastManager();

  return (
    <ToastViewport>
      {toasts.map((toast) => (
        <ToastRoot key={toast.id} toast={toast}>
          <ToastContent>
            {toast.title && <ToastTitle />}
            {toast.description && <ToastDescription />}
          </ToastContent>
          <ToastClose />
        </ToastRoot>
      ))}
    </ToastViewport>
  );
}
