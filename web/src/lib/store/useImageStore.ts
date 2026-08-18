import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ImageFormat, OutputFormat, QueueItemMeta, SavedPreference, UploadedImage } from "@/lib/types";

export type ThemeMode = "light" | "dark" | "system";

interface Preferences extends SavedPreference {
  theme: ThemeMode;
  lastFormat: OutputFormat;
  lastQuality: number;
}

interface ImageStoreState {
  images: UploadedImage[];
  queue: QueueItemMeta[];
  selectedImageId: string | null;
  isBatchProcessing: boolean;
  batchTotal: number;
  batchCompleted: number;
  preferences: Preferences;
  addImages: (items: UploadedImage[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setSelectedImage: (id: string | null) => void;
  setQueueItem: (id: string, patch: Partial<QueueItemMeta>) => void;
  addQueueItems: (items: QueueItemMeta[]) => void;
  removeQueueItem: (id: string) => void;
  clearQueue: () => void;
  setBatchProgress: (processed: number, total: number, running: boolean) => void;
  updatePreferences: (patch: Partial<Preferences>) => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useImageStore = create<ImageStoreState>()(
  persist(
    (set) => ({
      images: [],
      queue: [],
      selectedImageId: null,
      isBatchProcessing: false,
      batchTotal: 0,
      batchCompleted: 0,
      preferences: {
        theme: "system",
        lastFormat: "webp",
        lastQuality: 82,
      },
      addImages: (items) =>
        set((state) => ({
          images: [...state.images, ...items],
          queue: [...state.queue, ...items.map(toQueueItem)],
        })),
      removeImage: (id) =>
        set((state) => ({
          images: state.images.filter((i) => i.id !== id),
          queue: state.queue.filter((i) => i.id !== id),
          selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
        })),
      clearImages: () => set({ images: [], queue: [], selectedImageId: null }),
      setSelectedImage: (id) => set({ selectedImageId: id }),
      setQueueItem: (id, patch) =>
        set((state) => ({
          queue: state.queue.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addQueueItems: (items) =>
        set((state) => {
          const existing = new Set(state.queue.map((i) => i.id));
          const fresh = items.filter((i) => !existing.has(i.id));
          return { queue: [...state.queue, ...fresh] };
        }),
      removeQueueItem: (id) =>
        set((state) => ({ queue: state.queue.filter((i) => i.id !== id) })),
      clearQueue: () => set({ queue: [] }),
      setBatchProgress: (completed, total, running) =>
        set({ batchCompleted: completed, batchTotal: total, isBatchProcessing: running }),
      updatePreferences: (patch) =>
        set((state) => ({ preferences: { ...state.preferences, ...patch } })),
      setTheme: (theme) =>
        set((state) => ({ preferences: { ...state.preferences, theme } })),
    }),
    {
      name: "imagetools-preferences",
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
);

function toQueueItem(image: UploadedImage): QueueItemMeta {
  return {
    id: image.id,
    file: image.file,
    thumbUrl: image.url,
    originalSize: image.size,
    status: "waiting",
    progress: 0,
  };
}

export type { ImageFormat };
export function useSelectedImage() {
  return useImageStore((state) => state.images.find((i) => i.id === state.selectedImageId) ?? null);
}
export function useQueueItem(id: string) {
  return useImageStore((state) => state.queue.find((i) => i.id === id));
}