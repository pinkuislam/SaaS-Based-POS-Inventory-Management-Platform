import { toast } from "sonner";

/** App-wide toast notifications (Sonner). */
export const notify = {
  success(message: string, description?: string) {
    toast.success(message, description ? { description } : undefined);
  },
  error(message: string, description?: string) {
    toast.error(message, description ? { description } : undefined);
  },
  warning(message: string, description?: string) {
    toast.warning(message, description ? { description } : undefined);
  },
  info(message: string, description?: string) {
    toast.info(message, description ? { description } : undefined);
  },
  loading(message: string) {
    return toast.loading(message);
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) {
    return toast.promise(promise, messages);
  },
};

export { toast };
