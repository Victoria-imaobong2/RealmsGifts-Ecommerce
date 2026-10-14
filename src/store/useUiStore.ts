import { create } from "zustand";

export type Panel = "cart" | "search" | "menu" | null;

export interface Toast {
  id: number;
  message: string;
  tone?: "success" | "error" | "info";
}

interface UiState {
  panel: Panel;
  toasts: Toast[];
  open: (panel: Exclude<Panel, null>) => void;
  close: () => void;
  toast: (message: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUiStore = create<UiState>((set) => ({
  panel: null,
  toasts: [],
  open: (panel) => set({ panel }),
  close: () => set({ panel: null }),
  toast: (message, tone = "success") => {
    const id = ++toastId;
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, message, tone }] }));
    setTimeout(() => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })), 3200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
