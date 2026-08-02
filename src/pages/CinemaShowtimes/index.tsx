import { Button, Card, DatePicker, NavBar, Space, Tag } from 'antd-mobile';
import { history, useParams } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { ShowtimeSummary } from '@/types/domain';
import styles from './index.module.less';

const fallbackShowtimes: ShowtimeSummary[] = [
  { id: 'showtime-1', hallName: 'IMAX 厅', startAt: '2026-08-02T19:30:00+08:00', endAt: '2026-08-02T22:00:00+08:00', hallType: 'IMAX', priceFen: 5900, remainingSeats: 32 },
  { id: 'showtime-2', hallName: '杜比影院', startAt: '2026-08-02T20:10:00+08:00', endAt: '2026-08-02T22:40:00+08:00', hallType: '杜比', priceFen: 6900, remainingSeats: 18 },
  { id: 'showtime-3', hallName: '4K 激光厅', startAt: '2026-08-02T21:00:00+08:00', endAt: '2026-08-02T23:30:00+08:00', hallType: '激光', priceFen: 4900, remainingSeats: 64 },
];

const CinemaShowtimes: React.FC = () => {
  const { cinemaId = '' } = useParams<{ cinemaId: string }>();
  const [date, setDate] = useState(new Date());
  const query = useQuery({
    queryKey: queryKeys.showtimes({ cinemaId, date: dayjs(date).format('YYYY-MM-DD') }),
    queryFn: () => customerApi.listShowtimes({ cinemaId, date: dayjs(date).format('YYYY-MM-DD') }),
    enabled: /^\d+$/.test(cinemaId),
  });
  const showtimes = query.data?.showtimes ?? fallbackShowtimes;
  const cinemaName = query.data?.cinema?.name || '影院场次';

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push('/cinemas')}>场次选择</NavBar>
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>SHOWTIMES</div>
          <h1>{cinemaName}</h1>
          <p>选择日期和合适的场次</p>
        </div>
        <DatePicker value={date} onConfirm={setDate} min={new Date()}>
          {(value) => <Button size="small" color="primary" fill="outline">{dayjs(value).format('MM月DD日')}</Button>}
        </DatePicker>
      </div>
      <div className={styles.list}>
        {showtimes.map((showtime) => (
          <Card key={showtime.id} className={styles.showtimeCard}>
            <div className={styles.timeRow}>
              <strong>{dayjs(showtime.startAt).format('HH:mm')}</strong>
              <span>{showtime.hallName}</span>
              <em>¥{(showtime.priceFen / 100).toFixed(0)}</em>
            </div>
            <div className={styles.metaRow}>
              <Space wrap>
                <Tag color="primary">{showtime.hallType || '普通厅'}</Tag>
                <span>预计 {showtime.remainingSeats || 0} 个座位可选</span>
              </Space>
              <Button size="small" color="primary" onClick={() => history.push(`/showtimes/${showtime.id}/seats`)}>选座</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CinemaShowtimes;
