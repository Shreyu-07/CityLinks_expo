import { useState, useRef, useCallback } from 'react';

export const useToast = () => {
  const [toastState, setToastState] = useState<{ message: string; type: "success" | "info" | "error" | "warning"; visible: boolean }>({ message: "", type: "info", visible: false });
  const timerRef = useRef<any>(null);
  const showToast = useCallback((message: string, type: "success" | "info" | "error" | "warning" = "info", duration = 2500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastState({ message, type, visible: true });
    timerRef.current = setTimeout(() => setToastState(p => ({ ...p, visible: false })), duration);
  }, []);
  return { toastState, showToast };
};
