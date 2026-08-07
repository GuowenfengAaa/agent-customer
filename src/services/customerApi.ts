import type {
  CinemaSummary,
  AgentMemorySummary,
  ID,
  LockResult,
  MovieSummary,
  OrderDetail,
  OrderSummary,
  PageResult,
  PaymentInit,
  RefundResult,
  PurchaseDraftSummary,
  SearchHistorySummary,
  SeatSummary,
  ShowtimeListResult,
  ShowtimeSeatLayout,
  ShowtimeSummary,
  UserProfile,
  SnackSelection,
  SnackOrderItem,
} from '@/types/domain';
import generatedApi from '@/api';
import openapiRequest from './openapiRequest';

interface ListParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  genre?: string;
  district?: string;
  brand?: string;
  hallType?: string;
  sortBy?: 'createTime' | 'releaseDate' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

type RawRecord = Record<string, any>;

type OpenApiResult<T> = { code?: number; msg?: string; data?: T };

function unwrap<T>(result: OpenApiResult<T>): T {
  return result.data as T;
}

const asId = (value: unknown): ID => String(value ?? '');
const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const asOptionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
const asLong = (value: ID): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error('无效的业务 ID');
  return parsed;
};

function normalizeMovie(raw: RawRecord): MovieSummary {
  return {
    id: asId(raw.id),
    title: raw.title ?? raw.name ?? '',
    posterUrl: raw.posterUrl ?? raw.poster ?? undefined,
    genre: raw.genre ?? undefined,
    durationMinutes: asOptionalNumber(raw.durationMinutes ?? raw.duration),
    releaseDate: raw.releaseDate ?? undefined,
    score: asOptionalNumber(raw.score ?? raw.rating),
    status: raw.statusDesc ?? raw.status ?? undefined,
    description: raw.description ?? undefined,
    cast: raw.cast ?? undefined,
    showtimeCount: asOptionalNumber(raw.showtimeCount),
    cinemaCount: asOptionalNumber(raw.cinemaCount),
    wanted: Boolean(raw.wanted),
  };
}

function normalizeCinema(raw: RawRecord): CinemaSummary {
  return {
    id: asId(raw.id),
    name: raw.name ?? '',
    address: raw.address ?? undefined,
    district: raw.district ?? undefined,
    distance: asOptionalNumber(raw.distance),
    minPrice: asOptionalNumber(raw.minPrice),
    hallTypes: Array.isArray(raw.hallTypes) ? raw.hallTypes : [],
  };
}

function normalizeShowtime(raw: RawRecord, group?: RawRecord, cinemaId?: ID): ShowtimeSummary {
  return {
    id: asId(raw.id),
    movieId: group?.id !== undefined ? asId(group.id) : undefined,
    cinemaId,
    hallName: raw.hallName ?? '',
    startAt: raw.startAt,
    endAt: raw.endAt,
    language: raw.language ?? undefined,
    hallType: raw.hallType ?? undefined,
    priceFen: asNumber(raw.priceFen ?? raw.basePrice),
    remainingSeats: asOptionalNumber(raw.remainingSeats),
    totalSeats: asOptionalNumber(raw.totalSeats),
    status: raw.status ?? undefined,
  };
}

function normalizeSeat(raw: RawRecord): SeatSummary {
  const statusMap: Record<number, SeatSummary['status']> = {
    0: 'AVAILABLE',
    1: 'LOCKED',
    2: 'SOLD',
    3: 'UNAVAILABLE',
    4: 'COUPLE',
  };
  const status = typeof raw.status === 'number' ? statusMap[raw.status] : raw.status;
  return {
    id: asId(raw.id),
    physicalSeatId: raw.physicalSeatId === undefined ? undefined : asId(raw.physicalSeatId),
    rowNo: asNumber(raw.rowNo),
    seatNo: asNumber(raw.seatNo),
    zone: raw.zone ?? undefined,
    type: raw.seatTypeDesc ?? raw.seatType ?? 'NORMAL',
    status: status === 'LOCKED' || status === 'SOLD' || status === 'UNAVAILABLE' || status === 'COUPLE' ? status : 'AVAILABLE',
    priceFen: asNumber(raw.price),
  };
}

