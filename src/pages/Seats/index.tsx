import { Button, Card, NavBar, Toast } from 'antd-mobile';
import { history, useLocation, useParams } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useMemo, useState } from 'react';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { SeatSummary } from '@/types/domain';
import { getPosterThumbnailUrl } from '@/utils/poster';
import styles from './index.module.less';

const fallbackRows: Array<{ rowNo: number; seats: SeatSummary[] }> = Array.from({ length: 7 }, (_, row) => ({
  rowNo: row + 1,
  seats: Array.from({ length: 10 }, (_, seat) => ({
    id: `${row + 1}-${seat + 1}`,
    rowNo: row + 1,
    seatNo: seat + 1,
    type: 'NORMAL',
    status: (row === 0 && seat < 2) || (row === 5 && seat === 6) ? 'SOLD' : 'AVAILABLE',
    priceFen: 5900,
  } as SeatSummary)),
}));

const isBlocked = (status: SeatSummary['status']) => status === 'LOCKED' || status === 'SOLD' || status === 'UNAVAILABLE';

const Seats: React.FC = () => {
  const { showtimeId = '' } = useParams<{ showtimeId: string }>();
  const location = useLocation();
  const movieId = new URLSearchParams(location.search).get('movieId') || '';
  const isRemoteShowtime = /^\d+$/.test(showtimeId);
  const movieQuery = useQuery({
    queryKey: queryKeys.movie(movieId),
    queryFn: () => customerApi.getMovie(movieId),
    enabled: /^\d+$/.test(movieId),
  });
  const query = useQuery({
    queryKey: queryKeys.seatLayout(showtimeId),
    queryFn: () => customerApi.getSeatLayout(showtimeId),
    enabled: isRemoteShowtime,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const rows = query.data?.rows?.length ? query.data.rows : fallbackRows;
  const seatMap = useMemo(() => new Map(rows.flatMap((row) => row.seats.map((seat) => [seat.id, seat]))), [rows]);
  const selectedSeats = selected.map((id) => seatMap.get(id)).filter((seat): seat is SeatSummary => Boolean(seat));
  const amountFen = selectedSeats.reduce((sum, seat) => sum + (seat.priceFen || query.data?.basePriceFen || 0), 0);

  const toggle = (seat: SeatSummary) => {
    if (isBlocked(seat.status)) return;
    setSelected((current) => current.includes(seat.id)
      ? current.filter((id) => id !== seat.id)
      : current.length < 6 ? [...current, seat.id] : current);
  };

  const confirm = async () => {
    if (!selected.length) {
      Toast.show({ content: '请先选择座位' });
      return;
    }
    if (!isRemoteShowtime || !query.data) {
      Toast.show({ content: '当前为演示座位，后端座位图加载后才能锁座' });
      return;
    }

    setSaving(true);
    try {
      const draft = await customerApi.getCurrentDraft();
      const savedDraft = await customerApi.saveDraft({
        version: draft?.version ?? 0,
        showtimeId: query.data.showtimeId,
        ticketCount: selected.length,
        seats: selected,
        sourceMode: 'TRADITIONAL',
      });
      const order = await customerApi.lockSeats({
        showtimeId: query.data.showtimeId,
        seatIds: selected,
        draftVersion: savedDraft.version,
      });
      history.push(`/orders/${order.orderId}/confirm`);
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '锁座失败，请刷新后重试' });
    } finally {
      setSaving(false);
    }
  };

  const title = query.data?.hallName || 'IMAX 厅';
  const time = query.data?.startAt ? dayjs(query.data.startAt).format('HH:mm') : '19:30';
  const movieName = movieQuery.data?.title || query.data?.movieName;
  const moviePoster = movieQuery.data?.posterUrl;

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.back()}>选择座位</NavBar>
      {movieName ? (
        <section className={styles.movieSummary} aria-label="影片信息">
          <div className={styles.moviePoster}>
            <div className={styles.moviePosterFallback}>{movieName.slice(0, 1)}</div>
            {moviePoster ? (
              <img
                src={getPosterThumbnailUrl(moviePoster)}
                alt={`${movieName}海报`}
                loading="eager"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
          </div>
          <div className={styles.movieSummaryInfo}>
            <span className={styles.movieKicker}>NOW BOOKING</span>
            <strong>{movieName}</strong>
            <span>{title} · {time}</span>
          </div>
        </section>
      ) : null}
      <div className={styles.info}>
        <div>
          <div className={styles.kicker}>SEAT MAP</div>
          <h1>{title} · {time}</h1>
          <p>最多选择 6 个座位{query.data?.availableSeats !== undefined ? ` · 余座 ${query.data.availableSeats}` : ''}</p>
        </div>
        <span className={styles.screen}>银幕</span>
      </div>
      <Card className={styles.card}>
        <div className={styles.legend}>
          <span><i className={styles.available} />可选</span>
          <span><i className={styles.selected} />已选</span>
          <span><i className={styles.sold} />已售</span>
          <span><i className={styles.locked} />锁定</span>
        </div>
        <div className={styles.map}>
          {rows.map((row) => (
            <div className={styles.row} key={row.rowNo}>
              <small>{row.rowNo}</small>
              {row.seats.map((seat) => {
                const isSelected = selected.includes(seat.id);
                const stateClass = seat.status.toLowerCase();
                return (
                  <button
                    key={seat.id}
                    type="button"
                    aria-label={`${seat.rowNo}排${seat.seatNo}座`}
                    className={`${styles.seat} ${styles[stateClass] || ''} ${isSelected ? styles.selected : ''}`}
                    onClick={() => toggle(seat)}
                  >
                    {seat.seatNo}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
      <div className={styles.footer}>
        <div><span>已选 {selected.length} 个座位</span><strong>¥{(amountFen / 100).toFixed(2)}</strong></div>
        <Button color="primary" block loading={saving} onClick={confirm}>确认选座并锁定</Button>
      </div>
    </div>
  );
};

export default Seats;
