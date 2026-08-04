import { Button, Card, NavBar, Space, Tag, TextArea, Toast } from 'antd-mobile';
import { EnvironmentOutline } from 'antd-mobile-icons';
import { history, useSearchParams } from '@umijs/max';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  connectAgentStream,
  type AgentCardPayload,
  type AgentSseEvent,
} from '@/services/agentSse';
import { customerApi } from '@/services/customerApi';
import { requestBrowserLocation, type BrowserLocation } from '@/services/location';
import { getSession, getToken } from '@/services/storage';
import { type AgentChatMessage, useAppStore } from '@/stores/useAppStore';
import styles from './index.module.less';

const agentBaseUrl = process.env.AGENT_BASE_URL || 'http://127.0.0.1:8001';

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
    PAYMENT: '模拟支付',
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
  const isSeatMap = String(card.type || '').toUpperCase() === 'SEAT_MAP';
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
    if (!isSeatMap) return Object.keys(basePayload).length ? basePayload : undefined;
    return {
      ...basePayload,
      showtimeId: card.id,
      seatIds: selectedSeatIds,
    };
  };

  return (
    <Card className={styles.agentCard}>
      <div className={styles.cardHeader}>
        <strong>{card.title || card.id || '候选项'}</strong>
        <Tag color="primary">{cardTypeText(String(card.type || ''))}</Tag>
      </div>
      {card.subtitle ? <p className={styles.cardSubtitle}>{card.subtitle}</p> : null}
      {metaEntries.length ? (
        <div className={styles.metaList}>
          {metaEntries.map(([key, value]) => (
            <span key={key}>{key}: {value}</span>
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
      {card.actions?.length ? (
        <Space wrap className={styles.cardActions}>
          {card.actions.map((action) => (
            <Button
              key={`${card.id}-${action.event}`}
              size="mini"
              color="primary"
              disabled={
                disabled ||
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
    </Card>
  );
}

const Agent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const {
    setMode,
    setAgentContext,
    sessionId,
    draftId,
    agentInput,
    setAgentInput,
    agentMessages,
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
  const streamRef = useRef<{ close: () => void } | null>(null);
  const greetingRequestedRef = useRef(false);
  const locationRequestRef = useRef<Promise<BrowserLocation> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const generatedSessionIdRef = useRef(sessionId || `h5-${createId()}`);

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
    if (agentMessages.length || greetingRequestedRef.current) return;
    loadGreeting();
  }, [activeSessionId, agentMessages.length]);

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
      setRunning(false);
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

    const nearbyRequest = event === 'search_nearby_cinemas' || /附近|周边|最近|离我近|nearby|around me/i.test(content);
    let currentLocation = agentBrowserLocation;
    if (nearbyRequest && !payload?.location) {
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

  function startNewConversation() {
    const newSessionId = `h5-${createId()}`;
    streamRef.current?.close();
    generatedSessionIdRef.current = newSessionId;
    greetingRequestedRef.current = false;
    setRunning(false);
    clearAgentConversation();
    setAgentContext({ sessionId: newSessionId, draftId: activeDraftId });
    Toast.show({ content: '已开始新会话' });
  }

  const locationLabel = agentLocationState === 'locating'
    ? '正在获取当前位置'
    : agentLocationState === 'ready'
      ? `已定位 · ${agentBrowserLocation?.latitude.toFixed(4)}, ${agentBrowserLocation?.longitude.toFixed(4)}`
      : agentLocationError || '未获取当前位置';
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
      <NavBar
        onBack={() => history.push('/home')}
        right={
          <Button fill="none" size="mini" onClick={startNewConversation}>
            新会话
          </Button>
        }
      >
        AI 智能购票
      </NavBar>
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
          <span>{locationLabel}</span>
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
                    disabled={running || latestActionMessageId !== item.id}
                    onAction={(nextEvent, label, nextPayload) => send(label, nextEvent, nextPayload)}
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
          <span className={styles.tip}>接入：POST /api/agent/chat/stream</span>
          <Button color="primary" size="small" disabled={running || !agentInput.trim()} onClick={() => send()}>
            发送
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default Agent;
