import { Button, Card, NavBar, Space, Tag } from 'antd-mobile';
import { history, useParams } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import styles from './index.module.less';

const MovieDetail: React.FC = () => {
  const { movieId = '' } = useParams<{ movieId: string }>();
  const query = useQuery({ queryKey: queryKeys.movie(movieId), queryFn: () => customerApi.getMovie(movieId), enabled: Boolean(movieId) });
  const movie = query.data || { title: '流浪地球 3', genre: '科幻 / 冒险', durationMinutes: 148, score: 9.2 };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push('/movies')}>影片详情</NavBar>
      <div className={styles.cover}>
        <div className={styles.coverBadge}>M</div>
        <div>
          <div className={styles.kicker}>MOVIE DETAIL</div>
          <h1>{movie.title}</h1>
          <p>{movie.genre} · {movie.durationMinutes || 120} 分钟</p>
        </div>
        <strong>{movie.score?.toFixed(1) || '—'}</strong>
      </div>
      <Card className={styles.card}>
        <Space direction="vertical" block>
          <div className={styles.sectionTitle}>影片简介</div>
          <p className={styles.copy}>这里会展示后端返回的影片简介、演职人员和上映信息。当前先保留移动端详情结构，方便后续接入真实字段。</p>
          <Button color="primary" block onClick={() => history.push('/cinemas')}>选择影院和场次</Button>
          <Tag color="warning">支持 AI 帮你筛选</Tag>
        </Space>
      </Card>
    </div>
  );
};

export default MovieDetail;
