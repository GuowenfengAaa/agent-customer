import { Button, Card, NavBar, Space, Stepper, Tag, TextArea, Toast } from 'antd-mobile';
import { EnvironmentOutline, MoreOutline, LeftOutline } from 'antd-mobile-icons';
import { history, useSearchParams } from '@umijs/max';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  connectAgentStream,
  type AgentCardPayload,
  type AgentSseEvent,
} from '@/services/agentSse';
import { submitAlipayForm } from '@/services/alipay';
import { customerApi } from '@/services/customerApi';
import { requestBrowserLocation, type BrowserLocation } from '@/services/location';
import { getSession, getToken } from '@/services/storage';
import { type AgentChatMessage, useAppStore } from '@/stores/useAppStore';
import type { AgentMemorySummary } from '@/types/domain';
import { getPosterThumbnailUrl } from '@/utils/poster';
import styles from './index.module.less';

const agentBaseUrl = process.env.AGENT_BASE_URL || 'http://127.0.0.1:8001';
const pendingPaymentStorageKey = 'movie-agent-pending-payment';

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cardTypeText(type?: string) {
  const map: Record<string, string> = {
    MOVIE_LIST: '影片候选',
    CINEMA_LIST: '影院候选',
    SHOWTIME_LIST: '场次候选',
    SEAT_MAP: '座位图',
    ALTERNATIVE: '替代方案',
    ORDER_CONFIRM: '订单确认',
    PAYMENT: '支付确认',
    REFUND: '退票结果',
    TICKET: '电子票',
    LOCATION_PICKER: '位置选择',
    SNACK_LIST: '零食推荐',
    COUPON_LIST: '优惠券',
  };
  return map[type || ''] || type || '卡片';
}

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'object') return '';
  return String(value);
}

function getCardPosterUrl(card: AgentCardPayload) {
  const payload = card.payload || {};
  const poster =
    card.posterUrl ||
    card.poster ||
    card.image ||
    (typeof payload.posterUrl === 'string' ? payload.posterUrl : '') ||
    (typeof payload.poster === 'string' ? payload.poster : '') ||
    (typeof payload.image === 'string' ? payload.image : '');
  return getPosterThumbnailUrl(poster);
}

function getCardImageUrl(card: AgentCardPayload) {
  const payload = card.payload || {};
  const image =
    card.image ||
    (typeof payload.image === 'string' ? payload.image : '') ||
    (typeof payload.posterUrl === 'string' ? payload.posterUrl : '') ||
    (typeof payload.poster === 'string' ? payload.poster : '');
  return getPosterThumbnailUrl(image);
}

function toPositiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSeatId(seat: Record<string, unknown>, index: number) {
  return String(
    seat.seatId ??
    seat.id ??
    `${seat.row ?? seat.rowNo ?? ''}${seat.number ?? seat.seatNo ?? index + 1}`,
  );
}

function getSeatLabel(seat: Record<string, unknown>, index: number) {
  const row = seat.row ?? seat.rowNo;
  const number = seat.number ?? seat.seatNo;
  if (row !== undefined && row !== null && number !== undefined && number !== null) {
    return /^[A-Za-z]+$/.test(String(row))
      ? `${row}${number}`
      : `${row}排${number}座`;
  }
  return getSeatId(seat, index);
}

function toAgentMessages(memory: AgentMemorySummary): AgentChatMessage[] {
  return memory.messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      id: message.id,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      cards: [],
    }));
}

function formatSessionTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace('T', ' ').slice(0, 16);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

