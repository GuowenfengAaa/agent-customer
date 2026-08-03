import { create } from "zustand";
import type { PurchaseMode } from "@/types/domain";
import { resolveCurrentCity } from "@/utils/location";

export type LocationStatus =
  | "idle"
  | "locating"
  | "located"
  | "denied"
  | "error"
  | "unsupported";

interface AppState {
  mode: PurchaseMode;
  city: string;
  latitude?: number;
  longitude?: number;
  locationStatus: LocationStatus;
  sessionId?: string;
  draftId?: string;
  setMode: (mode: PurchaseMode) => void;
  setCity: (city: string) => void;
  locateCurrentPosition: () => void;
  setAgentContext: (context: { sessionId?: string; draftId?: string }) => void;
  resetAgentContext: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: "TRADITIONAL",
  city: "洛阳",
  locationStatus: "idle",
  setMode: (mode) => set({ mode }),
  setCity: (city) => set({ city }),
  locateCurrentPosition: () => {
    if (get().locationStatus === "locating") return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      set({ locationStatus: "unsupported" });
      return;
    }

    set({ locationStatus: "locating" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        set({
          city: resolveCurrentCity(coords.latitude, coords.longitude),
          latitude: coords.latitude,
          longitude: coords.longitude,
          locationStatus: "located",
        });
      },
      (error) => {
        set({
          locationStatus:
            error.code === error.PERMISSION_DENIED ? "denied" : "error",
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  },
  setAgentContext: (context) => set(context),
  resetAgentContext: () => set({ sessionId: undefined, draftId: undefined }),
}));
