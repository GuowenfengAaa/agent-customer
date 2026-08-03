export const queryKeys = {
  movies: (filters: object) => ['movies', filters] as const,
  movie: (id: string) => ['movie', id] as const,
  cinemas: (filters: object) => ['cinemas', filters] as const,
  showtimes: (filters: object) => ['showtimes', filters] as const,
  seatLayout: (showtimeId: string) => ['seatLayout', showtimeId] as const,
  draft: ['purchaseDraft', 'active'] as const,
  orders: (filters: object) => ['orders', filters] as const,
  order: (orderId: string) => ['order', orderId] as const,
  profile: ['profile'] as const,
  searchHistory: (limit = 10) => ['searchHistory', limit] as const,
};
