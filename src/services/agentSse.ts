import type { PurchaseMode } from '@/types/domain';

export type AgentCardType =
  | 'MOVIE_LIST'
  | 'CINEMA_LIST'
  | 'SHOWTIME_LIST'
  | 'SEAT_MAP'
  | 'ALTERNATIVE'
  | 'ORDER_CONFIRM'
  | 'PAYMENT'
  | 'TICKET'
  | 'LOCATION_PICKER';

export type AgentSseEvent =
  | { event: 'thinking'; data: { traceId: string; status: string; message: string } }
  | { event: 'message'; data: { traceId: string; type: 'text'; content: string } }
  | { event: 'card'; data: { traceId: string; type: AgentCardType; data: unknown } }
  | { event: 'progress'; data: { traceId: string; step: string; completed: string[] } }
  | { event: 'error'; data: { code?: number; message: string; traceId?: string } }
  | { event: 'done'; data: { traceId: string; state: string } };

export interface AgentStreamOptions {
  url: string;
  sessionId?: string;
  draftId?: string;
  mode?: PurchaseMode;
  onEvent: (event: AgentSseEvent) => void;
  onError?: (error: Event) => void;
}

const eventNames: AgentSseEvent['event'][] = ['thinking', 'message', 'card', 'progress', 'error', 'done'];

export function connectAgentStream(options: AgentStreamOptions) {
  const source = new EventSource(options.url, { withCredentials: true });

  eventNames.forEach((eventName) => {
    source.addEventListener(eventName, (event) => {
      try {
        const data = JSON.parse((event as MessageEvent<string>).data);
        options.onEvent({ event: eventName, data } as AgentSseEvent);
      } catch {
        options.onError?.(event);
      }
    });
  });

  source.onerror = (error) => options.onError?.(error);
  return source;
}