function normalizeOrder(raw: RawRecord): OrderSummary {
  return {
    id: asId(raw.id),
    orderNo: raw.orderNo ?? '',
    movieName: raw.movieName ?? undefined,
    moviePoster: raw.moviePoster ?? raw.poster ?? undefined,
    cinemaName: raw.cinemaName ?? undefined,
    hallName: raw.hallName ?? undefined,
    startAt: raw.startAt ?? undefined,
    seatSummary: raw.seatSummary ?? undefined,
    amount: asNumber(raw.amount),
    status: raw.status ?? '',
    statusDesc: raw.statusDesc ?? undefined,
    expiresAt: raw.expiresAt ?? undefined,
    createTime: raw.createTime ?? undefined,
  };
}

function normalizeOrderDetail(raw: RawRecord): OrderDetail {
  const base = normalizeOrder(raw);
  const movie = raw.movie as RawRecord | undefined;
  return {
    ...base,
    movie: movie || raw.movieName || raw.moviePoster ? {
      id: asId(movie?.id),
      name: movie?.name ?? raw.movieName ?? '',
      posterUrl: movie?.poster ?? movie?.posterUrl ?? raw.moviePoster ?? raw.poster ?? undefined,
    } : undefined,
    cinema: raw.cinema ? { id: asId(raw.cinema.id), name: raw.cinema.name ?? '', address: raw.cinema.address ?? undefined } : undefined,
    hallType: raw.hallType ?? undefined,
    language: raw.language ?? undefined,
    endAt: raw.endAt ?? undefined,
    items: Array.isArray(raw.items) ? raw.items.map((item: RawRecord) => ({
      rowNo: asOptionalNumber(item.rowNo),
      seatNo: asOptionalNumber(item.seatNo),
      zone: item.zone ?? undefined,
      unitPrice: asNumber(item.unitPrice),
      ticketCode: item.ticketCode ?? undefined,
    })) : [],
    snacks: Array.isArray(raw.snacks) ? raw.snacks.map((item: RawRecord): SnackOrderItem => ({
      snackId: asId(item.snackId),
      name: item.name ?? item.snackName ?? '零食',
      image: item.image ?? undefined,
      unitPrice: asNumber(item.unitPrice),
      quantity: asNumber(item.quantity),
      amount: asNumber(item.amount),
      inventoryStatus: item.inventoryStatus ?? undefined,
    })) : [],
    snackAmount: asOptionalNumber(raw.snackAmount) ?? 0,
    payment: raw.payment ? { status: raw.payment.status, amount: asOptionalNumber(raw.payment.amount), processedAt: raw.payment.processedAt } : undefined,
    tickets: Array.isArray(raw.tickets) ? raw.tickets.map((ticket: RawRecord) => ({
      ticketCode: ticket.ticketCode ?? '',
      rowNo: asOptionalNumber(ticket.rowNo),
      seatNo: asOptionalNumber(ticket.seatNo),
      qrContent: ticket.qrContent ?? undefined,
    })) : [],
  };
}

function normalizeSnackSelection(raw: RawRecord): SnackSelection {
  return {
    orderId: asId(raw?.orderId),
    cinemaId: raw?.cinemaId === undefined ? undefined : asId(raw.cinemaId),
    cinemaName: raw?.cinemaName ?? undefined,
    options: Array.isArray(raw?.options) ? raw.options.map((option: RawRecord) => ({
      id: asId(option.id),
      name: option.name ?? '零食',
      description: option.description ?? undefined,
      image: option.image ?? undefined,
      priceFen: asNumber(option.priceFen),
      availableStock: asNumber(option.availableStock),
      selectedQuantity: asNumber(option.selectedQuantity),
      status: option.status === undefined ? undefined : asNumber(option.status),
    })) : [],
    selected: Array.isArray(raw?.selected) ? raw.selected.map((item: RawRecord): SnackOrderItem => ({
      snackId: asId(item.snackId),
      name: item.name ?? item.snackName ?? '零食',
      image: item.image ?? undefined,
      unitPrice: asNumber(item.unitPrice),
      quantity: asNumber(item.quantity),
      amount: asNumber(item.amount),
      inventoryStatus: item.inventoryStatus ?? undefined,
    })) : [],
    ticketAmount: asNumber(raw?.ticketAmount),
    snackAmount: asNumber(raw?.snackAmount),
    totalAmount: asNumber(raw?.totalAmount),
  };
}

