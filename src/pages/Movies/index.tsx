import { Button, Card, ErrorBlock, NavBar, Skeleton } from 'antd-mobile';
import { history } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import MobileCard from '@/components/MobileCard';
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
  <div className={`${styles.moviePoster} ${styles[`posterTone${index % 4}`]}`}>
    <strong>{movie.title.slice(0, 2)}</strong>
    <small>{movie.genre?.split(' / ')[0] || '影片'}</small>
  </div>
);

const Movies: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const query = useQuery({
    queryKey: queryKeys.movies({ keyword }),
    queryFn: () => customerApi.listMovies({ keyword }),
  });
  const movies = query.data?.records || fallbackMovies;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push('/home')}>影片</NavBar>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>NOW PLAYING</div>
          <h1>挑一部想看的</h1>
        </div>
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索" />
      </div>
      {query.isLoading ? (
        <Card className={styles.stateCard}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={3} animated />
        </Card>
      ) : query.isError ? (
        <ErrorBlock status="default" title="暂时无法连接影片服务" description="先浏览演示内容，接口恢复后会自动刷新。" />
      ) : null}
      <div className={styles.list}>
        {movies.map((movie, index) => (
          <MobileCard key={movie.id} title={movie.title} meta={movie.status || '影片'} media={<MoviePoster movie={movie} index={index} />} onClick={() => history.push(`/movies/${movie.id}`)}>
            <div className={styles.movieMeta}>
              <span>{movie.genre || '类型待更新'}</span>
              <span>{movie.durationMinutes ? `${movie.durationMinutes} 分钟` : '时长待更新'}</span>
              {movie.score ? <strong>{movie.score.toFixed(1)}</strong> : null}
            </div>
            <Button color="primary" size="small" onClick={(event) => { event.stopPropagation(); history.push(`/movies/${movie.id}`); }}>查看场次</Button>
          </MobileCard>
        ))}
      </div>
    </div>
  );
};

export default Movies;
