import { create } from 'zustand';
import type { PurchaseMode } from '@/types/domain';

interface AppState {
  mode: PurchaseMode;
  city: string;
  sessionId?: string;
  draftId?: string;
  setMode: (mode: PurchaseMode) => void;
  setCity: (city: string) => void;
  setAgentContext: (context: { sessionId?: string; draftId?: string }) => void;
  resetAgentContext: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'TRADITIONAL',
  city: '北京',
  setMode: (mode) => set({ mode }),
  setCity: (city) => set({ city }),
  setAgentContext: (context) => set(context),
  resetAgentContext: () => set({ sessionId: undefined, draftId: undefined }),
}));
