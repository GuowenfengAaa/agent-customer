import { Button, Card, ErrorBlock, NavBar, Space, Tag } from "antd-mobile";
import { history, useLocation, useParams } from "@umijs/max";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useState } from "react";
import BookingDateTabs from "@/components/BookingDateTabs";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import type { ShowtimeSummary } from "@/types/domain";
import { getPosterThumbnailUrl } from "@/utils/poster";
import styles from "./index.module.less";

const CinemaShowtimes: React.FC = () => {
  const { cinemaId = "" } = useParams<{ cinemaId: string }>();
  const location = useLocation();
  const movieId = new URLSearchParams(location.search).get("movieId") || "";
  const validMovieId = /^\d+$/.test(movieId) ? movieId : undefined;
  const [date, setDate] = useState(new Date());
  const dateValue = dayjs(date).format("YYYY-MM-DD");
  const query = useQuery({
    queryKey: queryKeys.showtimes({
      cinemaId,
      movieId: validMovieId,
      date: dateValue,
    }),
    queryFn: () =>
      customerApi.listShowtimes({
        cinemaId,
        movieId: validMovieId,
        date: dateValue,
      }),
    enabled: /^\d+$/.test(cinemaId) && (!movieId || Boolean(validMovieId)),
  });
  const showtimes = [...(query.data?.showtimes || [])].sort(
    (a: ShowtimeSummary, b: ShowtimeSummary) =>
      dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
  );
  const cinemaName = query.data?.cinema?.name || "影院场次";
  const movie = query.data?.movie;
  const movieName = movie?.name;
  const backPath = movieId
    ? `/cinemas?movieId=${encodeURIComponent(movieId)}`
    : "/cinemas";

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push(backPath)}>场次选择</NavBar>
      <BookingDateTabs value={date} onChange={setDate} />
      {movieId ? (
        <section className={styles.movieSummary} aria-label="影片信息">
          <div className={styles.moviePoster}>
            <div className={styles.moviePosterFallback}>
              {movieName?.slice(0, 1) || "影"}
            </div>
            {movie?.posterUrl ? (
              <img
                src={getPosterThumbnailUrl(movie.posterUrl)}
                alt={`${movieName || "影片"}海报`}
                loading="eager"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
          <div className={styles.movieSummaryInfo}>
            <span className={styles.movieKicker}>MOVIE SHOWTIMES</span>
            <strong>{movieName || "正在加载影片"}</strong>
            <span>{movie?.durationMinutes ? `${movie.durationMinutes} 分钟` : "可售场次"}</span>
          </div>
        </section>
      ) : null}
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>SHOWTIMES</div>
          <h1>{cinemaName}</h1>
          <p>
            {movieName
              ? `${movieName} · 仅展示该影片场次`
              : "选择日期和合适的场次"}
          </p>
        </div>
      </div>
      {query.isLoading ? (
        <Card className={styles.stateCard}>
          <strong>正在加载可售场次</strong>
          <p>只展示当前影院实际存在的影厅和时间。</p>
        </Card>
      ) : null}
      {query.isError ? (
        <ErrorBlock
          status="default"
          title="场次暂时无法加载"
          description="请稍后重试，或返回影院列表切换日期。"
        />
      ) : null}
      {!query.isLoading && !query.isError && !showtimes.length ? (
        <Card className={styles.emptyCard}>
          <strong>当天暂无可售场次</strong>
          <p>可以切换日期，或返回影院列表选择其他影院。</p>
        </Card>
      ) : null}
      <div className={styles.list}>
        {showtimes.map((showtime) => (
          <Card key={showtime.id} className={styles.showtimeCard}>
            <div className={styles.timeRow}>
              <strong>{dayjs(showtime.startAt).format("HH:mm")}</strong>
              <span>{showtime.hallName || "普通厅"}</span>
              <em>¥{(showtime.priceFen / 100).toFixed(0)}</em>
            </div>
            <div className={styles.metaRow}>
              <Space wrap>
                <Tag color="primary">{showtime.hallType || "普通厅"}</Tag>
                {showtime.language ? <span>{showtime.language}</span> : null}
                <span>余 {showtime.remainingSeats ?? 0} 座</span>
              </Space>
              <Button
                size="small"
                color="primary"
                onClick={() =>
                  history.push(
                    validMovieId
                      ? `/showtimes/${showtime.id}/seats?movieId=${encodeURIComponent(validMovieId)}`
                      : `/showtimes/${showtime.id}/seats`
                  )
                }
              >
                选座
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CinemaShowtimes;
