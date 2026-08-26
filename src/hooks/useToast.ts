"use client";

import * as React from "react";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 5000;

export interface ToastItem {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "success" | "danger";
  open?: boolean;
}

type Listener = (toasts: ToastItem[]) => void;

let memoryState: ToastItem[] = [];
const listeners: Listener[] = [];

function emit() {
  listeners.forEach((listener) => listener(memoryState));
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function toast(props: Omit<ToastItem, "id" | "open">) {
  const id = genId();
  const dismiss = () => {
    memoryState = memoryState.map((t) => (t.id === id ? { ...t, open: false } : t));
    emit();
  };

  memoryState = [{ ...props, id, open: true }, ...memoryState].slice(0, TOAST_LIMIT);
  emit();

  setTimeout(dismiss, TOAST_REMOVE_DELAY);

  return { id, dismiss };
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>(memoryState);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      memoryState = memoryState.filter((t) => t.id !== id);
      emit();
    },
  };
}
