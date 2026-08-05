export type ID = string;
export type MoneyFen = number;
export type PurchaseMode = 'TRADITIONAL' | 'AI';

export interface UserSession {
  token: string;
  userId: ID;
  phone: string;
  email?: string;
  roleCode: number;
  role: 'USER' | 'ADMIN';
  loggedInAt: string;
}

export interface PurchaseDraft {
  id: ID;
  userId: ID;
  movieId?: ID;
  cinemaId?: ID;
  showtimeId?: ID;
  ticketCount: number;
  seatIds: ID[];
  sourceMode: PurchaseMode;
  status: 'ACTIVE' | 'FROZEN' | 'ARCHIVED';
  version: number;
  orderId?: ID;
}

export interface MovieSummary {
  id: ID;
  title: string;
  posterUrl?: string;
  genre?: string;
  durationMinutes?: number;
  releaseDate?: string;
  score?: number;
  status?: string;
  description?: string;
  cast?: string;
  showtimeCount?: number;
  cinemaCount?: number;
  wanted?: boolean;
}

export interface CinemaSummary {
  id: ID;
  name: string;
  address?: string;
  district?: string;
  distance?: number;
  minPrice?: number;
  hallTypes?: string[];
}

export interface ShowtimeSummary {
  id: ID;
  movieId?: ID;
  cinemaId?: ID;
  hallName: string;
  startAt: string;
  endAt?: string;
  language?: string;
  hallType?: string;
  priceFen: MoneyFen;
  remainingSeats?: number;
  totalSeats?: number;
  status?: string;
}

export interface SeatSummary {
  id: ID;
  physicalSeatId?: ID;
  rowNo: number;
  seatNo: number;
  zone?: string;
  type: string;
  status: 'AVAILABLE' | 'LOCKED' | 'SOLD' | 'UNAVAILABLE' | 'COUPLE';
  priceFen: MoneyFen;
}

export interface ShowtimeSeatLayout {
  showtimeId: ID;
  movieName?: string;
  cinemaName?: string;
  hallName: string;
  hallType?: string;
  startAt?: string;
  basePriceFen: MoneyFen;
  totalSeats?: number;
  availableSeats?: number;
  lockedSeats?: number;
  soldSeats?: number;
  unavailableSeats?: number;
  rows: Array<{ rowNo: number; seats: SeatSummary[] }>;
}

export interface ShowtimeListResult {
  showtimes: ShowtimeSummary[];
  cinema?: { id: ID; name: string; address?: string; distance?: number };
  movie?: { id: ID; name: string; posterUrl?: string; durationMinutes?: number };
}

export interface PurchaseDraftSummary {
  id: ID;
  version: number;
  status: string;
  sourceMode?: PurchaseMode;
  movie?: { id: ID; name: string; posterUrl?: string };
  cinema?: { id: ID; name: string };
  showtime?: { id: ID; name: string };
  ticketCount?: number;
  seats?: Array<{ rowNo: number; seatNo: number }>;
  canProceedToSeat?: boolean;
  orderId?: ID;
}

export interface LockResult {
  orderId: ID;
  orderNo: string;
  amount: number;
  expiresAt?: string;
  remainingSeconds?: number;
  movie?: { id: ID; name: string };
  cinema?: { id: ID; name: string };
  hallName?: string;
  startAt?: string;
  seats?: Array<{ rowNo: number; seatNo: number; price: number }>;
}

export interface PaymentInit {
  orderId: ID;
  outTradeNo: string;
  paymentStatus: string;
  payForm?: string;
}

export interface OrderSummary {
  id: ID;
  orderNo: string;
  movieName?: string;
  moviePoster?: string;
  cinemaName?: string;
  hallName?: string;
  startAt?: string;
  seatSummary?: string;
  amount: number;
  status: string;
  statusDesc?: string;
  expiresAt?: string;
  createTime?: string;
}

export interface OrderDetail extends OrderSummary {
  movie?: { id: ID; name: string; posterUrl?: string };
  cinema?: { id: ID; name: string; address?: string };
  hallType?: string;
  language?: string;
  endAt?: string;
  items?: Array<{ rowNo?: number; seatNo?: number; zone?: string; unitPrice: number; ticketCode?: string }>;
  snacks?: SnackOrderItem[];
  snackAmount?: number;
  payment?: { status?: string; amount?: number; processedAt?: string };
  tickets?: Array<{ ticketCode: string; rowNo?: number; seatNo?: number; qrContent?: string }>;
}

export interface SnackOrderItem {
  snackId: ID;
  name: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
  inventoryStatus?: string;
}

export interface SnackOption {
  id: ID;
  name: string;
  description?: string;
  image?: string;
  priceFen: number;
  availableStock: number;
  selectedQuantity: number;
  status?: number;
}

export interface SnackSelection {
  orderId: ID;
  cinemaId?: ID;
  cinemaName?: string;
  options: SnackOption[];
  selected: SnackOrderItem[];
  ticketAmount: number;
  snackAmount: number;
  totalAmount: number;
}

export interface UserProfile {
  phone?: string;
  email?: string;
  avatarUrl?: string;
  stats?: { totalOrders: number; totalSpent: number };
  preference?: { district?: string; hallType?: string; budget?: number; budgetRaw?: number; seatZone?: string };
}

export interface LoginResponse {
  token: string;
  user: {
    id: number | string;
    phone: string;
    email?: string;
    role: number;
  };
}

export interface PageResult<T> {
  records: T[];
  total: number;
  page?: number;
  size?: number;
}

export interface SearchHistorySummary {
  id: ID;
  keyword: string;
  searchCount?: number;
  lastSearchTime?: string;
}
