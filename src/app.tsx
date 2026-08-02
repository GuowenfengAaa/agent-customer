import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd-mobile';
import React from 'react';
import './global.less';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function rootContainer(container: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>{container}</ConfigProvider>
    </QueryClientProvider>
  );
}
