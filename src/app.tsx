import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd-mobile';
import React from 'react';
import PhoneShell from '@/components/PhoneShell';
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

// 影片和影院属于低频变化的基础数据，页面间跳转时优先复用缓存。
queryClient.setQueryDefaults(['movies'], {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});
queryClient.setQueryDefaults(['movie'], {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});
queryClient.setQueryDefaults(['cinemas'], {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
});

export function rootContainer(container: React.ReactNode) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <PhoneShell>{container}</PhoneShell>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