function AgentCard({
  card,
  disabled,
  onAction,
}: {
  card: AgentCardPayload;
  disabled?: boolean;
  onAction: (event: string, label: string, payload?: Record<string, unknown>) => void;
}) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [snackQuantity, setSnackQuantity] = useState(1);
  const cardType = String(card.type || '').toUpperCase();
  const isSeatMap = cardType === 'SEAT_MAP';
  const isMovieCard = cardType === 'MOVIE_LIST' || cardType === 'MOVIE';
  const isSnackCard = cardType === 'SNACK_LIST' || cardType === 'SNACK';
  const isTicketCard = cardType === 'TICKET';
  const isOrderDetailCard = cardType === 'PAYMENT' || cardType === 'ORDER_CONFIRM';
  const posterUrl = isMovieCard ? getCardPosterUrl(card) : '';
  const snackImageUrl = isSnackCard ? getCardImageUrl(card) : '';
  const snackStock = Math.min(
    10,
    toPositiveNumber(card.payload?.availableStock ?? card.meta?.stock, 10),
  );
  const metaEntries = Object.entries(card.meta || {})
    .map(([key, value]) => [key, displayValue(value)] as const)
    .filter(([, value]) => value);

  const toggleSeat = (seatId: string) => {
    setSelectedSeatIds((current) =>
      current.includes(seatId)
        ? current.filter((item) => item !== seatId)
        : [...current, seatId],
    );
  };

  const actionPayload = (action: NonNullable<AgentCardPayload['actions']>[number]) => {
    const basePayload = action.payload || card.payload || {};
    if (isSnackCard) {
      const snackId = basePayload.snackId ?? basePayload.id ?? card.id;
      return {
        ...basePayload,
        snackId,
        quantity: snackQuantity,
        snackItems: snackId ? [{ snackId, quantity: snackQuantity }] : [],
      };
    }
    if (!isSeatMap) return Object.keys(basePayload).length ? basePayload : undefined;
    return {
      ...basePayload,
      showtimeId: card.id,
      seatIds: selectedSeatIds,
    };
  };

  return (
    <Card className={[styles.agentCard, isMovieCard ? styles.movieAgentCard : '', isSnackCard ? styles.snackAgentCard : ''].filter(Boolean).join(' ')}>
      {isMovieCard ? (
        <div className={styles.moviePosterFace}>
          {posterUrl ? (
            <img src={posterUrl} alt={card.title || '电影海报'} />
          ) : (
            <div className={styles.moviePosterFallback}>
              <strong>{String(card.title || '影').slice(0, 2)}</strong>
              <span>电影</span>
            </div>
          )}
        </div>
      ) : null}
      {isSnackCard ? (
        <div className={styles.snackCover}>
          {snackImageUrl ? (
            <img src={snackImageUrl} alt={card.title || '零食'} />
          ) : (
            <span>{String(card.title || '零').slice(0, 1)}</span>
          )}
        </div>
      ) : null}
      <div className={isMovieCard || isSnackCard ? styles.movieCardContent : undefined}>
        <div className={styles.cardHeader}>
          <strong>{card.title || card.id || '候选项'}</strong>
          <Tag color="primary">{cardTypeText(String(card.type || ''))}</Tag>
        </div>
        {card.subtitle ? <p className={styles.cardSubtitle}>{card.subtitle}</p> : null}
        {metaEntries.length ? (
          <div className={isOrderDetailCard ? styles.detailList : styles.metaList}>
            {metaEntries.map(([key, value]) => (
              <span key={key}>
                <b>{key}</b>
                <em>{value}</em>
              </span>
            ))}
          </div>
        ) : null}
        {card.seats?.length ? (
          <div className={styles.seatPreview}>
            {card.seats.slice(0, 48).map((seat, index) => {
              const seatId = getSeatId(seat, index);
              const seatLabel = getSeatLabel(seat, index);
              const status = String(seat.status || '').toLowerCase();
              const unavailable = ['locked', 'sold', 'unavailable'].includes(status);
              const selected = selectedSeatIds.includes(seatId);
              return (
                <button
                  key={seatId}
                  type="button"
                  className={[
                    styles.seatButton,
                    selected ? styles.seatSelected : '',
                    unavailable ? styles.seatUnavailable : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={disabled || unavailable}
                  onClick={() => toggleSeat(seatId)}
                >
                  {seatLabel}
                </button>
              );
            })}
          </div>
        ) : null}
        {isSnackCard ? (
          <div className={styles.snackQuantityRow}>
            <span>数量</span>
            <Stepper
              min={1}
              max={snackStock}
              value={snackQuantity}
              disabled={disabled}
              onChange={(value) => setSnackQuantity(Number(value) || 1)}
            />
          </div>
        ) : null}
        {card.actions?.length ? (
          <Space wrap className={styles.cardActions}>
            {card.actions.map((action) => (
              <Button
                key={`${card.id}-${action.event}`}
                size="mini"
                color="primary"
                disabled={
                  (disabled && !(isTicketCard && action.event === 'view_ticket')) ||
                  (isSeatMap &&
                    action.event === 'select_seats' &&
                    selectedSeatIds.length === 0)
                }
                onClick={() => onAction(action.event, action.label, actionPayload(action))}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        ) : null}
      </div>
    </Card>
  );
}

function savePendingPayment(value: Record<string, unknown>) {
  sessionStorage.setItem(pendingPaymentStorageKey, JSON.stringify(value));
}

function readPendingPayment(): Record<string, unknown> | undefined {
  try {
    const raw = sessionStorage.getItem(pendingPaymentStorageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function clearPendingPayment() {
  sessionStorage.removeItem(pendingPaymentStorageKey);
}

function ticketPathFromPayload(card: AgentCardPayload, payload?: Record<string, unknown>) {
  const source = {
    ...(card.payload || {}),
    ...(payload || {}),
  };
  const path = typeof source.path === 'string' ? source.path : '';
  if (path) return path;
  const orderId = source.orderId ?? source.orderNo ?? card.id;
  return orderId && String(orderId) !== 'ticket' ? `/orders/${orderId}/tickets` : '';
}

const Agent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    setMode,
    city,
    locationStatus,
    locateCurrentPosition,
    setAgentContext,
    memoryId,
    sessionId,
    draftId,
    agentInput,
    setAgentInput,
    agentMessages,
    setAgentMessages,
    appendAgentMessages,
    appendAgentMessageContent,
    patchAgentMessage,
    agentProgress,
    setAgentProgress,
    agentBrowserLocation,
    setAgentBrowserLocation,
    agentLocationState,
    setAgentLocationState,
    agentLocationError,
    setAgentLocationError,
    clearAgentConversation,
  } = useAppStore();
  const [running, setRunning] = useState(false);
  const [resolvedDraftId, setResolvedDraftId] = useState<string>();
  const [historyReady, setHistoryReady] = useState(false);
  const [sessionListVisible, setSessionListVisible] = useState(false);
  const [sessionListLoading, setSessionListLoading] = useState(false);
  const [sessionList, setSessionList] = useState<AgentMemorySummary[]>([]);
  const [newConversationSaving, setNewConversationSaving] = useState(false);
  const streamRef = useRef<{ close: () => void } | null>(null);
  const paymentRedirectingRef = useRef(false);
  const paymentReturnCheckingRef = useRef(false);
  const greetingRequestedRef = useRef(false);
  const locationRequestRef = useRef<Promise<BrowserLocation> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const generatedSessionIdRef = useRef(sessionId || createId());

  const activeSessionId = sessionId || generatedSessionIdRef.current;
  const queryDraftId = searchParams.get('draftId') || undefined;
  const activeDraftId = useMemo(
    () => draftId || queryDraftId || resolvedDraftId,
    [draftId, queryDraftId, resolvedDraftId],
  );

  useEffect(() => {
    if (draftId || queryDraftId) return undefined;

    let cancelled = false;
    void customerApi
      .getCurrentDraft()
      .then((currentDraft) => {
        if (!cancelled && currentDraft?.id) setResolvedDraftId(currentDraft.id);
      })
      .catch(() => {
        // The Agent can start a new session when the Java backend has no draft yet.
      });

    return () => {
      cancelled = true;
    };
  }, [draftId, queryDraftId]);

  useEffect(() => {
    setMode('AI');
    setAgentContext({ sessionId: activeSessionId, draftId: activeDraftId });
  }, [activeDraftId, activeSessionId, setAgentContext, setMode]);

  useEffect(() => {
    let cancelled = false;
    if (agentMessages.length) {
      setHistoryReady(true);
      return () => {
        cancelled = true;
      };
    }

    const token = getToken();
    if (!token) {
      setHistoryReady(true);
      return () => {
        cancelled = true;
      };
    }

    setHistoryReady(false);
    void customerApi
      .getAgentMemory(activeSessionId, memoryId)
      .then((memory) => {
        if (cancelled || !memory) return;
        if (memory.memoryId) {
          setAgentContext({
            sessionId: memory.sessionId || memory.memoryId,
            memoryId: memory.memoryId,
          });
        }
        const restoredMessages = toAgentMessages(memory);
        if (restoredMessages.length && !cancelled) {
          setAgentMessages(restoredMessages);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHistoryReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSessionId, agentMessages.length, memoryId, setAgentContext, setAgentMessages]);

  useEffect(() => {
    return () => {
      streamRef.current?.close();
    };
  }, []);

  function locate() {
    if (locationRequestRef.current) return locationRequestRef.current;

    setAgentLocationState('locating');
    setAgentLocationError('');
    const request = requestBrowserLocation()
      .then((location) => {
        setAgentBrowserLocation(location);
        setAgentLocationState('ready');
        return location;
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : '定位失败，请稍后重试';
        setAgentLocationState('error');
        setAgentLocationError(message);
        throw error;
      })
      .finally(() => {
        locationRequestRef.current = null;
      });
    locationRequestRef.current = request;
    return request;
  }

  useEffect(() => {
    void locate().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (readPendingPayment()) return;
    if (!historyReady || agentMessages.length || greetingRequestedRef.current) return;
    loadGreeting();
  }, [activeSessionId, agentMessages.length, historyReady]);

  function patchAssistant(id: string, patch: Partial<AgentChatMessage>) {
    patchAgentMessage(id, patch);
  }

  function handleEvent(event: AgentSseEvent, assistantId: string, cardsRef: AgentCardPayload[]) {
    if (event.event === 'thinking') {
      patchAssistant(assistantId, { status: event.data.message });
      return;
    }
    if (event.event === 'message') {
      if (event.data.delta) {
        appendAgentMessageContent(assistantId, event.data.content);
        return;
      }
      patchAssistant(assistantId, { content: event.data.content, status: undefined });
      return;
    }
    if (event.event === 'card') {
      cardsRef.push(event.data.data);
      patchAssistant(assistantId, { cards: [...cardsRef] });
      return;
    }
    if (event.event === 'progress') {
      setAgentProgress(event.data.completed || []);
      return;
    }
    if (event.event === 'error') {
      patchAssistant(assistantId, {
        content: event.data.message || 'Agent 处理失败，请稍后重试。',
        status: undefined,
      });
      setRunning(false);
      return;
    }
    if (event.event === 'done') {
      if (event.data.memoryId) {
        setAgentContext({
          sessionId: event.data.memoryId,
          memoryId: event.data.memoryId,
        });
      }
      setRunning(false);
      void syncCurrentConversation(event.data.memoryId).catch(() => undefined);
    }
  }

  function loadGreeting() {
    if (greetingRequestedRef.current || agentMessages.length) return;

    const assistantId = createId();
    const cardsRef: AgentCardPayload[] = [];
    const session = getSession();
    const token = getToken();
    greetingRequestedRef.current = true;
    appendAgentMessages([
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        status: '正在生成问候语...',
        cards: [],
      },
    ]);
    setRunning(true);
    setAgentProgress([]);
    setMode('AI');
    setAgentContext({ sessionId: activeSessionId, draftId: activeDraftId });

    streamRef.current?.close();
    streamRef.current = connectAgentStream({
      url: `${agentBaseUrl.replace(/\/$/, '')}/api/agent/chat/stream`,
      sessionId: activeSessionId,
      memoryId,
      message: '你好',
      jwt: token || undefined,
      userId: session?.userId,
      mode: 'AI',
      onEvent: (agentEvent) => handleEvent(agentEvent, assistantId, cardsRef),
      onError: (error) => {
        patchAssistant(assistantId, {
          content: error instanceof Error ? error.message : 'Agent 连接失败，请确认 Agent 服务已启动。',
          status: undefined,
        });
        setRunning(false);
      },
    });
  }

  async function send(text?: string, event?: string, payload?: Record<string, unknown>) {
    const content = (text ?? agentInput).trim();
    if (!content || running) return;

    const locationRequest =
      event === 'search_nearby_cinemas' ||
      event === 'get_current_location' ||
      /附近|周边|最近|离我近|当前位置|具体位置|地理位置|我在哪|我在哪里|我在哪儿|现在在哪|现在在哪里|现在在哪儿|这里在哪|这里是哪里|这儿在哪|这是哪里|定位|经纬度|nearby|around me/i.test(
        content,
      );
    let currentLocation = agentBrowserLocation;
    if (locationRequest && !payload?.location) {
      try {
        currentLocation = currentLocation || await locate();
      } catch (error) {
        Toast.show({
          content: error instanceof Error ? error.message : '请允许浏览器定位后再查询附近影院',
        });
        return;
      }
    }

    const requestPayload = {
      ...(payload || {}),
      ...(currentLocation && !payload?.location ? { location: currentLocation } : {}),
    };

    const assistantId = createId();
    const cardsRef: AgentCardPayload[] = [];
    const session = getSession();
    const token = getToken();

    appendAgentMessages([
      { id: createId(), role: 'user', content },
      { id: assistantId, role: 'assistant', content: '', status: '正在连接 Agent...', cards: [] },
    ]);
    setAgentInput('');
    setRunning(true);
    setAgentProgress([]);
    setMode('AI');
    setAgentContext({ sessionId: activeSessionId, draftId: activeDraftId });

    streamRef.current?.close();
    streamRef.current = connectAgentStream({
      url: `${agentBaseUrl.replace(/\/$/, '')}/api/agent/chat/stream`,
      sessionId: activeSessionId,
      memoryId,
      draftId: activeDraftId,
      message: content,
      event,
      jwt: token || undefined,
      userId: session?.userId,
      mode: 'AI',
      payload: Object.keys(requestPayload).length ? requestPayload : undefined,
      onEvent: (agentEvent) => handleEvent(agentEvent, assistantId, cardsRef),
      onError: (error) => {
        patchAssistant(assistantId, {
          content: error instanceof Error ? error.message : 'Agent 连接失败，请确认 Agent 服务已启动。',
          status: undefined,
        });
        setRunning(false);
      },
    });
  }

  async function startAlipayPayment(card: AgentCardPayload, payload?: Record<string, unknown>) {
    if (paymentRedirectingRef.current) return;
    const paymentPayload = {
      ...(card.payload || {}),
      ...(payload || {}),
    };
    const orderId = paymentPayload.orderId ?? paymentPayload.orderNo ?? card.id;
    if (!orderId || String(orderId) === 'payment') {
      Toast.show({ content: '订单编号缺失，暂时无法发起支付' });
      return;
    }

    paymentRedirectingRef.current = true;
    savePendingPayment({
      orderId: String(orderId),
      sessionId: activeSessionId,
      memoryId,
      draftId: activeDraftId,
      createTime: Date.now(),
    });
    try {
      const result = await customerApi.payOrder(String(orderId), `agent-${createId()}`);
      if (result.paymentStatus === 'SUCCESS') {
        clearPendingPayment();
        Toast.show({ content: '支付成功，正在同步电子票' });
        void send('支付完成，查看订单状态', 'get_order', { orderId: String(orderId) });
        return;
      }
      if (!result.payForm) throw new Error('支付宝沙箱支付表单为空，请稍后重试');
      submitAlipayForm(result.payForm);
    } catch (error) {
      clearPendingPayment();
      Toast.show({ content: error instanceof Error ? error.message : '支付失败，请稍后重试' });
    } finally {
      paymentRedirectingRef.current = false;
    }
  }

  async function checkPendingPaymentReturn() {
    if (running || paymentReturnCheckingRef.current) return;
    const pending = readPendingPayment();
    const orderId = pending?.orderId;
    if (!orderId) return;

    paymentReturnCheckingRef.current = true;
    try {
      const order = await customerApi.getOrder(String(orderId));
      const status = String(order.status || order.payment?.status || '').toUpperCase();
      const paid = ['TICKETED', 'PAID', 'SUCCESS'].includes(status) || Boolean(order.tickets?.length);
      if (!paid) return;
      clearPendingPayment();
      Toast.show({ content: '支付成功，正在同步电子票' });
      void send('支付完成，查看订单状态', 'get_order', { orderId: String(orderId) });
    } catch {
      // Keep the pending marker; the next focus/visibility event will retry.
    } finally {
      paymentReturnCheckingRef.current = false;
    }
  }

  useEffect(() => {
    if (!historyReady) return undefined;
    void checkPendingPaymentReturn();

    const handleFocus = () => {
      void checkPendingPaymentReturn();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkPendingPaymentReturn();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [historyReady, running]);

  async function syncCurrentConversation(nextMemoryId?: string) {
    const token = getToken();
    const currentStore = useAppStore.getState();
    const currentSessionId = currentStore.sessionId || activeSessionId;
    const currentMemoryId = nextMemoryId || currentStore.memoryId || memoryId;
    const finishedMessages = currentStore.agentMessages
      .filter((message) => message.content.trim())
      .map((message) => ({
        role: message.role,
        content: message.content,
        cardsJson: message.cards?.length ? JSON.stringify(message.cards) : undefined,
      }));

    if (!token || finishedMessages.length === 0) {
      return;
    }

    const session = getSession();
    const saved = await customerApi.syncAgentMemory({
      sessionId: currentSessionId,
      memoryId: currentMemoryId,
      stateJson: JSON.stringify({
        session_id: currentSessionId,
        memory_id: currentMemoryId,
        user_id: session?.userId,
        state: 'archived',
        slots: {},
        selected: {},
      }),
      messages: finishedMessages,
    });
    if (saved?.memoryId) {
      setAgentContext({
        sessionId: saved.sessionId || saved.memoryId,
        memoryId: saved.memoryId,
        draftId: activeDraftId,
      });
    }
  }

  async function startNewConversation() {
    if (running || newConversationSaving) {
      Toast.show({ content: '当前会话还在处理，请稍后再新建' });
      return;
    }

    setNewConversationSaving(true);
    try {
      await syncCurrentConversation();
    } catch (error) {
      Toast.show({
        content: error instanceof Error ? error.message : '旧会话保存失败，未开始新会话',
      });
      setNewConversationSaving(false);
      return;
    }

    const newSessionId = createId();
    streamRef.current?.close();
    generatedSessionIdRef.current = newSessionId;
    greetingRequestedRef.current = false;
    setHistoryReady(true);
    setRunning(false);
    clearAgentConversation();
    setAgentContext({
      sessionId: newSessionId,
      memoryId: undefined,
      draftId: activeDraftId,
    });
    setNewConversationSaving(false);
    Toast.show({ content: '已开始新会话' });
  }

  async function openSessionList() {
    const token = getToken();
    if (!token) {
      Toast.show({ content: '登录后才会保存和查看历史会话' });
      return;
    }
    setSessionListVisible(true);
    setSessionListLoading(true);
    try {
      const list = await customerApi.listAgentMemories(30);
      setSessionList(list);
    } catch (error) {
      Toast.show({
        content: error instanceof Error ? error.message : '加载会话列表失败',
      });
    } finally {
      setSessionListLoading(false);
    }
  }

  async function restoreConversation(item: AgentMemorySummary) {
    const memoryIdToLoad = item.memoryId || item.sessionId;
    if (!memoryIdToLoad) return;
    setSessionListLoading(true);
    try {
      const memory = await customerApi.getAgentMemory(memoryIdToLoad, memoryIdToLoad);
      if (!memory) {
        Toast.show({ content: '这个会话没有可恢复的消息' });
        return;
      }
      const restoredMessages = toAgentMessages(memory);
      streamRef.current?.close();
      generatedSessionIdRef.current = memory.sessionId || memory.memoryId;
      greetingRequestedRef.current = true;
      setRunning(false);
      setHistoryReady(true);
      setAgentMessages(restoredMessages);
      setAgentProgress([]);
      setAgentContext({
        sessionId: memory.sessionId || memory.memoryId,
        memoryId: memory.memoryId,
        draftId: activeDraftId,
      });
      setSessionListVisible(false);
      Toast.show({ content: '已恢复历史会话' });
    } catch (error) {
      Toast.show({
        content: error instanceof Error ? error.message : '恢复会话失败',
      });
    } finally {
      setSessionListLoading(false);
    }
  }

  const locationLabel = agentLocationState === 'locating'
    ? '正在获取当前位置'
    : agentLocationState === 'ready'
      ? `已定位 · ${agentBrowserLocation?.latitude.toFixed(4)}, ${agentBrowserLocation?.longitude.toFixed(4)}`
      : agentLocationError || '未获取当前位置';
  const locationDisplayLabel = agentLocationState === 'ready' ? `已定位 · ${city}` : locationLabel;
  const latestActionMessageId = useMemo(
    () =>
      [...agentMessages]
        .reverse()
        .find((item) =>
          item.role === 'assistant' &&
          item.cards?.some((card) => card.actions?.length),
        )?.id,
    [agentMessages],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [agentMessages.length, running]);

  return (
    <div className={styles.page}>
      <div className={styles.agentTopBar}>
        <button className={styles.agentCity} type="button" onClick={locateCurrentPosition}>
          <span>{locationStatus === 'locating' ? '定位中' : city}</span>
          <span className={styles.agentCityChevron}>⌄</span>
        </button>
        <strong className={styles.agentTitle}>AI 智能购票</strong>
        <Space align="center" className={styles.navActions}>
          <Button fill="none" size="mini" loading={newConversationSaving} onClick={startNewConversation}>
            新会话
          </Button>
          <Button fill="none" size="mini" className={styles.historyButton} onClick={openSessionList}>
            历史对话
          </Button>
        </Space>
      </div>
      <NavBar className={styles.legacyNavBar}
        onBack={() => history.push('/home')}
        right={
          <Space align="center" className={styles.navActions}>
            <Button
              fill="none"
              size="mini"
              loading={newConversationSaving}
              onClick={startNewConversation}
            >
              新会话
            </Button>
            <Button
              fill="none"
              size="mini"
              className={styles.moreButton}
              onClick={openSessionList}
            >
              <MoreOutline />
            </Button>
          </Space>
        }
      >
        AI 智能购票
      </NavBar>
      {sessionListVisible ? (
        <div className={styles.sessionMenu}>
          <div className={styles.sessionPanelHeader}>
            <div>
              <strong>历史会话</strong>
              <span>继续之前的购票对话</span>
            </div>
            <Button fill="none" size="mini" onClick={() => setSessionListVisible(false)}>
              关闭
            </Button>
          </div>
          <div className={styles.sessionList}>
            {sessionListLoading ? (
              <div className={styles.sessionEmpty}>正在加载会话...</div>
            ) : sessionList.length ? (
              sessionList.map((item) => {
                const active = item.memoryId && item.memoryId === memoryId;
                return (
                  <button
                    key={item.memoryId || item.sessionId}
                    type="button"
                    className={[
                      styles.sessionItem,
                      active ? styles.sessionItemActive : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => restoreConversation(item)}
                  >
                    <span className={styles.sessionTitle}>
                      {item.title || item.previewMessage || '新会话'}
                    </span>
                    <span className={styles.sessionPreview}>
                      {item.previewMessage || '暂无消息'}
                    </span>
                    <span className={styles.sessionMeta}>
                      {formatSessionTime(item.lastMessageTime || item.updateTime)}
                      {item.messageCount ? ` · ${item.messageCount} 条` : ''}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className={styles.sessionEmpty}>暂无历史会话</div>
            )}
          </div>
        </div>
      ) : null}
      <button className={styles.heroBack} type="button" aria-label="返回首页" onClick={() => history.push('/home')}>
        <LeftOutline />
      </button>
      <div className={styles.hero}>
        <div className={styles.avatar}>✦</div>
        <div>
          <div className={styles.kicker}>MOVIE AGENT</div>
          <h1>告诉我你的观影计划</h1>
          <p>我会帮你查找影片、影院、场次、选座并生成电子票。</p>
        </div>
      </div>
      <div className={styles.locationBar}>
        <div className={styles.locationStatus}>
          <EnvironmentOutline />
          <span>{locationDisplayLabel}</span>
        </div>
        <Button
          fill="none"
          size="mini"
          loading={agentLocationState === 'locating'}
          onClick={() => void locate().catch(() => undefined)}
        >
          重新定位
        </Button>
      </div>
      <div className={styles.progress}>
        {['nlu', 'planner', 'tool', 'apply_result'].map((step, index) => (
          <React.Fragment key={step}>
            <span className={agentProgress.includes(step) ? styles.done : ''}>
              {['理解', '规划', '查询', '整理'][index]}
            </span>
            {index < 3 ? <i /> : null}
          </React.Fragment>
        ))}
      </div>
      <div className={styles.messages}>
        {agentMessages.map((item) => (
          <div
            key={item.id}
            className={item.role === 'user' ? styles.userBlock : styles.agentBlock}
          >
            <Card className={item.role === 'user' ? styles.userMessage : styles.agentMessage}>
              {item.status ? <span className={styles.statusText}>{item.status}</span> : item.content}
            </Card>
            {item.cards?.length ? (
              <div
                className={[
                  styles.cards,
                  latestActionMessageId !== item.id ? styles.expiredCards : '',
                ].filter(Boolean).join(' ')}
              >
                {latestActionMessageId !== item.id ? (
                  <span className={styles.expiredHint}>历史结果，仅供查看</span>
                ) : null}
                {item.cards.map((card, index) => (
                  <AgentCard
                    key={`${card.type}-${card.id}-${index}`}
                    card={card}
                    disabled={
                      running ||
                      (
                        latestActionMessageId !== item.id &&
                        String(card.type || '').toUpperCase() !== 'TICKET'
                      )
                    }
                    onAction={(nextEvent, label, nextPayload) => {
                      if (nextEvent === 'view_ticket' || nextEvent === 'navigate_ticket') {
                        const ticketPath = ticketPathFromPayload(card, nextPayload);
                        if (!ticketPath) {
                          Toast.show({ content: '订单编号缺失，暂时无法查看电子票' });
                          return;
                        }
                        history.push(ticketPath);
                        return;
                      }
                      if (nextEvent === 'pay_order' && String(card.type || '').toUpperCase() === 'PAYMENT') {
                        void startAlipayPayment(card, nextPayload);
                        return;
                      }
                      void send(label, nextEvent, nextPayload);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ))}
        <Tag color={running ? 'primary' : 'warning'}>
          {running ? 'Agent 正在处理' : '当前为 AI 模式'}
        </Tag>
        <div ref={bottomRef} />
      </div>
      <div className={styles.quickActions}>
        {['今晚两张科幻电影', '附近有什么影院', '帮我选个 IMAX 场次'].map((text) => (
          <Button key={text} size="mini" disabled={running} onClick={() => send(text)}>
            {text}
          </Button>
        ))}
      </div>
      <div className={styles.composer}>
        <TextArea
          value={agentInput}
          onChange={setAgentInput}
          placeholder="描述你的观影需求"
          autoSize={{ minRows: 2, maxRows: 5 }}
          disabled={running}
        />
        <Space justify="between" block align="center">
          <span className={styles.tip} aria-hidden="true" />
          <Button color="primary" size="small" disabled={running || !agentInput.trim()} onClick={() => send()}>
            发送
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Agent;