function normalizeSearchHistory(raw: RawRecord): SearchHistorySummary {
  return {
    id: asId(raw.id),
    keyword: raw.keyword ?? '',
    searchCount: asOptionalNumber(raw.searchCount),
    lastSearchTime: raw.lastSearchTime ?? undefined,
  };
}

function normalizeAgentMemory(raw: RawRecord): AgentMemorySummary {
  return {
    memoryId: String(raw.memoryId ?? ''),
    sessionId: String(raw.sessionId ?? ''),
    title: raw.title ?? undefined,
    previewMessage: raw.previewMessage ?? undefined,
    messageCount: asOptionalNumber(raw.messageCount),
    stateJson: raw.stateJson ?? undefined,
    lastMessageTime: raw.lastMessageTime ?? undefined,
    createTime: raw.createTime ?? undefined,
    updateTime: raw.updateTime ?? undefined,
    messages: Array.isArray(raw.messages)
      ? raw.messages.map((message: RawRecord) => ({
        id: asId(message.id),
        memoryId: String(message.memoryId ?? raw.memoryId ?? ''),
        role: message.role ?? 'assistant',
        content: message.content ?? '',
        event: message.event ?? undefined,
        intent: message.intent ?? undefined,
        action: message.action ?? undefined,
        state: message.state ?? undefined,
        createTime: message.createTime ?? undefined,
      }))
      : [],
  };
}

