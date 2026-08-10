import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentCardPayload } from '@/services/agentSse';
import type { BrowserLocation } from '@/services/location';
import type { PurchaseMode } from '@/types/domain';
import { resolveCurrentCity } from '@/utils/location';

export type LocationStatus =
  | 'idle'
  | 'locating'
  | 'located'
  | 'denied'
  | 'error'
  | 'unsupported';

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: string;
  cards?: AgentCardPayload[];
}

type AgentLocationState = 'idle' | 'locating' | 'ready' | 'error';

const defaultAgentMessages = (): AgentChatMessage[] => [];

interface AppState {
  mode: PurchaseMode;
  city: string;
  latitude?: number;
  longitude?: number;
  locationStatus: LocationStatus;
  sessionId?: string;
  memoryId?: string;
  draftId?: string;
  agentInput: string;
  agentMessages: AgentChatMessage[];
  agentProgress: string[];
  agentBrowserLocation?: BrowserLocation;
  agentLocationState: AgentLocationState;
  agentLocationError: string;
  setMode: (mode: PurchaseMode) => void;
  setCity: (city: string) => void;
  selectCity: (city: { name: string; latitude: number; longitude: number }) => void;
  locateCurrentPosition: () => void;
  setAgentContext: (context: { sessionId?: string; memoryId?: string; draftId?: string }) => void;
  resetAgentContext: () => void;
  setAgentInput: (input: string) => void;
  setAgentMessages: (messages: AgentChatMessage[]) => void;
  appendAgentMessages: (messages: AgentChatMessage[]) => void;
  appendAgentMessageContent: (id: string, content: string) => void;
  patchAgentMessage: (id: string, patch: Partial<AgentChatMessage>) => void;
  setAgentProgress: (progress: string[]) => void;
  setAgentBrowserLocation: (location?: BrowserLocation) => void;
  setAgentLocationState: (state: AgentLocationState) => void;
  setAgentLocationError: (error: string) => void;
  clearAgentConversation: () => void;
  resetAgentSessionState: () => void;
}

let locateToken = 0;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      mode: 'TRADITIONAL',
      city: '北京',
      locationStatus: 'idle' as LocationStatus,
      agentInput: '',
      agentMessages: defaultAgentMessages(),
      agentProgress: [],
      agentLocationState: 'idle',
      agentLocationError: '',
      setMode: (mode) => set({ mode }),
      setCity: (city) => set({ city }),
      selectCity: (city) => {
        locateToken += 1;
        set({
          city: city.name,
          latitude: city.latitude,
          longitude: city.longitude,
          locationStatus: 'located',
        });
      },
      locateCurrentPosition: () => {
        if (get().locationStatus === 'locating') return;

        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          set({ locationStatus: 'unsupported' });
          return;
        }

        set({ locationStatus: 'locating' });
        const token = ++locateToken;
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            if (token !== locateToken) return;
            set({
              city: resolveCurrentCity(coords.latitude, coords.longitude),
              latitude: coords.latitude,
              longitude: coords.longitude,
              locationStatus: 'located',
            });
          },
          (error) => {
            if (token !== locateToken) return;
            set({
              locationStatus:
                error.code === error.PERMISSION_DENIED ? 'denied' : 'error',
            });
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 5 * 60 * 1000,
          },
        );
      },
      setAgentContext: (context) => set(context),
  resetAgentContext: () => set({ sessionId: undefined, memoryId: undefined, draftId: undefined }),
      setAgentInput: (agentInput) => set({ agentInput }),
      setAgentMessages: (agentMessages) => set({ agentMessages }),
      appendAgentMessages: (messages) =>
        set((state) => ({ agentMessages: [...state.agentMessages, ...messages] })),
      appendAgentMessageContent: (id, content) =>
        set((state) => ({
          agentMessages: state.agentMessages.map((message) =>
            message.id === id
              ? { ...message, content: `${message.content}${content}`, status: undefined }
              : message,
          ),
        })),
      patchAgentMessage: (id, patch) =>
        set((state) => ({
          agentMessages: state.agentMessages.map((message) =>
            message.id === id ? { ...message, ...patch } : message,
          ),
        })),
      setAgentProgress: (agentProgress) => set({ agentProgress }),
      setAgentBrowserLocation: (agentBrowserLocation) => set({ agentBrowserLocation }),
      setAgentLocationState: (agentLocationState) => set({ agentLocationState }),
      setAgentLocationError: (agentLocationError) => set({ agentLocationError }),
      clearAgentConversation: () =>
        set({
          agentInput: '',
          agentMessages: defaultAgentMessages(),
          agentProgress: [],
        }),
      resetAgentSessionState: () =>
        set({
          sessionId: undefined,
          memoryId: undefined,
          draftId: undefined,
          agentInput: '',
          agentMessages: defaultAgentMessages(),
          agentProgress: [],
          agentBrowserLocation: undefined,
          agentLocationState: 'idle',
          agentLocationError: '',
        }),
    }),
    {
      name: 'movie-agent-app',
      merge: (persistedState, currentState) => {
        const persisted = (persistedState || {}) as Partial<AppState>;
        const messages = Array.isArray(persisted.agentMessages)
          ? persisted.agentMessages.filter((message) => message.id !== 'welcome')
          : currentState.agentMessages;
        return {
          ...currentState,
          ...persisted,
          agentMessages: messages,
        };
      },
      partialize: (state) => ({
        mode: state.mode,
          city: state.city,
          sessionId: state.sessionId,
          memoryId: state.memoryId,
          draftId: state.draftId,
        agentInput: state.agentInput,
        agentMessages: state.agentMessages,
        agentProgress: state.agentProgress,
        agentBrowserLocation: state.agentBrowserLocation,
        agentLocationState: state.agentLocationState === 'locating' ? 'idle' : state.agentLocationState,
        agentLocationError: state.agentLocationError,
      }),
    },
  ),
);
