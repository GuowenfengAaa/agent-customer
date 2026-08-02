import { Button, Card, ErrorBlock, NavBar, Skeleton } from 'antd-mobile';
import { history } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import MobileCard from '@/components/MobileCard';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { CinemaSummary } from '@/types/domain';
import styles from './index.module.less';

const fallbackCinemas: CinemaSummary[] = [
  { id: 'cinema-1', name: '万象影城 · 国贸店', address: '朝阳区建国门外大街', distance: 1.2, hallTypes: ['IMAX', '杜比厅'] },
  { id: 'cinema-2', name: '百丽宫影城 · 三里屯店', address: '朝阳区三里屯路', distance: 2.8, hallTypes: ['LUXE', '情侣厅'] },
  { id: 'cinema-3', name: '英皇电影城 · 北京店', address: '东城区金宝街', distance: 4.1, hallTypes: ['IMAX', 'VIP厅'] },
];

const Cinemas: React.FC = () => {
  const query = useQuery({ queryKey: queryKeys.cinemas({ city: '北京' }), queryFn: () => customerApi.listCinemas() });
  const cinemas = query.data?.records || fallbackCinemas;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push('/home')}>影院</NavBar>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>NEARBY CINEMAS</div>
          <h1>附近的影院</h1>
        </div>
        <Button size="small" fill="none" onClick={() => undefined}>切换城市</Button>
      </div>
      {query.isLoading ? <Card className={styles.stateCard}><Skeleton.Title animated /><Skeleton.Paragraph lineCount={3} animated /></Card> : null}
      {query.isError ? <ErrorBlock status="default" title="影院服务暂时不可用" description="当前展示演示影院信息。" /> : null}
      <div className={styles.list}>
        {cinemas.map((cinema) => (
          <MobileCard key={cinema.id} title={cinema.name} meta={cinema.distance ? `${cinema.distance} km` : '附近'} onClick={() => history.push(`/cinemas/${cinema.id}/showtimes`)}>
            <p>{cinema.address || '地址待更新'}</p>
            <div className={styles.tags}>{(cinema.hallTypes || ['普通厅']).map((type) => <span key={type}>{type}</span>)}</div>
          </MobileCard>
        ))}
      </div>
    </div>
  );
};

export default Cinemas;