export const customerApi = {
  async listMovies(params: ListParams = {}): Promise<PageResult<MovieSummary>> {
    const raw = unwrap(await generatedApi.movieUserController.list({ page: 1, size: 20, ...params } as any));
    return {
      records: (raw?.records ?? []).map(normalizeMovie),
      total: asNumber(raw?.total),
      page: raw?.page,
      size: raw?.size,
    };
  },

  async listSearchHistory(limit = 10): Promise<SearchHistorySummary[]> {
    const raw = unwrap(await generatedApi.searchHistoryController.list({ limit }));
    return Array.isArray(raw) ? raw.map(normalizeSearchHistory) : [];
  },

  async recordSearchHistory(keyword: string): Promise<SearchHistorySummary> {
    const raw = unwrap(await generatedApi.searchHistoryController.record({ keyword })) as RawRecord;
    return normalizeSearchHistory(raw);
  },

  async clearSearchHistory(): Promise<void> {
    await generatedApi.searchHistoryController.clear();
  },

  async getAgentMemory(sessionId: string, memoryId?: string): Promise<AgentMemorySummary | null> {
    const params = new URLSearchParams({ sessionId });
    if (memoryId) params.set('memoryId', memoryId);
    params.set('limit', '100');
    const result = await openapiRequest<OpenApiResult<RawRecord | null>>(
      `/api/user/agent/memory/current?${params.toString()}`,
      { method: 'GET' },
    );
    const raw = unwrap(result);
    return raw ? normalizeAgentMemory(raw) : null;
  },

  async listAgentMemories(limit = 20): Promise<AgentMemorySummary[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    const result = await openapiRequest<OpenApiResult<RawRecord[]>>(
      `/api/user/agent/memory/list?${params.toString()}`,
      { method: 'GET' },
    );
    const raw = unwrap(result);
    return Array.isArray(raw) ? raw.map(normalizeAgentMemory) : [];
  },

  async syncAgentMemory(payload: {
    sessionId: string;
    memoryId?: string;
    stateJson?: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      cardsJson?: string;
    }>;
  }): Promise<AgentMemorySummary | null> {
    const result = await openapiRequest<OpenApiResult<RawRecord | null>>(
      '/api/user/agent/memory/sync',
      {
        method: 'POST',
        data: payload,
      },
    );
    const raw = unwrap(result);
    return raw ? normalizeAgentMemory(raw) : null;
  },

  async getMovie(movieId: string): Promise<MovieSummary> {
    return normalizeMovie(unwrap(await generatedApi.movieUserController.detail({ id: asLong(movieId) })));
  },

  async listWishlist(params: { page?: number; size?: number } = {}): Promise<PageResult<MovieSummary>> {
    const raw = unwrap(await generatedApi.wishlistController.list({ page: 1, size: 20, ...params }));
    return {
      records: (raw?.records ?? []).map(normalizeMovie),
      total: asNumber(raw?.total),
      page: raw?.page,
      size: raw?.size,
    };
  },

  addToWishlist(movieId: string) {
    return generatedApi.wishlistController.add({ movieId: asLong(movieId) }).then(() => undefined);
  },

  removeFromWishlist(movieId: string) {
    return generatedApi.wishlistController.remove({ movieId: asLong(movieId) }).then(() => undefined);
  },

  async listCinemas(params: ListParams = {}): Promise<PageResult<CinemaSummary>> {
    const raw = unwrap(await generatedApi.cinemaUserController.list({ page: 1, size: 20, ...params } as any));
    return {
      records: (raw?.records ?? []).map(normalizeCinema),
      total: asNumber(raw?.total),
      page: raw?.page,
      size: raw?.size,
    };
  },

  async listNearbyCinemas(lat: number, lng: number, radius = 5): Promise<PageResult<CinemaSummary>> {
    const raw = unwrap(await generatedApi.cinemaUserController.nearby({ page: 1, size: 20, lat, lng, radius }));
    return {
      records: (raw?.records ?? []).map(normalizeCinema),
      total: asNumber(raw?.total),
      page: raw?.page,
      size: raw?.size,
    };
  },

  async listShowtimes(params: { movieId?: string; cinemaId?: string; date?: string; hallType?: string }): Promise<ShowtimeListResult> {
    const raw = unwrap(await generatedApi.showtimeUserController.list({
      ...params,
      movieId: params.movieId ? asLong(params.movieId) : undefined,
      cinemaId: params.cinemaId ? asLong(params.cinemaId) : undefined,
    } as any)) as unknown as RawRecord;
    const cinema = raw?.cinema ? {
      id: asId(raw.cinema.id),
      name: raw.cinema.name ?? '',
      address: raw.cinema.address ?? undefined,
      distance: asOptionalNumber(raw.cinema.distance),
    } : undefined;
    const groups = Array.isArray(raw?.movies) ? raw.movies : [];
    const groupedShowtimes = groups.flatMap((group: RawRecord) => (group.showtimes ?? []).map((showtime: RawRecord) => normalizeShowtime(showtime, group, cinema?.id)));
    const directShowtimes = Array.isArray(raw?.showtimes) ? raw.showtimes.map((showtime: RawRecord) => normalizeShowtime(showtime, undefined, cinema?.id)) : [];
    return {
      showtimes: groupedShowtimes.length ? groupedShowtimes : directShowtimes,
      cinema,
      movie: groups.length && groups[0] ? {
        id: asId(groups[0].id),
        name: groups[0].name ?? '',
        posterUrl: groups[0].poster ?? groups[0].posterUrl ?? undefined,
        durationMinutes: asOptionalNumber(groups[0].duration),
      } : undefined,
    };
  },

  async getSeatLayout(showtimeId: string): Promise<ShowtimeSeatLayout> {
    const raw = unwrap(await generatedApi.showtimeUserController.seats({ id: asLong(showtimeId) })) as unknown as RawRecord;
    return {
      showtimeId: asId(raw.showtimeId),
      movieName: raw.movieName ?? undefined,
      cinemaName: raw.cinemaName ?? undefined,
      hallName: raw.hallName ?? '',
      hallType: raw.hallType ?? undefined,
      startAt: raw.startAt ?? undefined,
      basePriceFen: asNumber(raw.basePrice),
      totalSeats: asOptionalNumber(raw.totalSeats),
      availableSeats: asOptionalNumber(raw.availableSeats),
      lockedSeats: asOptionalNumber(raw.lockedSeats),
      soldSeats: asOptionalNumber(raw.soldSeats),
      unavailableSeats: asOptionalNumber(raw.unavailableSeats),
      rows: (raw.rows ?? []).map((row: RawRecord) => ({
        rowNo: asNumber(row.rowNo),
        seats: (row.seats ?? []).map(normalizeSeat),
      })),
    };
  },

  getCurrentDraft() {
    return generatedApi.draftController.current().then((result) => unwrap(result) as RawRecord | null).then((raw) => raw ? {
      id: asId(raw.id),
      version: asNumber(raw.version),
      status: raw.status ?? 'ACTIVE',
      sourceMode: raw.sourceMode,
      movie: raw.movie ? { id: asId(raw.movie.id), name: raw.movie.name ?? '', posterUrl: raw.movie.poster ?? undefined } : undefined,
      cinema: raw.cinema ? { id: asId(raw.cinema.id), name: raw.cinema.name ?? '' } : undefined,
      showtime: raw.showtime ? { id: asId(raw.showtime.id), name: raw.showtime.name ?? '' } : undefined,
      ticketCount: asOptionalNumber(raw.ticketCount),
      seats: Array.isArray(raw.seats) ? raw.seats.map((seat: RawRecord) => ({ rowNo: asNumber(seat.rowNo), seatNo: asNumber(seat.seatNo) })) : [],
      canProceedToSeat: raw.canProceedToSeat,
      orderId: raw.orderId === undefined ? undefined : asId(raw.orderId),
    } satisfies PurchaseDraftSummary : null);
  },

  saveDraft(payload: {
    version: number;
    movieId?: ID;
    cinemaId?: ID;
    showtimeId?: ID;
    ticketCount?: number;
    seats?: ID[];
    sourceMode?: 'AI' | 'TRADITIONAL';
    dateTime?: { start: string; end: string };
    budget?: { perTicket: number; total: number };
  }) {
    const body = {
      ...payload,
      movieId: payload.movieId ? asLong(payload.movieId) : undefined,
      cinemaId: payload.cinemaId ? asLong(payload.cinemaId) : undefined,
      showtimeId: payload.showtimeId ? asLong(payload.showtimeId) : undefined,
      seats: payload.seats?.map(asLong),
    };
    return generatedApi.draftController.save(body).then((result) => unwrap(result) as RawRecord).then((raw) => ({
      id: asId(raw.id),
      version: asNumber(raw.version),
      status: raw.status ?? 'ACTIVE',
      sourceMode: raw.sourceMode,
      ticketCount: asOptionalNumber(raw.ticketCount),
      orderId: raw.orderId === undefined ? undefined : asId(raw.orderId),
    } satisfies PurchaseDraftSummary));
  },

  lockSeats(payload: { showtimeId: ID; seatIds: ID[]; draftVersion: number }) {
    return generatedApi.orderController.lock({
      showtimeId: asLong(payload.showtimeId),
      seatIds: payload.seatIds.map(asLong),
      draftVersion: payload.draftVersion,
    }).then((result) => unwrap(result) as RawRecord).then((raw) => ({
      orderId: asId(raw.orderId),
      orderNo: raw.orderNo ?? '',
      amount: asNumber(raw.amount),
      expiresAt: raw.expiresAt,
      remainingSeconds: asOptionalNumber(raw.remainingSeconds),
      movie: raw.movie ? { id: asId(raw.movie.id), name: raw.movie.name ?? '' } : undefined,
      cinema: raw.cinema ? { id: asId(raw.cinema.id), name: raw.cinema.name ?? '' } : undefined,
      hallName: raw.hallName,
      startAt: raw.startAt,
      seats: Array.isArray(raw.seats) ? raw.seats.map((seat: RawRecord) => ({ rowNo: asNumber(seat.rowNo), seatNo: asNumber(seat.seatNo), price: asNumber(seat.price) })) : [],
    } satisfies LockResult));
  },

  async listOrders(params: { page?: number; size?: number; status?: string } = {}): Promise<PageResult<OrderSummary>> {
    const raw = unwrap(await generatedApi.orderController.list({ page: 1, size: 20, ...params } as any));
    return {
      records: (raw?.records ?? []).map(normalizeOrder),
      total: asNumber(raw?.total),
      page: raw?.page,
      size: raw?.size,
    };
  },

  async getOrder(orderId: string): Promise<OrderDetail> {
    return normalizeOrderDetail(unwrap(await generatedApi.orderController.detail({ id: asLong(orderId) })));
  },

  async getOrderSnacks(orderId: string): Promise<SnackSelection> {
    const raw = unwrap(await generatedApi.orderSnackController.get({ orderId: asLong(orderId) })) as RawRecord;
    return normalizeSnackSelection(raw);
  },

  async replaceOrderSnacks(orderId: string, items: Array<{ snackId: string; quantity: number }>): Promise<SnackSelection> {
    const raw = unwrap(await generatedApi.orderSnackController.replace(
      { orderId: asLong(orderId) },
      { items: items.map((item) => ({ snackId: asLong(item.snackId), quantity: item.quantity })) },
    )) as RawRecord;
    return normalizeSnackSelection(raw);
  },

  payOrder(orderId: string, idempotencyKey: string): Promise<PaymentInit> {
    return generatedApi.orderController.pay({ id: asLong(orderId) }, { idempotencyKey }).then((result) => unwrap(result) as RawRecord).then((raw) => ({
      orderId: asId(raw.orderId),
      outTradeNo: raw.outTradeNo ?? '',
      paymentStatus: raw.paymentStatus ?? raw.status ?? 'PENDING',
      payForm: raw.payForm ?? undefined,
    } satisfies PaymentInit));
  },

  cancelOrder(orderId: string) {
    return generatedApi.orderController.cancel({ id: asLong(orderId) }).then(() => undefined);
  },

  refundOrder(orderId: string): Promise<RefundResult> {
    return generatedApi.orderController.refund({ id: asLong(orderId) }).then((result) => unwrap(result) as RawRecord).then((raw) => ({
      orderId: asId(raw.orderId ?? orderId),
      status: raw.status ?? 'PENDING',
      amount: asOptionalNumber(raw.amount),
      serviceFee: asOptionalNumber(raw.serviceFee),
      outRequestNo: raw.outRequestNo ?? undefined,
      message: raw.message ?? undefined,
      updatedAt: raw.updatedAt ?? undefined,
    } satisfies RefundResult));
  },

  getRefundStatus(orderId: string): Promise<RefundResult> {
    return generatedApi.orderController.refundStatus({ id: asLong(orderId) }).then((result) => unwrap(result) as RawRecord).then((raw) => ({
      orderId: asId(raw.orderId ?? orderId),
      status: raw.status ?? 'PENDING',
      amount: asOptionalNumber(raw.amount),
      serviceFee: asOptionalNumber(raw.serviceFee),
      outRequestNo: raw.outRequestNo ?? undefined,
      message: raw.message ?? undefined,
      updatedAt: raw.updatedAt ?? undefined,
    } satisfies RefundResult));
  },

  getProfile() {
    return generatedApi.profileController.profile().then((result) => unwrap(result) as UserProfile);
  },

  updateAvatar(file: File) {
    return generatedApi.profileController.updateAvatar({}, file)
      .then((result) => unwrap(result)?.url ?? '');
  },

  savePreference(payload: { district: string; hallType: string; budget: number; seatZone: string }) {
    return generatedApi.profileController.savePreference(payload)
      .then((result) => unwrap(result) as UserProfile['preference']);
  },

  sendSecurityCode() {
    return generatedApi.profileController.sendSecurityCode().then(() => undefined);
  },

  sendNewEmailCode(newEmail: string) {
    return generatedApi.profileController.sendNewEmailCode({ newEmail }).then(() => undefined);
  },

  changePassword(payload: { oldPassword: string; emailCode: string; newPassword: string }) {
    return generatedApi.profileController.changePassword(payload).then(() => undefined);
  },

  changeEmail(payload: { currentEmailCode: string; newEmail: string; newEmailCode: string }) {
    return generatedApi.profileController.changeEmail(payload).then(() => undefined);
  },
};
