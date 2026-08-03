import { defineConfig } from '@umijs/max';

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8080';

export default defineConfig({
  define: {
    'process.env.API_BASE_URL': apiBaseUrl,
  },
  antd: false,
  request: {},
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/auth/login', component: './AuthLogin' },
    { path: '/auth/register', component: './AuthPlaceholder' },
    { path: '/auth/forgot-password', component: './AuthPlaceholder' },
    { path: '/legal/terms', component: './Legal' },
    { path: '/legal/privacy', component: './Legal' },
    {
      path: '/home',
      component: './Home',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/search',
      component: './Search',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/movies',
      component: './Movies',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/movies/:movieId',
      component: './MovieDetail',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/cinemas',
      component: './Cinemas',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/cinemas/:cinemaId/showtimes',
      component: './CinemaShowtimes',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/agent',
      component: './Agent',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/showtimes/:showtimeId/seats',
      component: './Seats',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/orders/:orderId/confirm',
      component: './OrderPlaceholder',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/orders/:orderId/pay',
      component: './OrderPlaceholder',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/orders/:orderId/tickets',
      component: './OrderPlaceholder',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/me',
      component: './Me',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/me/orders',
      component: './OrderPlaceholder',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/me/preferences',
      component: './Me',
      wrappers: ['@/wrappers/customer'],
    },
    {
      path: '/me/security',
      component: './Me',
      wrappers: ['@/wrappers/customer'],
    },
  ],
  npmClient: 'pnpm',
  hash: true,
  esbuildMinifyIIFE: true,
  dva: false,
});
