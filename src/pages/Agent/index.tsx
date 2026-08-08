import { Button, Card, NavBar, Space, Stepper, Tag, TextArea, Toast } from 'antd-mobile';
import { EnvironmentOutline, MoreOutline, LeftOutline, RightOutline } from 'antd-mobile-icons';
import { QRCodeSVG } from 'qrcode.react';
import dayjs from 'dayjs';
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
import type { AgentMemorySummary, OrderDetail } from '@/types/domain';
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

function getFirstValue(record: Record<string, unknown> | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function formatCurrency(value: unknown) {
  const text = displayValue(value);
  if (!text) return '';
  if (text.includes('元') || text.includes('¥')) return text;
  const amount = Number(text);
  return Number.isFinite(amount) ? `¥${amount.toFixed(2)}` : text;
}

function formatAgentContent(content: string) {
  return content.replace(/\r\n/g, '\n').replace(/\n[ \t]*\n+/g, '\n').trim();
}

function displayMetaLabel(key: string) {
  const labels: Record<string, string> = {
    distance: '距离',
    address: '地址',
    district: '区域',
    minprice: '最低票价',
    location: '经纬度',
  };
  return labels[key.toLowerCase()] || key;
}

function displayMetaValue(key: string, value: unknown) {
  const text = displayValue(value);
  if (key.toLowerCase() !== 'distance') return text;

  const distance = Number(text);
  return Number.isFinite(distance) ? `${distance.toFixed(1)} 公里` : text;
}

function displayCinemaMetaValue(key: string, value: unknown) {
  if (key.toLowerCase() === 'minprice') {
    const price = Number(value);
    return Number.isFinite(price) ? `${price.toFixed(2)} 元起` : displayValue(value);
  }
  return displayMetaValue(key, value);
}

function getServiceTags(card: AgentCardPayload) {
  const payload = card.payload || {};
  const nestedCinema = payload.cinema;
  const nestedCinemaInfo = payload.cinemaInfo;
  const source =
    card.meta?.services ??
    card.meta?.serviceTags ??
    payload.services ??
    payload.serviceTags ??
    (nestedCinema && typeof nestedCinema === 'object'
      ? (nestedCinema as Record<string, unknown>).services
      : undefined) ??
    (nestedCinemaInfo && typeof nestedCinemaInfo === 'object'
      ? (nestedCinemaInfo as Record<string, unknown>).services
      : undefined);
  if (Array.isArray(source)) {
    return source.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof source !== 'string' || !source.trim()) return [];

  const text = source.trim();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // 非 JSON 字符串按逗号分隔处理
  }
  return text.split(/[,，、|]/).map((item) => item.trim()).filter(Boolean);
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

function AgentTicketInline({ order }: { order: OrderDetail }) {
  const title = order.movie?.name || order.movieName || '电影信息';
  const cinema = order.cinema?.name || order.cinemaName || '影院信息';
  const hall = order.hallName || '影厅信息';
  const showtime = order.startAt
    ? `${dayjs(order.startAt).format('MM月DD日 HH:mm')}${order.endAt ? ` - ${dayjs(order.endAt).format('HH:mm')}` : ''}`
    : '场次时间待更新';
  const tickets = order.tickets || [];
  const seats = tickets.length
    ? tickets.map((ticket) => ticket.rowNo !== undefined ? `${ticket.rowNo}排${ticket.seatNo}座` : '座位').join('、')
    : '座位信息待更新';

  return (
    <div className={styles.agentTicketInline}>
      <div className={styles.agentTicketStatus}>
        <strong>已出票</strong>
        <span>电子票</span>
      </div>
      <div className={styles.agentTicketMovie}>
        <div className={styles.agentTicketPoster}>
          {order.movie?.posterUrl ? <img src={getPosterThumbnailUrl(order.movie.posterUrl)} alt={`${title}海报`} /> : <span>{title.slice(0, 2)}</span>}
        </div>
        <div>
          <strong>{title}</strong>
          <p>{cinema} · {hall}</p>
          <p>{showtime}</p>
        </div>
      </div>
      <div className={styles.agentTicketMeta}>
        <span><small>座位</small><b>{seats}</b></span>
        <span><small>订单号</small><b>{order.orderNo || order.id}</b></span>
      </div>
      {tickets.length ? (
        <div className={styles.agentTicketPasses}>
          {tickets.map((ticket, index) => (
            <div className={styles.agentTicketPass} key={ticket.ticketCode || `${order.id}-${index}`}>
              <b>{ticket.rowNo !== undefined ? `${ticket.rowNo}排${ticket.seatNo}座` : `第${index + 1}张电子票`}</b>
              <QRCodeSVG
                value={ticket.qrContent || ticket.ticketCode || `${order.id}-${index}`}
                size={150}
                bgColor="#ffffff"
                fgColor="#102c25"
                level="M"
                includeMargin
                role="img"
                aria-label={`${title}第${index + 1}张电子票二维码`}
              />
              <span>取票码：{ticket.ticketCode || '--'}</span>
            </div>
          ))}
        </div>
      ) : <div className={styles.agentTicketEmpty}>出票信息暂未生成</div>}
    </div>
  );
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
  ticketDetail,
  ticketLoading,
}: {
  card: AgentCardPayload;
  disabled?: boolean;
  onAction: (event: string, label: string, payload?: Record<string, unknown>) => void;
  ticketDetail?: OrderDetail;
  ticketLoading?: boolean;
}) {
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [snackQuantity, setSnackQuantity] = useState(0);
  const cardType = String(card.type || '').toUpperCase();
  const isSeatMap = cardType === 'SEAT_MAP';
  const isMovieCard = cardType === 'MOVIE_LIST' || cardType === 'MOVIE';
  const isCinemaCard = cardType === 'CINEMA_LIST' || cardType === 'CINEMA';
  const isShowtimeCard = cardType === 'SHOWTIME_LIST' || cardType === 'SHOWTIME';
  const isRefundCard = cardType === 'REFUND';
  const isSnackCard = cardType === 'SNACK_LIST' || cardType === 'SNACK';
  const isTicketCard = cardType === 'TICKET';
  const isOrderDetailCard = cardType === 'PAYMENT' || cardType === 'ORDER_CONFIRM';
  const posterUrl = isMovieCard ? getCardPosterUrl(card) : '';
  const snackImageUrl = isSnackCard ? getCardImageUrl(card) : '';
  const serviceTags = isCinemaCard ? getServiceTags(card) : [];
  const showtimeActionPayload = isShowtimeCard
    ? card.actions?.find((action) => action.event === 'select_showtime')?.payload
    : undefined;
  const cardPayload = { ...(card.payload || {}), ...(showtimeActionPayload || {}) };
  const showtimeCinema = cardPayload.cinemaName || cardPayload.cinema || cardPayload.cinema_name;
  const showtimeHall = cardPayload.hallName || cardPayload.hall || cardPayload.hall_name || cardPayload.hallType;
  const showtimeDate = cardPayload.date || (typeof cardPayload.startAt === 'string' ? cardPayload.startAt.slice(0, 10) : '');
  const showtimeTime = cardPayload.time || (typeof cardPayload.startAt === 'string' ? cardPayload.startAt.slice(11, 16) : '');
  const showtimeEndTime = cardPayload.endTime || (typeof cardPayload.endAt === 'string' ? cardPayload.endAt.slice(11, 16) : '');
  const showtimeTimeRange = showtimeTime
    ? `${showtimeTime}${showtimeEndTime ? ` - ${showtimeEndTime}` : ''}`
    : showtimeEndTime;
  const showtimeSubtitle = isShowtimeCard
    ? [
        showtimeCinema ? `影院：${showtimeCinema}` : '',
        showtimeHall ? `影厅：${showtimeHall}` : '',
        showtimeDate && showtimeTimeRange
          ? `${showtimeDate} ${showtimeTimeRange}`
          : showtimeDate || showtimeTimeRange,
      ].filter(Boolean).join(' · ') || card.subtitle
    : card.subtitle;
  const showtimePrice = Number(cardPayload.price ?? card.meta?.price);
  const showtimePriceYuan = Number.isFinite(showtimePrice)
    ? showtimePrice > 1000 ? showtimePrice / 100 : showtimePrice
    : undefined;
  const showtimeRemaining = cardPayload.remainingSeats ?? card.meta?.remainingSeats;
  const seatMapPrice = Number(cardPayload.price ?? card.meta?.price);
  const seatMapPriceYuan = Number.isFinite(seatMapPrice)
    ? seatMapPrice > 1000 ? seatMapPrice / 100 : seatMapPrice
    : undefined;
  const ticketOrderId = cardPayload.orderId ?? card.meta?.orderId;
  const ticketStatus = String(cardPayload.ticketStatus ?? card.meta?.ticketStatus ?? '').toLowerCase();
  const ticketStatusText = ticketStatus === 'issued' ? '已出票' : ticketStatus === 'pending' ? '出票处理中' : '电子票已生成';
  const snackPrice = Number(cardPayload.price ?? card.meta?.price);
  const snackPriceYuan = Number.isFinite(snackPrice)
    ? snackPrice > 1000 ? snackPrice / 100 : snackPrice
    : undefined;
  const snackAvailableStock = cardPayload.availableStock ?? cardPayload.stock ?? card.meta?.stock;
  const refundOrderId = getFirstValue(cardPayload, ['orderId', 'orderNo']) ?? getFirstValue(card.meta, ['订单号']);
  const refundStatus = String(getFirstValue(cardPayload, ['status']) ?? getFirstValue(card.meta, ['状态']) ?? '').toUpperCase();
  const refundStatusText = refundStatus === 'SUCCESS' ? '退款成功' : refundStatus === 'PENDING' ? '退款处理中' : refundStatus === 'FAIL' ? '退款失败' : '退款状态待确认';
  const refundAmount = formatCurrency(getFirstValue(cardPayload, ['amount', 'refundAmount']) ?? getFirstValue(card.meta, ['金额']));
  const refundServiceFee = formatCurrency(getFirstValue(cardPayload, ['serviceFee']) ?? getFirstValue(card.meta, ['手续费']));
  const refundRequestNo = displayValue(getFirstValue(cardPayload, ['outRequestNo']) ?? getFirstValue(card.meta, ['退款请求号']));
  const refundUpdatedAt = displayValue(getFirstValue(cardPayload, ['updatedAt']) ?? getFirstValue(card.meta, ['更新时间'])).replace('T', ' ');
  const snackStock = Math.min(
    10,
    toPositiveNumber(card.payload?.availableStock ?? card.meta?.stock, 10),
  );
  const cinemaActionPayload = isCinemaCard
    ? card.actions?.find((action) => action.event === 'select_cinema')?.payload
    : undefined;
  const mergedMeta = { ...(card.meta || {}) };
  if (isCinemaCard && cinemaActionPayload) {
    for (const key of ['district', 'minPrice']) {
      if (mergedMeta[key] === undefined || mergedMeta[key] === null || mergedMeta[key] === '') {
        mergedMeta[key] = cinemaActionPayload[key];
      }
    }
  }
  const rawMetaEntries = Object.entries(mergedMeta);
  const metaEntries = rawMetaEntries
    .filter(
      ([key]) =>
        key.toLowerCase() !== 'location' &&
        key.toLowerCase() !== 'services' &&
        key.toLowerCase() !== 'servicetags' &&
        !(isSeatMap && key.toLowerCase() === 'price') &&
        !(isSnackCard && ['price', 'stock', 'availablestock'].includes(key.toLowerCase())) &&
        !(isTicketCard && ['orderid', 'ticketstatus', 'calendar', 'notification'].includes(key.toLowerCase())) &&
        !isRefundCard,
    )
    .map(([key, value]) => [displayMetaLabel(key), displayCinemaMetaValue(key, value)] as const)
    .filter(([, value]) => value);
  const seatRows = isSeatMap
    ? Object.entries(
        (card.seats || []).reduce<Record<string, Array<Record<string, unknown>>>>((groups, seat) => {
          const row = String(seat.row ?? seat.rowNo ?? '');
          (groups[row] ||= []).push(seat);
          return groups;
        }, {}),
      )
    : [];

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
        snackItems: snackId && snackQuantity > 0 ? [{ snackId, quantity: snackQuantity }] : [],
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
          {!isTicketCard && !isRefundCard ? <Tag color="primary">{cardTypeText(String(card.type || ''))}</Tag> : null}
        </div>
        {showtimeSubtitle ? <p className={styles.cardSubtitle}>{showtimeSubtitle}</p> : null}
        {isTicketCard ? (
          <div className={styles.ticketSummary}>
            <span>{ticketOrderId ? `订单号 #${ticketOrderId}` : '电子票已生成'}</span>
            <strong>{ticketStatusText}</strong>
          </div>
        ) : null}
        {isRefundCard ? (
          <div className={styles.refundSummary}>
            <div className={styles.refundSummaryTop}>
              <span>{refundOrderId ? `订单号 #${refundOrderId}` : '退款订单'}</span>
              <strong>{refundStatusText}</strong>
            </div>
            <div className={styles.refundAmount}>{refundAmount || '金额待确认'}</div>
            {refundServiceFee ? <p>退款手续费：{refundServiceFee}</p> : null}
            {refundRequestNo ? <p>退款请求号：{refundRequestNo}</p> : null}
            {refundUpdatedAt ? <p>处理时间：{refundUpdatedAt}</p> : null}
          </div>
        ) : null}
        {isShowtimeCard ? (
          <div className={styles.showtimeSummary}>
            <span>
              <b>票价</b>
              <em>{showtimePriceYuan !== undefined ? `${showtimePriceYuan.toFixed(2)} 元` : '待定'}</em>
            </span>
            <span>
              <b>余座</b>
              <em>{showtimeRemaining !== undefined && showtimeRemaining !== null ? `${showtimeRemaining} 个` : '待定'}</em>
            </span>
          </div>
        ) : null}
        {isSnackCard ? (
          <div className={styles.snackSummary}>
            {snackPriceYuan !== undefined ? <strong>¥{snackPriceYuan.toFixed(2)}</strong> : <strong>价格待定</strong>}
            {snackAvailableStock !== undefined && snackAvailableStock !== null ? <span>库存 {String(snackAvailableStock)} 份</span> : null}
          </div>
        ) : null}
        {!isShowtimeCard && metaEntries.length ? (
          <div className={isOrderDetailCard ? styles.detailList : styles.metaList}>
            {metaEntries.map(([key, value]) => (
              <span key={key}>
                <b>{key}</b>
                <em>{value}</em>
              </span>
            ))}
          </div>
        ) : null}
        {!isShowtimeCard && serviceTags.length ? (
          <div className={styles.serviceTags}>
            <span className={styles.serviceTagsLabel}>服务标签</span>
            <div className={styles.serviceTagsList}>
              {serviceTags.map((service) => (
                <span className={styles.serviceTag} key={service}>{service}</span>
              ))}
            </div>
          </div>
        ) : null}
        {isSeatMap && seatRows.length ? (
          <div className={styles.seatMapPanel}>
            <div className={styles.seatMapHint}>
              <span>最多选择 6 个座位</span>
              {seatMapPriceYuan !== undefined ? <strong>¥{seatMapPriceYuan.toFixed(2)} / 座</strong> : null}
            </div>
            <div className={styles.seatLegend}>
              <span><i className={styles.seatLegendAvailable} />可选</span>
              <span><i className={styles.seatLegendSelected} />已选</span>
              <span><i className={styles.seatLegendSold} />已售</span>
              <span><i className={styles.seatLegendLocked} />锁定</span>
            </div>
            <div className={styles.seatScreen}>银幕</div>
            <div className={styles.seatPreview}>
              {seatRows.map(([row, seats]) => (
                <div className={styles.seatRow} key={row}>
                  <small>{row || '-'}</small>
                  <div className={styles.seatRowItems}>
                    {seats.map((seat, index) => {
                      const seatId = getSeatId(seat, index);
                      const seatLabel = String(seat.number ?? seat.seatNo ?? index + 1);
                      const status = String(seat.status || '').toLowerCase();
                      const unavailable = ['locked', 'sold', 'unavailable'].includes(status);
                      const selected = selectedSeatIds.includes(seatId);
                      return (
                        <button
                          key={seatId}
                          type="button"
                          aria-label={`${row}排${seatLabel}座`}
                          className={[
                            styles.seatButton,
                            status === 'sold' ? styles.seatSold : '',
                            status === 'locked' ? styles.seatLocked : '',
                            selected ? styles.seatSelected : '',
                            unavailable ? styles.seatUnavailable : '',
                          ].filter(Boolean).join(' ')}
                          disabled={disabled || unavailable}
                          onClick={() => toggleSeat(seatId)}
                        >
                          {seatLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {isSnackCard ? (
          <div className={styles.snackQuantityRow}>
            <span>数量</span>
            <Stepper
              min={0}
              max={snackStock}
              value={snackQuantity}
              disabled={disabled}
              onChange={(value) => setSnackQuantity(Math.max(0, Number(value) || 0))}
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
        {isTicketCard ? (
          ticketLoading ? (
            <div className={styles.agentTicketLoading}>正在加载电子票详情...</div>
          ) : ticketDetail ? <AgentTicketInline order={ticketDetail} /> : null
        ) : null}
      </div>
    </Card>
  );
}

function getMovieCarouselValue(
  card: AgentCardPayload,
  payloadKeys: string[],
  metaKeywords: string[],
) {
  const payload = card.payload || {};
  for (const key of payloadKeys) {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  const entry = Object.entries(card.meta || {}).find(([key]) =>
    metaKeywords.some((keyword) => key.includes(keyword)),
  );
  return entry?.[1];
}

function AgentMovieCarousel({
  cards,
  disabled,
  onAction,
}: {
  cards: AgentCardPayload[];
  disabled?: boolean;
  onAction: (
    card: AgentCardPayload,
    event: string,
    label: string,
    payload?: Record<string, unknown>,
  ) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(cards.length - 1, 0)));
  }, [cards.length]);

  const card = cards[activeIndex];
  if (!card) return null;

  const action = card.actions?.[0];
  const genre = displayValue(getMovieCarouselValue(card, ['genre'], ['类型']));
  const scoreValue = getMovieCarouselValue(card, ['score', 'rating'], ['评分']);
  const score = Number(scoreValue);
  const durationValue = getMovieCarouselValue(card, ['durationMinutes', 'duration'], ['时长']);
  const duration = displayValue(durationValue);
  const status = displayValue(getMovieCarouselValue(card, ['status'], ['状态']));
  const posterUrl = getCardPosterUrl(card);
  const canSwitch = cards.length > 1;
  const switchMovie = (direction: number) => {
    if (!canSwitch) return;
    setActiveIndex((current) => (current + direction + cards.length) % cards.length);
  };

  return (
    <section className={styles.agentMovieCarousel}>
      <button
        className={styles.agentCarouselArrow}
        type="button"
        aria-label="上一部电影"
        disabled={!canSwitch}
        onClick={() => switchMovie(-1)}
      >
        <LeftOutline />
      </button>
      <div className={styles.agentCarouselPoster}>
        {posterUrl ? (
          <img src={posterUrl} alt={card.title || '电影海报'} />
        ) : (
          <span>{String(card.title || '影').slice(0, 1)}</span>
        )}
      </div>
      <div className={styles.agentCarouselInfo}>
        <div className={styles.agentCarouselKicker}>
          <span>MOVIE INTRO</span>
          <em>{activeIndex + 1}/{cards.length}</em>
        </div>
        <strong>{card.title || '电影'}</strong>
        {genre ? <span className={styles.agentCarouselGenre}>{genre}</span> : null}
        <p>
          {[duration ? (/分钟$/.test(duration) ? duration : `${duration} 分钟`) : '', status]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className={styles.agentCarouselFooter}>
          {Number.isFinite(score) ? <b>{score.toFixed(1)}<small> 分</small></b> : <span />}
          {action ? (
            <Button
              size="mini"
              disabled={disabled}
              onClick={() => onAction(card, action.event, action.label, action.payload || card.payload)}
            >
              {action.label}
            </Button>
          ) : null}
        </div>
      </div>
      <button
        className={styles.agentCarouselArrow}
        type="button"
        aria-label="下一部电影"
        disabled={!canSwitch}
        onClick={() => switchMovie(1)}
      >
        <RightOutline />
      </button>
    </section>
  );
}

function AgentCardCollection({
  cards,
  disabled,
  onAction,
  ticketDetails,
  ticketLoadingId,
}: {
  cards: AgentCardPayload[];
  disabled?: boolean;
  onAction: (
    card: AgentCardPayload,
    event: string,
    label: string,
    payload?: Record<string, unknown>,
  ) => void;
  ticketDetails?: Record<string, OrderDetail>;
  ticketLoadingId?: string;
}) {
  const movieCards = cards.filter((card) => {
    const type = String(card.type || '').toUpperCase();
    return type === 'MOVIE_LIST' || type === 'MOVIE';
  });
  const otherCards = cards.filter((card) => !movieCards.includes(card));

  return (
    <>
      {movieCards.length ? (
        <AgentMovieCarousel cards={movieCards} disabled={disabled} onAction={onAction} />
      ) : null}
      {otherCards.map((card, index) => (
        <AgentCard
          key={`${card.type}-${card.id}-${index}`}
          card={card}
          disabled={disabled}
          ticketDetail={ticketDetails?.[String(card.payload?.orderId ?? card.id)]}
          ticketLoading={ticketLoadingId === String(card.payload?.orderId ?? card.id)}
          onAction={(event, label, payload) => onAction(card, event, label, payload)}
        />
      ))}
    </>
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
  const [ticketDetails, setTicketDetails] = useState<Record<string, OrderDetail>>({});
  const [ticketLoadingId, setTicketLoadingId] = useState<string>();
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
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [agentMessages.length, running]);

  async function handleAgentCardAction(
    card: AgentCardPayload,
    nextEvent: string,
    label: string,
    nextPayload?: Record<string, unknown>,
  ) {
    if (nextEvent === 'view_order_list') {
      history.push('/me/orders');
      return;
    }
    if (nextEvent === 'view_ticket' || nextEvent === 'navigate_ticket') {
      const source = { ...(card.payload || {}), ...(nextPayload || {}) };
      const orderId = source.orderId ?? source.orderNo ?? card.id;
      if (!orderId || String(orderId) === 'ticket') {
        Toast.show({ content: '订单编号缺失，暂时无法查看电子票' });
        return;
      }
      const key = String(orderId);
      setTicketLoadingId(key);
      try {
        const order = await customerApi.getOrder(key);
        setTicketDetails((current) => ({ ...current, [key]: order }));
      } catch (error) {
        Toast.show({ content: error instanceof Error ? error.message : '电子票详情加载失败' });
      } finally {
        setTicketLoadingId(undefined);
      }
      return;
    }
    if (nextEvent === 'pay_order' && String(card.type || '').toUpperCase() === 'PAYMENT') {
      void startAlipayPayment(card, nextPayload);
      return;
    }
    void send(label, nextEvent, nextPayload);
  }

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
              {item.status ? (
                <span className={styles.statusText}>{item.status}</span>
              ) : (
                formatAgentContent(item.content || '')
              )}
            </Card>
            {item.role === 'assistant' && item.cards?.some(
              (card) => String(card.type || '').toUpperCase() === 'ORDER',
            ) ? (
              <div className={styles.orderListAction}>
                <Button
                  size="mini"
                  color="primary"
                  disabled={running}
                  onClick={() => history.push('/me/orders')}
                >
                  订单列表
                </Button>
              </div>
            ) : null}
            {item.cards?.length ? (
              <div
                className={styles.cards}
              >
                <AgentCardCollection
                  cards={item.cards}
                  disabled={running}
                  ticketDetails={ticketDetails}
                  ticketLoadingId={ticketLoadingId}
                  onAction={handleAgentCardAction}
                />
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
