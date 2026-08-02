import type {
  CinemaSummary,
  ID,
  LockResult,
  MovieSummary,
  OrderDetail,
  OrderSummary,
  PageResult,
  PayResult,
  PurchaseDraftSummary,
  SeatSummary,
  ShowtimeListResult,
  ShowtimeSeatLayout,
  ShowtimeSummary,
  UserProfile,
} from '@/types/domain';
import generatedApi from '@/api';

interface ListParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  genre?: string;
  district?: string;
  brand?: string;
  hallType?: string;
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
  return {
    ...base,
    movie: raw.movie ? { id: asId(raw.movie.id), name: raw.movie.name ?? '', posterUrl: raw.movie.poster ?? undefined } : undefined,
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
    payment: raw.payment ? { status: raw.payment.status, amount: asOptionalNumber(raw.payment.amount), processedAt: raw.payment.processedAt } : undefined,
    tickets: Array.isArray(raw.tickets) ? raw.tickets.map((ticket: RawRecord) => ({
      ticketCode: ticket.ticketCode ?? '',
      rowNo: asOptionalNumber(ticket.rowNo),
      seatNo: asOptionalNumber(ticket.seatNo),
      qrContent: ticket.qrContent ?? undefined,
    })) : [],
  };
}

export const customerApi = {
  async listMovies(params: ListParams = {}): Promise<PageResult<MovieSummary>> {
    const raw = unwrap(await generatedApi.movieUserController.list({ page: 1, size: 20, ...params }));
    return {
      records: (raw?.records ?? []).map(normalizeMovie),
      total: asNumber(raw?.total),
      page: raw?.page,
      size: raw?.size,
    };
  },

  async getMovie(movieId: string): Promise<MovieSummary> {
    return normalizeMovie(unwrap(await generatedApi.movieUserController.detail({ id: asLong(movieId) })));
  },

  async listCinemas(params: ListParams = {}): Promise<PageResult<CinemaSummary>> {
    const raw = unwrap(await generatedApi.cinemaUserController.list({ page: 1, size: 20, ...params }));
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
    })) as unknown as RawRecord;
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
        posterUrl: groups[0].poster ?? undefined,
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
    const raw = unwrap(await generatedApi.orderController.list({ page: 1, size: 20, ...params }));
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

  payOrder(orderId: string, idempotencyKey: string) {
    return generatedApi.orderController.pay({ id: asLong(orderId) }, { idempotencyKey }).then((result) => unwrap(result) as RawRecord).then((raw) => ({
      orderId: asId(raw.orderId),
      status: raw.status ?? '',
      paidAmount: asOptionalNumber(raw.paidAmount),
      tickets: Array.isArray(raw.tickets) ? raw.tickets.map((ticket: RawRecord) => ({ ticketCode: ticket.ticketCode ?? '', seat: ticket.seat, qrContent: ticket.qrContent })) : [],
    } satisfies PayResult));
  },

  cancelOrder(orderId: string) {
    return generatedApi.orderController.cancel({ id: asLong(orderId) }).then(() => undefined);
  },

  getProfile() {
    return generatedApi.profileController.profile().then((result) => unwrap(result) as UserProfile);
  },
};
