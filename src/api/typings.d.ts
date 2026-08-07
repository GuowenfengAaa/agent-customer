declare namespace API {
  type addParams = {
    movieId: number;
  };

  type AgentMemorySyncDTO = {
    memoryId?: string;
    sessionId: string;
    stateJson?: string;
    messages: Message[];
  };

  type AgentMemoryTurnDTO = {
    memoryId?: string;
    sessionId: string;
    userMessage: string;
    assistantMessage: string;
    event?: string;
    intent?: string;
    action?: string;
    state?: string;
    stateJson?: string;
    requestJson?: string;
    responseJson?: string;
  };

  type AgentMemoryVO = {
    memoryId?: string;
    sessionId?: string;
    stateJson?: string;
    lastMessageTime?: string;
    createTime?: string;
    updateTime?: string;
    messages?: AgentMessageVO[];
  };

  type AgentMessageVO = {
    id?: number;
    memoryId?: string;
    role?: string;
    content?: string;
    event?: string;
    intent?: string;
    action?: string;
    state?: string;
    createTime?: string;
  };

  type AgentSessionSummaryVO = {
    memoryId?: string;
    sessionId?: string;
    title?: string;
    previewMessage?: string;
    messageCount?: number;
    lastMessageTime?: string;
    createTime?: string;
    updateTime?: string;
  };

  type Brief = {
    id?: number;
    name?: string;
    poster?: string;
  };

  type Budget = {
    perTicket?: number;
    total?: number;
  };

  type cancelParams = {
    id: number;
  };

  type CinemaBrief = {
    id?: number;
    name?: string;
    address?: string;
    distance?: number;
    services?: string[];
  };

  type CinemaBriefVO = {
    id?: number;
    name?: string;
  };

  type CinemaCreateDTO = {
    name: string;
    address: string;
    district: string;
    brand?: string;
    latitude?: number;
    longitude?: number;
    services?: string[];
  };

  type CinemaOptionVO = {
    id?: number;
    name?: string;
    halls?: HallBrief[];
  };

  type CinemaPageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: CinemaVO[];
  };

  type CinemaStatusDTO = {
    status: "INACTIVE" | "ACTIVE";
  };

  type CinemaUpdateDTO = {
    name?: string;
    address?: string;
    district?: string;
    brand?: string;
    latitude?: number;
    longitude?: number;
    services?: string[];
  };

  type CinemaVO = {
    id?: number;
    name?: string;
    address?: string;
    district?: string;
    brand?: string;
    latitude?: number;
    longitude?: number;
    status?: number;
    statusDesc?: string;
    services?: string[];
    minPrice?: number;
    distance?: number;
    hallTypes?: string[];
    hallCount?: number;
    showtimeCount?: number;
    createTime?: string;
  };

  type createSeatParams = {
    hallId: number;
  };

  type currentParams = {
    sessionId: string;
    memoryId?: string;
    limit?: number;
  };

  type DailyOrderVO = {
    date?: string;
    count?: number;
    revenue?: number;
  };

  type DashboardVO = {
    todayStats?: TodayStatsVO;
    seatStats?: SeatStatsVO;
    topMovies?: TopMovieVO[];
    last7DaysOrders?: DailyOrderVO[];
  };

  type DateTimeRange = {
    start?: string;
    end?: string;
  };

  type deleteMovieParams = {
    id: number;
  };

  type deleteSeatParams = {
    hallId: number;
    seatId: number;
  };

  type detailParams = {
    id: number;
  };

  type detailParams = {
    id: number;
  };

  type detailParams = {
    id: number;
  };

  type detailParams = {
    id: number;
  };

  type detailParams = {
    id: number;
  };

  type detailParams = {
    id: number;
  };

  type DraftSaveDTO = {
    version: number;
    movieId?: number;
    cinemaId?: number;
    dateTime?: DateTimeRange;
    showtimeId?: number;
    ticketCount?: number;
    budget?: Budget;
    seats?: number[];
    sourceMode?: string;
  };

  type DraftVO = {
    id?: number;
    version?: number;
    status?: string;
    sourceMode?: string;
    movie?: Brief;
    cinema?: Brief;
    dateTime?: DateTimeRange;
    showtime?: Brief;
    ticketCount?: number;
    budget?: Budget;
    seats?: SeatItem[];
    clearedFields?: string[];
    canProceedToSeat?: boolean;
    orderId?: number;
  };

  type EmailChangeDTO = {
    currentEmailCode: string;
    newEmail: string;
    newEmailCode: string;
  };

  type EmailLoginDTO = {
    email: string;
    code: string;
  };

  type getParams = {
    orderId: number;
  };

  type HallBrief = {
    id?: number;
    name?: string;
  };

  type HallBriefVO = {
    id?: number;
    name?: string;
    hallType?: string;
  };

  type HallCreateDTO = {
    cinemaId: number;
    name: string;
    hallType: "IMAX" | "DOLBY" | "DIGITAL" | "FOUR_DX" | "NORMAL";
  };

  type HallPageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: HallVO[];
  };

  type HallSeatVO = {
    hallId?: number;
    hallName?: string;
    hallType?: string;
    cinemaName?: string;
    summary?: Record<string, any>;
    rows?: RowVO[];
  };

  type HallStatusDTO = {
    status: "INACTIVE" | "ACTIVE";
  };

  type HallUpdateDTO = {
    name?: string;
    hallType?: "IMAX" | "DOLBY" | "DIGITAL" | "FOUR_DX" | "NORMAL";
  };

  type HallVO = {
    id?: number;
    cinemaId?: number;
    name?: string;
    hallType?: string;
    hallTypeDesc?: string;
    status?: number;
    statusDesc?: string;
    totalSeats?: number;
    createTime?: string;
  };

  type listByCinemaParams = {
    cinemaId: number;
    page?: number;
    size?: number;
    keyword?: string;
  };

  type searchHistoryListParams = {
    limit?: number;
  };

  type listParams = {
    page?: number;
    size?: number;
    cinemaId?: number;
    keyword?: string;
    status?: number;
  };

  type listParams = {
    page?: number;
    size?: number;
    movieId?: number;
    cinemaId?: number;
    date?: string;
    status?: string;
  };

  type listParams = {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
  };

  type listParams = {
    page?: number;
    size?: number;
    keyword?: string;
    district?: string;
    status?: number;
  };

  type listParams = {
    page?: number;
    size?: number;
  };

  type listParams = {
    movieId?: number;
    cinemaId?: number;
    date?: string;
    hallType?: string;
  };

  type listParams = {
    page?: number;
    size?: number;
    status?: string;
  };

  type listParams = {
    page?: number;
    size?: number;
    status?: string;
    genre?: string;
    keyword?: string;
    sortBy?: string;
    sortOrder?: string;
  };

  type listParams = {
    page?: number;
    size?: number;
    district?: string;
    brand?: string;
    hallType?: string;
    keyword?: string;
  };

  type searchHistoryListParams = {
    limit?: number;
  };

  type listParams = {
    page?: number;
    size?: number;
    orderNo?: string;
    email?: string;
    movieId?: number;
    cinemaId?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  };

  type LockLogVO = {
    action?: string;
    seatId?: number;
    createTime?: string;
  };

  type LockResultVO = {
    orderId?: number;
    orderNo?: string;
    amount?: number;
    expiresAt?: string;
    remainingSeconds?: number;
    movie?: MovieBriefVO;
    cinema?: CinemaBriefVO;
    hallName?: string;
    startAt?: string;
    seats?: SeatInfo[];
  };

  type LockSeatsDTO = {
    showtimeId: number;
    seatIds: number[];
    draftVersion: number;
  };

  type LoginDTO = {
    phone: string;
    password: string;
  };

  type LoginVO = {
    token?: string;
    user?: Record<string, any>;
  };

  type Message = {
    role: string;
    content: string;
    cardsJson?: string;
  };

  type MovieBrief = {
    id?: number;
    name?: string;
    poster?: string;
  };

  type MovieBriefVO = {
    id?: number;
    name?: string;
  };

  type MovieCreateDTO = {
    name: string;
    genre: string;
    duration: number;
    rating?: number;
    poster?: string;
    status: "COMING_SOON" | "NOW_SHOWING" | "OFFLINE";
    description?: string;
    cast?: string;
    releaseDate: string;
  };

  type MovieGroup = {
    id?: number;
    name?: string;
    poster?: string;
    duration?: number;
    showtimes?: ShowtimeItem[];
  };

  type MovieOptionVO = {
    id?: number;
    name?: string;
  };

  type MoviePageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: MovieVO[];
  };

  type MovieStatusDTO = {
    status: "COMING_SOON" | "NOW_SHOWING" | "OFFLINE";
  };

  type MovieUpdateDTO = {
    name?: string;
    genre?: string;
    duration?: number;
    rating?: number;
    poster?: string;
    description?: string;
    cast?: string;
    releaseDate?: string;
    status?: "COMING_SOON" | "NOW_SHOWING" | "OFFLINE";
  };

  type MovieVO = {
    id?: number;
    name?: string;
    genre?: string;
    duration?: number;
    rating?: number;
    poster?: string;
    status?: number;
    statusDesc?: string;
    description?: string;
    cast?: string;
    releaseDate?: string;
    showtimeCount?: number;
    cinemaCount?: number;
    wanted?: boolean;
    createTime?: string;
  };

  type nearbyParams = {
    page?: number;
    size?: number;
    lat: number;
    lng: number;
    radius?: number;
  };

  type NewEmailCodeDTO = {
    newEmail: string;
  };

  type notifyParams = {
    params: Record<string, any>;
  };

  type Option = {
    id?: number;
    name?: string;
    description?: string;
    image?: string;
    priceFen?: number;
    availableStock?: number;
    selectedQuantity?: number;
    status?: number;
  };

  type OrderDetailVO = {
    id?: number;
    orderNo?: string;
    userId?: number;
    userEmail?: string;
    movieName?: string;
    moviePoster?: string;
    cinemaName?: string;
    cinemaAddress?: string;
    hallName?: string;
    hallType?: string;
    language?: string;
    startAt?: string;
    endAt?: string;
    items?: OrderItemVO[];
    snacks?: SnackOrderItemVO[];
    snackAmount?: number;
    amount?: number;
    status?: string;
    statusDesc?: string;
    payment?: PaymentInfoVO;
    tickets?: TicketInfoVO[];
    seatLockLogs?: LockLogVO[];
    expiresAt?: string;
    createTime?: string;
    updateTime?: string;
  };

  type OrderItemInfo = {
    rowNo?: number;
    seatNo?: number;
    zone?: string;
    unitPrice?: number;
    ticketCode?: string;
  };

  type OrderItemVO = {
    rowNo?: number;
    seatNo?: number;
    zone?: string;
    unitPrice?: number;
    ticketCode?: string;
  };

  type OrderPageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: OrderVO[];
  };

  type OrderSnackItemDTO = {
    snackId: number;
    quantity: number;
  };

  type OrderSnackSelectionDTO = {
    items: OrderSnackItemDTO[];
  };

  type OrderVO = {
    id?: number;
    orderNo?: string;
    userId?: number;
    userEmail?: string;
    movieName?: string;
    cinemaName?: string;
    hallName?: string;
    startAt?: string;
    seatSummary?: string;
    amount?: number;
    status?: string;
    statusDesc?: string;
    createTime?: string;
  };

  type PasswordChangeDTO = {
    oldPassword: string;
    emailCode: string;
    newPassword: string;
  };

  type PayDTO = {
    idempotencyKey: string;
  };

  type PaymentInfo = {
    status?: string;
    amount?: number;
    processedAt?: string;
  };

  type PaymentInfoVO = {
    status?: string;
    amount?: number;
    idempotencyKey?: string;
    processedAt?: string;
  };

  type PaymentInitVO = {
    orderId?: number;
    outTradeNo?: string;
    paymentStatus?: string;
    payForm?: string;
    qrCode?: string;
  };

  type payParams = {
    id: number;
  };

  type PreferenceSaveDTO = {
    district?: string;
    hallType?: string;
    budget?: number;
    seatZone?: string;
  };

  type PreferenceVO = {
    district?: string;
    hallType?: string;
    budget?: number;
    budgetRaw?: number;
    seatZone?: string;
  };

  type refundParams = {
    id: number;
  };

  type RefundResultVO = {
    orderId?: number;
    status?: string;
    amount?: number;
    outRequestNo?: string;
    message?: string;
    updatedAt?: string;
  };

  type refundStatusParams = {
    id: number;
  };

  type RegisterDTO = {
    phone: string;
    email: string;
    password: string;
    code: string;
  };

  type removeParams = {
    movieId: number;
  };

  type replaceParams = {
    orderId: number;
  };

  type ResetPasswordDTO = {
    email: string;
    code: string;
    newPassword: string;
  };

  type ResultAgentMemoryVO = {
    code?: number;
    msg?: string;
    data?: AgentMemoryVO;
  };

  type ResultCinemaPageVO = {
    code?: number;
    msg?: string;
    data?: CinemaPageVO;
  };

  type ResultCinemaVO = {
    code?: number;
    msg?: string;
    data?: CinemaVO;
  };

  type ResultDashboardVO = {
    code?: number;
    msg?: string;
    data?: DashboardVO;
  };

  type ResultDraftVO = {
    code?: number;
    msg?: string;
    data?: DraftVO;
  };

  type ResultHallPageVO = {
    code?: number;
    msg?: string;
    data?: HallPageVO;
  };

  type ResultHallSeatVO = {
    code?: number;
    msg?: string;
    data?: HallSeatVO;
  };

  type ResultListAgentSessionSummaryVO = {
    code?: number;
    msg?: string;
    data?: AgentSessionSummaryVO[];
  };

  type ResultListCinemaOptionVO = {
    code?: number;
    msg?: string;
    data?: CinemaOptionVO[];
  };

  type ResultListMovieOptionVO = {
    code?: number;
    msg?: string;
    data?: MovieOptionVO[];
  };

  type ResultListSearchHistoryVO = {
    code?: number;
    msg?: string;
    data?: SearchHistoryVO[];
  };

  type ResultLockResultVO = {
    code?: number;
    msg?: string;
    data?: LockResultVO;
  };

  type ResultLoginVO = {
    code?: number;
    msg?: string;
    data?: LoginVO;
  };

  type ResultMoviePageVO = {
    code?: number;
    msg?: string;
    data?: MoviePageVO;
  };

  type ResultMovieVO = {
    code?: number;
    msg?: string;
    data?: MovieVO;
  };

  type ResultOrderDetailVO = {
    code?: number;
    msg?: string;
    data?: OrderDetailVO;
  };

  type ResultOrderPageVO = {
    code?: number;
    msg?: string;
    data?: OrderPageVO;
  };

  type ResultPaymentInitVO = {
    code?: number;
    msg?: string;
    data?: PaymentInitVO;
  };

  type ResultPreferenceVO = {
    code?: number;
    msg?: string;
    data?: PreferenceVO;
  };

  type ResultRefundResultVO = {
    code?: number;
    msg?: string;
    data?: RefundResultVO;
  };

  type ResultSearchHistoryVO = {
    code?: number;
    msg?: string;
    data?: SearchHistoryVO;
  };

  type ResultSeatVO = {
    code?: number;
    msg?: string;
    data?: SeatVO;
  };

  type ResultShowtimeGroupedVO = {
    code?: number;
    msg?: string;
    data?: ShowtimeGroupedVO;
  };

  type ResultShowtimePageVO = {
    code?: number;
    msg?: string;
    data?: ShowtimePageVO;
  };

  type ResultShowtimeSeatLayoutVO = {
    code?: number;
    msg?: string;
    data?: ShowtimeSeatLayoutVO;
  };

  type ResultShowtimeSeatStatusVO = {
    code?: number;
    msg?: string;
    data?: ShowtimeSeatStatusVO;
  };

  type ResultSnackProductPageVO = {
    code?: number;
    msg?: string;
    data?: SnackProductPageVO;
  };

  type ResultSnackProductVO = {
    code?: number;
    msg?: string;
    data?: SnackProductVO;
  };

  type ResultSnackSelectionVO = {
    code?: number;
    msg?: string;
    data?: SnackSelectionVO;
  };

  type ResultUploadResultDTO = {
    code?: number;
    msg?: string;
    data?: UploadResultDTO;
  };

  type ResultUserOrderDetailVO = {
    code?: number;
    msg?: string;
    data?: UserOrderDetailVO;
  };

  type ResultUserOrderPageVO = {
    code?: number;
    msg?: string;
    data?: UserOrderPageVO;
  };

  type ResultUserProfileVO = {
    code?: number;
    msg?: string;
    data?: UserProfileVO;
  };

  type ResultVoid = {
    code?: number;
    msg?: string;
    data?: Record<string, any>;
  };

  type returnFromAlipayParams = {
    out_trade_no?: string;
    cancelled?: boolean;
  };

  type RowVO = {
    rowNo?: number;
    seats?: SeatItemVO[];
  };

  type saveSeatLayoutParams = {
    hallId: number;
  };

  type SearchHistorySaveDTO = {
    keyword: string;
  };

  type SearchHistoryVO = {
    id?: number;
    keyword?: string;
    searchCount?: number;
    lastSearchTime?: string;
  };

  type SeatCreateDTO = {
    rowNo: number;
    seatNo: number;
    zone: string;
    seatType: number;
    status?: number;
  };

  type SeatInfo = {
    rowNo?: number;
    seatNo?: number;
    price?: number;
  };

  type SeatItem = {
    rowNo?: number;
    seatNo?: number;
  };

  type SeatItemVO = {
    id?: number;
    seatNo?: number;
    zone?: string;
    seatType?: string;
    status?: string;
  };

  type SeatLayoutItemDTO = {
    id?: number;
    rowNo: number;
    seatNo: number;
    zone: string;
    seatType: number;
    status?: number;
  };

  type SeatLayoutSaveDTO = {
    seats: SeatLayoutItemDTO[];
  };




  type SeatStatsVO = {
    soldRate?: number;
    totalSold?: number;
    totalAvailable?: number;
  };

  type SeatUpdateDTO = {
    rowNo?: number;
    seatNo?: number;
    zone?: string;
    seatType?: number;
    status?: number;
  };

  type SeatVO = {
    id?: number;
    hallId?: number;
    rowNo?: number;
    seatNo?: number;
    zone?: string;
    seatType?: number;
    seatTypeDesc?: string;
    status?: number;
    statusDesc?: string;
  };

  type SendCodeDTO = {
    email: string;
    purpose: number;
  };

  type ShowtimeCreateDTO = {
    movieId: number;
    hallId: number;
    startAt: string;
    basePrice: number;
    language?: string;
  };

  type ShowtimeGroupedVO = {
    cinema?: CinemaBrief;
    movies?: MovieGroup[];
  };

  type ShowtimeItem = {
    id?: number;
    startAt?: string;
    endAt?: string;
    language?: string;
    hallType?: string;
    hallName?: string;
    basePrice?: number;
    remainingSeats?: number;
    totalSeats?: number;
    status?: string;
  };

  type ShowtimePageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: ShowtimeVO[];
  };

  type ShowtimeSeatLayoutVO = {
    showtimeId?: number;
    movieName?: string;
    cinemaName?: string;
    hallName?: string;
    hallType?: string;
    startAt?: string;
    basePrice?: number;
    totalSeats?: number;
    availableSeats?: number;
    lockedSeats?: number;
    soldSeats?: number;
    unavailableSeats?: number;
    rows?: RowVO[];
  };

  type ShowtimeSeatStatusDTO = {
    seatIds: number[];
    status: string;
  };

  type ShowtimeSeatStatusVO = {
    updatedSeatIds?: number[];
    skippedSeatIds?: number[];
    skippedReason?: string;
  };

  type ShowtimeStatusDTO = {
    status: "SOLD_OUT" | "ON_SALE" | "SOLD_OUT_ALL" | "ENDED";
  };

  type ShowtimeUpdateDTO = {
    startAt?: string;
    basePrice?: number;
    language?: string;
  };

  type ShowtimeVO = {
    id?: number;
    movie?: MovieBriefVO;
    cinema?: CinemaBriefVO;
    hall?: HallBriefVO;
    startAt?: string;
    endAt?: string;
    basePrice?: number;
    language?: string;
    status?: number;
    statusDesc?: string;
    soldSeats?: number;
    totalSeats?: number;
    lockedCount?: number;
    createTime?: string;
  };

  type SnackOrderItemVO = {
    snackId?: number;
    name?: string;
    image?: string;
    unitPrice?: number;
    quantity?: number;
    amount?: number;
    inventoryStatus?: string;
  };

  type SnackProductCreateDTO = {
    cinemaId: number;
    name: string;
    description?: string;
    image?: string;
    priceFen: number;
    stock: number;
  };

  type SnackProductPageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: SnackProductVO[];
  };

  type SnackProductStatusDTO = {
    status: number;
  };

  type SnackProductStockDTO = {
    stock: number;
  };

  type SnackProductUpdateDTO = {
    name?: string;
    description?: string;
    image?: string;
    priceFen?: number;
  };

  type SnackProductVO = {
    id?: number;
    cinemaId?: number;
    cinemaName?: string;
    name?: string;
    description?: string;
    image?: string;
    priceFen?: number;
    stock?: number;
    soldCount?: number;
    status?: number;
    statusDesc?: string;
    createTime?: string;
    updateTime?: string;
  };

  type SnackSelectionVO = {
    orderId?: number;
    cinemaId?: number;
    cinemaName?: string;
    options?: Option[];
    selected?: SnackOrderItemVO[];
    ticketAmount?: number;
    snackAmount?: number;
    totalAmount?: number;
  };

  type TicketInfo = {
    ticketCode?: string;
    rowNo?: number;
    seatNo?: number;
    qrContent?: string;
  };

  type TicketInfoVO = {
    ticketCode?: string;
    rowNo?: number;
    seatNo?: number;
    qrContent?: string;
  };

  type TodayStatsVO = {
    newUsers?: number;
    orderCount?: number;
    paidOrderCount?: number;
    revenue?: number;
    conversionRate?: number;
  };

  type TopMovieVO = {
    id?: number;
    name?: string;
    orderCount?: number;
    revenue?: number;
  };

  type updateParams = {
    id: number;
  };

  type updateParams = {
    id: number;
  };

  type updateParams = {
    id: number;
  };

  type updateParams = {
    id: number;
  };

  type updateParams = {
    id: number;
  };

  type updateSeatParams = {
    hallId: number;
    seatId: number;
  };

  type updateSeatStatusParams = {
    id: number;
  };

  type updateStatusParams = {
    id: number;
  };

  type updateStatusParams = {
    id: number;
  };

  type updateStatusParams = {
    id: number;
  };

  type updateStatusParams = {
    id: number;
  };

  type updateStatusParams = {
    id: number;
  };

  type updateStockParams = {
    id: number;
  };

  type UploadResultDTO = {
    url?: string;
    fileName?: string;
    size?: number;
  };

  type UserOrderDetailVO = {
    id?: number;
    orderNo?: string;
    movie?: MovieBrief;
    cinema?: CinemaBrief;
    hallName?: string;
    hallType?: string;
    language?: string;
    startAt?: string;
    endAt?: string;
    items?: OrderItemInfo[];
    snacks?: SnackOrderItemVO[];
    snackAmount?: number;
    amount?: number;
    status?: string;
    statusDesc?: string;
    payment?: PaymentInfo;
    tickets?: TicketInfo[];
    expiresAt?: string;
    createTime?: string;
  };

  type UserOrderPageVO = {
    total?: number;
    page?: number;
    size?: number;
    records?: UserOrderVO[];
  };

  type UserOrderVO = {
    id?: number;
    orderNo?: string;
    movieName?: string;
    poster?: string;
    cinemaName?: string;
    hallName?: string;
    startAt?: string;
    seatSummary?: string;
    amount?: number;
    status?: string;
    statusDesc?: string;
    expiresAt?: string;
    createTime?: string;
  };

  type UserProfileVO = {
    phone?: string;
    email?: string;
    avatarUrl?: string;
    stats?: UserStats;
    preference?: PreferenceVO;
  };

  type UserStats = {
    totalOrders?: number;
    totalSpent?: number;
  };
}
