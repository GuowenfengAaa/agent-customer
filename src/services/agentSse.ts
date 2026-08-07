import type { PurchaseMode } from '@/types/domain';

export type AgentCardType =
  | 'MOVIE_LIST'
  | 'CINEMA_LIST'
  | 'SHOWTIME_LIST'
  | 'SEAT_MAP'
  | 'ALTERNATIVE'
  | 'ORDER_CONFIRM'
  | 'PAYMENT'
  | 'REFUND'
  | 'TICKET'
  | 'LOCATION_PICKER'
  | 'SNACK_LIST'
  | 'COUPON_LIST';

export type AgentSseEvent =
  | { event: 'thinking'; data: { traceId: string; status: string; message: string } }
  | {
      event: 'message';
      data: { traceId: string; type: 'text'; content: string; delta?: boolean };
    }
  | { event: 'card'; data: { traceId: string; type: AgentCardType; data: AgentCardPayload } }
  | { event: 'progress'; data: { traceId: string; step: string; completed: string[] } }
  | { event: 'error'; data: { code?: number; message: string; traceId?: string; detail?: string } }
  | { event: 'done'; data: { traceId: string; state: string; memoryId?: string } };

export interface AgentCardPayload {
  type?: AgentCardType | string;
  id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  poster?: string;
  posterUrl?: string;
  meta?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  qrCode?: string;
  seats?: Array<Record<string, unknown>>;
  actions?: Array<{
    event: string;
    label: string;
    payload?: Record<string, unknown>;
  }>;
}

export interface AgentStreamOptions {
  url: string;
  sessionId: string;
  memoryId?: string;
  draftId?: string | number;
  message: string;
  event?: string;
  userId?: string;
  jwt?: string;
  payload?: Record<string, unknown>;
  mode?: PurchaseMode;
  onEvent: (event: AgentSseEvent) => void;
  onError?: (error: unknown) => void;
}

const eventNames: AgentSseEvent['event'][] = ['thinking', 'message', 'card', 'progress', 'error', 'done'];

function parseDraftId(value?: string | number) {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseSseBlocks(buffer: string) {
  const blocks = buffer.replace(/\r\n/g, '\n').split('\n\n');
  const rest = blocks.pop() || '';
  const events = blocks
    .map((block) => {
      const event = block
        .split('\n')
        .find((line) => line.startsWith('event:'))
        ?.replace('event:', '')
        .trim() as AgentSseEvent['event'] | undefined;
      const data = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s?/, ''))
        .join('\n');
      return { event, data };
    })
    .filter((item) => item.event && eventNames.includes(item.event) && item.data);
  return { events, rest };
}

export function connectAgentStream(options: AgentStreamOptions) {
  const controller = new AbortController();
  const draftId = parseDraftId(options.draftId);

  void (async () => {
    try {
      const response = await fetch(options.url, {
        method: 'POST',
        credentials: 'omit',
        signal: controller.signal,
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
          ...(options.jwt ? { Authorization: `Bearer ${options.jwt}` } : {}),
        },
        body: JSON.stringify({
          sessionId: options.sessionId,
          memoryId: options.memoryId,
          draftId,
          message: options.message,
          event: options.event,
          jwt: options.jwt,
          userId: options.userId,
          payload: options.payload,
          mode: options.mode,
        }),
      });

      if (!response.ok) {
        let detail = '';
        try {
          detail = (await response.text()).slice(0, 240);
        } catch {
          // Keep the HTTP status as the useful error when the body cannot be read.
        }
        throw new Error(
          `Agent stream request failed: ${response.status}${detail ? ` ${detail}` : ''}`,
        );
      }
      if (!response.body) {
        throw new Error('Agent stream response has no readable body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseBlocks(buffer);
        buffer = parsed.rest;

        parsed.events.forEach(({ event, data }) => {
          if (!event) return;
          try {
            options.onEvent({ event, data: JSON.parse(data) } as AgentSseEvent);
          } catch (error) {
            options.onError?.(error);
          }
        });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        options.onError?.(error);
      }
    }
  })();

  return {
    close() {
      controller.abort();
    },
  };
}
