"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Info, TriangleAlert, X } from "lucide-react";

type ToastLevel = "error" | "warning" | "info";

interface ToastItem {
  id: string;
  level: ToastLevel;
  title: string;
  description?: string;
  duration: number;
}

interface ShowToastOptions {
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (level: ToastLevel, options: ShowToastOptions) => void;
  info: (options: ShowToastOptions) => void;
  warning: (options: ShowToastOptions) => void;
  error: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function buildToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function levelStyles(level: ToastLevel) {
  switch (level) {
    case "error":
      return {
        icon: AlertCircle,
        badge: "错误",
        className:
          "border-red-200/80 bg-white text-stone-900 shadow-[0_24px_60px_-30px_rgba(185,28,28,0.45)] dark:border-red-900/60 dark:bg-stone-900 dark:text-stone-50",
        accent: "bg-red-500",
        iconColor: "text-red-500 dark:text-red-400",
      };
    case "warning":
      return {
        icon: TriangleAlert,
        badge: "警告",
        className:
          "border-amber-200/80 bg-white text-stone-900 shadow-[0_24px_60px_-30px_rgba(217,119,6,0.45)] dark:border-amber-900/60 dark:bg-stone-900 dark:text-stone-50",
        accent: "bg-amber-500",
        iconColor: "text-amber-500 dark:text-amber-400",
      };
    default:
      return {
        icon: Info,
        badge: "信息",
        className:
          "border-sky-200/80 bg-white text-stone-900 shadow-[0_24px_60px_-30px_rgba(2,132,199,0.45)] dark:border-sky-900/60 dark:bg-stone-900 dark:text-stone-50",
        accent: "bg-sky-500",
        iconColor: "text-sky-500 dark:text-sky-400",
      };
  }
}

function ToastCell({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const remainingRef = useRef(toast.duration);
  const startTimeRef = useRef(Date.now());

  const startTimer = useCallback((duration: number) => {
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    startTimeRef.current = Date.now();
  }, [onDismiss, toast.id]);

  useEffect(() => {
    startTimer(toast.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [startTimer, toast.duration]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      // 计算剩余时间
      remainingRef.current -= (Date.now() - startTimeRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // 只有在剩余时间大于零时才重新启动
    if (remainingRef.current > 0) {
      startTimer(remainingRef.current);
    } else {
      onDismiss(toast.id);
    }
  };

  const styles = levelStyles(toast.level);
  const Icon = styles.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 48, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 48, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-[1.5rem] border p-4 ${styles.className}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${styles.accent}`} />
      <div className="flex items-start gap-3 pl-2">
        <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800 ${styles.iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{toast.title}</p>
          </div>
          {toast.description && <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{toast.description}</p>}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          aria-label="关闭通知"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[min(92vw,24rem)] flex-col gap-3 sm:right-6 sm:top-6">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <ToastCell key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (level: ToastLevel, options: ShowToastOptions) => {
      const id = buildToastId();
      setToasts((current) => [
        ...current,
        {
          id,
          level,
          title: options.title,
          description: options.description,
          duration: options.duration ?? 3600,
        },
      ]);
    },
    [],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      info: (options) => showToast("info", options),
      warning: (options) => showToast("warning", options),
      error: (options) => showToast("error", options),
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}