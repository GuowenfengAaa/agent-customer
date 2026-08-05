import { Button, ErrorBlock, Skeleton, Tag, Toast } from 'antd-mobile';
import { HeartOutline } from 'antd-mobile-icons';
import { history } from '@umijs/max';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { queryKeys } from '@/query/keys';
import { customerApi } from '@/services/customerApi';
import type { MovieSummary } from '@/types/domain';
import { getPosterThumbnailUrl } from '@/utils/poster';
import styles from './index.module.less';

const PAGE_SIZE = 20;

const MoviePoster: React.FC<{ movie: MovieSummary; index: number }> = ({ movie, index }) => (
  <div className={styles.poster}>
    <div className={styles.posterFallback}>{movie.title.slice(0, 2) || '影片'}</div>
    {movie.posterUrl ? (
      <img
        src={getPosterThumbnailUrl(movie.posterUrl)}
        alt={`${movie.title}海报`}
        loading={index < 2 ? 'eager' : 'lazy'}
        decoding="async"
        onError={(event) => { event.currentTarget.style.display = 'none'; }}
      />
    ) : null}
  </div>
);

const formatReleaseDate = (value?: string) => value
  ? `${value.slice(0, 10)} 上映`
  : '上映日期待定';

const Wishlist: React.FC = () => {
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: queryKeys.wishlist,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => customerApi.listWishlist({ page: pageParam, size: PAGE_SIZE }),
    getNextPageParam: (lastPage) => {
      const page = lastPage.page ?? 1;
      const size = lastPage.size ?? PAGE_SIZE;
      return page * size < lastPage.total ? page + 1 : undefined;
    },
  });
  const movies = query.data?.pages.flatMap((page) => page.records) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  const removeMutation = useMutation({
    mutationFn: (movieId: string) => customerApi.removeFromWishlist(movieId),
    onSuccess: async (_, movieId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlist }),
        queryClient.invalidateQueries({ queryKey: queryKeys.movie(movieId) }),
        queryClient.invalidateQueries({ queryKey: ['movies'] }),
      ]);
      Toast.show({ icon: 'success', content: '已取消想看' });
    },
    onError: (error) => Toast.show({ content: error instanceof Error ? error.message : '操作失败，请稍后重试' }),
  });

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <div><span>MY WATCHLIST</span><h1>留住每一部期待</h1></div>
        <strong>{total}<small> 部</small></strong>
      </header>

      {query.isLoading ? (
        <div className={styles.loading}><Skeleton.Title animated /><Skeleton.Paragraph lineCount={6} animated /></div>
      ) : query.isError ? (
        <ErrorBlock
          status="default"
          title="暂时无法读取想看列表"
          description="请检查网络后重试"
        >
          <Button size="small" onClick={() => { void query.refetch(); }}>重新加载</Button>
        </ErrorBlock>
      ) : movies.length === 0 ? (
        <section className={styles.empty}>
          <HeartOutline />
          <strong>还没有想看的电影</strong>
          <p>看到感兴趣的影片，点击“想看”就会收藏到这里。</p>
          <Button color="primary" size="small" onClick={() => history.push('/home')}>去发现电影</Button>
        </section>
      ) : (
        <section className={styles.list} aria-label="想看的电影列表">
          {movies.map((movie, index) => {
            const offline = movie.status === '已下架' || movie.status === 'OFFLINE';
            const upcoming = movie.status === '待上映' || movie.status === 'COMING_SOON';
            return (
              <article className={styles.movieRow} key={movie.id}>
                <button className={styles.movieMain} type="button" onClick={() => history.push(`/movies/${movie.id}`)}>
                  <MoviePoster movie={movie} index={index} />
                  <div className={styles.movieInfo}>
                    <div className={styles.titleRow}>
                      <h2>{movie.title}</h2>
                      <Tag color={offline ? 'default' : upcoming ? 'warning' : 'success'} fill="outline">
                        {movie.status || '影片'}
                      </Tag>
                    </div>
                    <p>{movie.genre || '类型待更新'}</p>
                    {movie.cast ? <p>主演：{movie.cast}</p> : null}
                    <span>{formatReleaseDate(movie.releaseDate)}</span>
                    {movie.score ? <strong className={styles.score}>{movie.score.toFixed(1)}<small> 分</small></strong> : null}
                  </div>
                </button>
                <div className={styles.actions}>
                  <Button
                    className={styles.removeButton}
                    size="mini"
                    loading={removeMutation.isPending && removeMutation.variables === movie.id}
                    disabled={removeMutation.isPending}
                    onClick={() => removeMutation.mutate(movie.id)}
                  >
                    <HeartOutline /> 已想看
                  </Button>
                  <Button
                    className={offline ? styles.offlineButton : styles.primaryButton}
                    size="mini"
                    disabled={offline}
                    onClick={() => history.push(upcoming
                      ? `/movies/${movie.id}`
                      : `/cinemas?movieId=${encodeURIComponent(movie.id)}`)}
                  >
                    {offline ? '已下架' : upcoming ? '查看详情' : '购票'}
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {query.hasNextPage ? (
        <Button className={styles.loadMore} block loading={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage(); }}>
          加载更多
        </Button>
      ) : movies.length ? <p className={styles.endHint}>已经到底了</p> : null}
    </div>
  );
};

export default Wishlist;
