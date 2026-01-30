import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type ToastType = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let id = 0;
let notifyFn: ToastContextValue | null = null;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((toastId: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const success = useCallback((message: string) => {
    const toastId = ++id;
    setToasts((prev) => [...prev, { id: toastId, message, type: "success" }]);
    setTimeout(() => remove(toastId), 3000);
  }, [remove]);

  const error = useCallback((message: string) => {
    const toastId = ++id;
    setToasts((prev) => [...prev, { id: toastId, message, type: "error" }]);
    setTimeout(() => remove(toastId), 4000);
  }, [remove]);

  const api = { success, error };

  useEffect(() => {
    notifyFn = api;
    return () => {
      notifyFn = null;
    };
  }, [success, error]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
              t.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** Drop-in replacement for default import from "react-hot-toast" */
export const toast = {
  success: (message: string) => notifyFn?.success(message),
  error: (message: string) => notifyFn?.error(message),
};
