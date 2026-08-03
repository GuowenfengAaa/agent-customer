import { Button, ErrorBlock, NavBar, SearchBar, Skeleton, Tag } from 'antd-mobile';
import { history } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { MovieSummary } from '@/types/domain';
import styles from './index.module.less';

const fallbackMovies: MovieSummary[] = [
  { id: 'demo-1', title: '流浪地球 3', genre: '科幻 / 冒险', durationMinutes: 148, score: 9.2, status: '正在热映' },
  { id: 'demo-2', title: '夏日放映厅', genre: '剧情 / 爱情', durationMinutes: 112, score: 8.6, status: '正在热映' },
  { id: 'demo-3', title: '午夜列车', genre: '悬疑 / 惊悚', durationMinutes: 105, score: 8.1, status: '即将上映' },
];

const MoviePoster: React.FC<{ movie: MovieSummary; index: number }> = ({ movie, index }) => (
  <div className={[styles.moviePoster, styles['posterTone' + (index % 4)]].join(' ')}>
    <div className={styles.posterFallback}>
      <strong>{movie.title.slice(0, 2)}</strong>
      <small>{movie.genre?.split(' / ')[0] || '影片'}</small>
    </div>
    {movie.posterUrl ? (
      <img
        src={movie.posterUrl}
        alt={movie.title + '海报'}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    ) : null}
  </div>
);

const Movies: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const query = useQuery({
    queryKey: queryKeys.movies({ keyword, page: 1, size: 20 }),
    queryFn: () => customerApi.listMovies({ keyword, page: 1, size: 20 }),
  });
  const movies = query.data?.records?.length ? query.data.records : fallbackMovies;
  const total = Math.max(query.data?.total || 0, movies.length);
  const openMovie = (movieId: string) => history.push('/movies/' + movieId);

  return (
    <div className={styles.page}>
      <NavBar className={styles.navBar} onBack={() => history.push('/home')}>热映电影</NavBar>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.kicker}>NOW PLAYING</div>
            <h1>正在热映</h1>
          </div>
          <span className={styles.movieCount}>{total} 部</span>
        </div>
        <SearchBar
          className={styles.search}
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索影片名称或类型"
          clearable
        />
      </header>

      {query.isLoading ? (
        <div className={styles.loadingList}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={5} animated />
        </div>
      ) : query.isError ? (
        <ErrorBlock status="default" title="暂时无法连接影片服务" description="接口恢复后会自动刷新影片列表。" />
      ) : null}

      <section className={styles.list} aria-label="热映电影列表">
        {movies.map((movie, index) => (
          <article
            className={styles.movieRow}
            key={movie.id}
            role="button"
            tabIndex={0}
            onClick={() => openMovie(movie.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') openMovie(movie.id);
            }}
          >
            <MoviePoster movie={movie} index={index} />

            <div className={styles.movieInfo}>
              <div className={styles.movieTitleRow}>
                <h2>{movie.title}</h2>
                <Tag className={styles.statusTag} color="success" fill="outline">
                  {movie.status || '热映中'}
                </Tag>
              </div>
              <p>{movie.genre || '类型待更新'}</p>
              <p>{movie.durationMinutes ? movie.durationMinutes + ' 分钟' : '时长待更新'}</p>
              {movie.cast ? <p className={styles.cast}>主演：{movie.cast}</p> : null}
              <span className={styles.showtimeHint}>
                {movie.cinemaCount ? movie.cinemaCount + ' 家影院' : '多家影院上映'}
              </span>
            </div>

            <div className={styles.movieAction}>
              {movie.score ? (
                <div className={styles.score}>
                  <strong>{movie.score.toFixed(1)}</strong>
                  <small>观众评分</small>
                </div>
              ) : (
                <div className={styles.noScore}>暂无评分</div>
              )}
              <Button
                className={styles.buyButton}
                size="mini"
                onClick={(event) => {
                  event.stopPropagation();
                  openMovie(movie.id);
                }}
              >
                购票
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Movies;
