import {
  CouponOutline,
  EnvironmentOutline,
  FilterOutline,
  FireFill,
  GiftOutline,
  MovieOutline,
  UnorderedListOutline,
  UserSetOutline,
} from 'antd-mobile-icons';
import { SearchBar } from 'antd-mobile';
import { history } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { MovieSummary } from '@/types/domain';
import styles from './index.module.less';

const fallbackMovies: MovieSummary[] = [
  { id: 'demo-1', title: '流浪地球 3', genre: '科幻 / 冒险', durationMinutes: 148, score: 9.2, status: '正在热映' },
  { id: 'demo-2', title: '夏日放映厅', genre: '剧情 / 爱情', durationMinutes: 112, score: 8.6, status: '正在热映' },
  { id: 'demo-3', title: '午夜列车', genre: '悬疑 / 惊悚', durationMinutes: 105, score: 8.1, status: '正在热映' },
  { id: 'demo-4', title: '云上小镇', genre: '动画 / 家庭', durationMinutes: 99, score: 9.0, status: '即将上映' },
];

const Poster: React.FC<{ movie: MovieSummary; index: number; compact?: boolean }> = ({ movie, index, compact }) => (
  <div className={compact ? styles.compactPoster : styles.poster}>
    {movie.posterUrl ? <img src={movie.posterUrl} alt={`${movie.title}海报`} /> : <div className={`${styles.posterArt} ${styles[`posterTone${index % 4}`]}`}><strong>{movie.title.slice(0, 2)}</strong><small>{movie.genre?.split(' / ')[0]}</small></div>}
    <span className={styles.posterScore}>{movie.score?.toFixed(1)}</span>
  </div>
);

const Home: React.FC = () => {
  const { city, setMode } = useAppStore();
  const movieQuery = useQuery({ queryKey: queryKeys.movies({ page: 1, size: 20 }), queryFn: () => customerApi.listMovies({ page: 1, size: 20 }) });
  const cinemaQuery = useQuery({ queryKey: queryKeys.cinemas({ city }), queryFn: () => customerApi.listCinemas({ page: 1, size: 20 }) });
  const movies = movieQuery.data?.records?.length ? movieQuery.data.records : fallbackMovies;
  const cinemas = cinemaQuery.data?.records?.length ? cinemaQuery.data.records.slice(0, 2) : [];
  const nearby = cinemas.length ? cinemas : [
    { id: 'cinema-1', name: '万达影城 · 五角场店', address: 'IMAX · 杜比', distance: 2.1, minPrice: 45 },
    { id: 'cinema-2', name: '百丽宫影城 · 环贸店', address: '杜比 · 情侣厅', distance: 3.1, minPrice: 39 },
  ];
  const goAgent = () => {
    setMode('AI');
    history.push('/agent');
  };

  return (
    <div className={styles.page}>
      <div className={styles.homeSearchRow}>
        <SearchBar placeholder="搜索影片、类型或影院" className={styles.search} onFocus={() => history.push('/movies')} />
        <button className={styles.filterButton} type="button" aria-label="筛选"><FilterOutline /></button>
      </div>

      <section className={styles.homePromo} onClick={goAgent}>
        <div>
          <strong>今晚低价场 · 双人立减</strong>
          <small>20:00 后精选场次，两张票立减 6 元</small>
        </div>
        <div className={styles.promoPosters} aria-hidden="true">
          {movies.slice(0, 3).map((movie, index) => <Poster key={movie.id} movie={movie} index={index} compact />)}
        </div>
      </section>

      <div className={styles.serviceGrid}>
        <button type="button" onClick={() => document.getElementById('hotBand')?.scrollIntoView({ behavior: 'smooth' })}><span><FireFill /></span>热映</button>
        <button type="button" onClick={() => document.getElementById('dealBand')?.scrollIntoView({ behavior: 'smooth' })}><span><CouponOutline /></span>低价榜</button>
        <button type="button" onClick={() => history.push('/cinemas')}><span><EnvironmentOutline /></span>附近影院</button>
        <button type="button" onClick={() => history.push('/me/orders')}><span><UnorderedListOutline /></span>我的订单</button>
        <button type="button" onClick={() => history.push('/me')}><span><UserSetOutline /></span>个人信息</button>
      </div>

      <section className={styles.homeBand} id="hotBand">
        <div className={styles.bandHead}><div><h2>热映电影</h2><p>今天 {city} · 按口碑推荐</p></div><button type="button" onClick={() => history.push('/movies')}>全部 {movies.length} 部 ›</button></div>
        <div className={styles.posterScroller}>{movies.slice(0, 3).map((movie, index) => <button key={movie.id} type="button" className={styles.compactMovie} onClick={() => history.push(`/movies/${movie.id}`)}><Poster movie={movie} index={index} compact /><strong>{movie.title}</strong><span>¥{movie.score ? Math.round(movie.score * 5) : 35} 起</span></button>)}</div>
      </section>

      <section className={styles.homeBand} id="dealBand">
        <div className={styles.bandHead}><h2>今日值得看</h2><span>实时更新</span></div>
        <div className={styles.dealGrid}>
          {movies.slice(0, 2).map((movie, index) => <button key={movie.id} type="button" className={styles.dealItem} onClick={() => history.push(`/movies/${movie.id}`)}><Poster movie={movie} index={index} compact /><span><strong>{index === 0 ? '口碑榜 · ' : '低价场 · '}{movie.title}</strong><small>{movie.score?.toFixed(1)} 分 · ¥{index === 0 ? 35 : 30} 起</small></span><GiftOutline /></button>)}
        </div>
      </section>

      <section className={styles.homeBand}>
        <div className={styles.bandHead}><div><h2>附近影院</h2><p>按当前位置由近到远</p></div><button type="button" onClick={() => history.push('/cinemas')}>查看全部 ›</button></div>
        <div className={styles.nearbyList}>
          {nearby.map((cinema) => <button className={styles.nearbyRow} key={cinema.id} type="button" onClick={() => history.push(`/cinemas/${cinema.id}/showtimes`)}><div><strong>{cinema.name}</strong><span>{cinema.address || '特色影厅'} · {cinema.distance ? `${cinema.distance} km` : '附近'}</span></div><em>¥{cinema.minPrice || 39} 起</em></button>)}
        </div>
      </section>

      <section className={styles.homeBand}>
        <div className={styles.bandHead}><h2>妙语智能购票</h2><button type="button" onClick={goAgent}>进入对话 ›</button></div>
        <button className={styles.aiBanner} type="button" onClick={goAgent}><span className={styles.aiBannerIcon}><MovieOutline /></span><span><strong>把观影需求交给妙语</strong><small>告诉我时间、位置和预算，帮你筛选合适场次</small></span><span>›</span></button>
      </section>
    </div>
  );
};

export default Home;
