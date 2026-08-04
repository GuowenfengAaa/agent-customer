import { Toast } from 'antd-mobile';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/query/keys';
import { customerApi } from '@/services/customerApi';

export function useWishlistToggle(movieId: string, wanted: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => wanted
      ? customerApi.removeFromWishlist(movieId)
      : customerApi.addToWishlist(movieId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.movie(movieId) }),
        queryClient.invalidateQueries({ queryKey: ['movies'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist }),
      ]);
      Toast.show({ icon: 'success', content: wanted ? '已取消想看' : '已加入想看' });
    },
    onError: (error) => {
      Toast.show({ content: error instanceof Error ? error.message : '操作失败，请稍后重试' });
    },
  });
}
