import { Button, Card, ErrorBlock, NavBar, Skeleton } from "antd-mobile";
import { HeartOutline, RightOutline } from "antd-mobile-icons";
import { history, useLocation } from "@umijs/max";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import BookingDateTabs from "@/components/BookingDateTabs";
import MobileCard from "@/components/MobileCard";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import { useAppStore } from "@/stores/useAppStore";
import type { CinemaSummary, ShowtimeSummary } from "@/types/domain";
import { getPosterThumbnailUrl } from "@/utils/poster";
import styles from "./index.module.less";

interface CinemaWithShowtimes {
  cinema: CinemaSummary;
  showtimes: ShowtimeSummary[];
}

const getPriceFen = (showtimes: ShowtimeSummary[], fallback?: number) => {
  const prices = showtimes
    .map((showtime) => showtime.priceFen)
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : fallback;
};

const Cinemas: React.FC = () => {
  const location = useLocation();
  const city = useAppStore((state) => state.city);
  const latitude = useAppStore((state) => state.latitude);
  const longitude = useAppStore((state) => state.longitude);
  const movieId = new URLSearchParams(location.search).get("movieId") || "";
  const [date, setDate] = React.useState(new Date());
  const dateValue = dayjs(date).format("YYYY-MM-DD");
  const movieQuery = useQuery({
    queryKey: queryKeys.movie(movieId),
    queryFn: () => customerApi.getMovie(movieId),
    enabled: Boolean(movieId),
  });
  const query = useQuery<CinemaWithShowtimes[]>({
    queryKey: queryKeys.cinemas({
      city,
      movieId,
      date: dateValue,
      latitude,
      longitude,
    }),
    queryFn: async () => {
      const result =
        Number.isFinite(latitude) && Number.isFinite(longitude)
          ? await customerApi.listNearbyCinemas(
              latitude as number,
              longitude as number,
              20
            )
          : await customerApi.listCinemas({ page: 1, size: 20 });
      const records = result.records || [];

      if (!movieId) {
        return records.map((cinema) => ({ cinema, showtimes: [] }));
      }

      const matches = await Promise.all(
        records.map(async (cinema): Promise<CinemaWithShowtimes | null> => {
          try {
            const showtimeResult = await customerApi.listShowtimes({
              movieId,
              cinemaId: cinema.id,
              date: dateValue,
            });
            return showtimeResult.showtimes.length
              ? { cinema, showtimes: showtimeResult.showtimes }
              : null;
          } catch {
            return null;
          }
        })
      );

      return matches.filter((item): item is CinemaWithShowtimes =>
        Boolean(item)
      );
    },
  });
  const cinemas = query.data || [];
  const movie = movieQuery.data;
  const movieGenreTags = (movie?.genre || "类型待更新")
    .split(/\s*[\/·,，]\s*/)
    .filter(Boolean)
    .slice(0, 3);
  const movieReleaseDate = movie?.releaseDate
    ? dayjs(movie.releaseDate).format("YYYY-MM-DD")
    : "上映日期待定";
  const movieIntroSubtitle =
    movie?.status === "即将上映" || movie?.status === "COMING_SOON"
      ? "COMING SOON"
      : "NOW SHOWING";

  return (
    <div className={styles.page}>
      <NavBar
        onBack={() => history.push(movieId ? `/movies/${movieId}` : "/home")}
      >
        影院
      </NavBar>
      {movieId ? (
        <section className={styles.movieSummary} aria-label="影片信息">
          <div className={styles.moviePoster}>
            <div className={styles.moviePosterFallback}>
              {movie?.title?.slice(0, 1) || "影"}
            </div>
            {movie?.posterUrl ? (
              <img
                src={getPosterThumbnailUrl(movie.posterUrl)}
                alt={`${movie.title}海报`}
                loading="eager"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
          <div className={styles.movieSummaryInfo}>
            <div className={styles.movieKicker}>MOVIE INTRO</div>
            <strong>{movie?.title || "正在加载影片"}</strong>
            <span className={styles.movieSubtitle}>{movieIntroSubtitle}</span>
            <div className={styles.movieGenreTags}>
              {movieGenreTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p>
              {movieReleaseDate} · {movie?.durationMinutes || 120} 分钟
            </p>
            <div className={styles.movieRating}>
              <em>
                {movie?.score?.toFixed(1) || "—"}
                <small>分</small>
              </em>
              <span>观众评分</span>
            </div>
            <Button
              className={styles.wantButton}
              fill="none"
              onClick={(event) => event.stopPropagation()}
            >
              <HeartOutline />
              想看
            </Button>
          </div>
          <RightOutline className={styles.movieArrow} />
        </section>
      ) : null}
      {movieId ? <BookingDateTabs value={date} onChange={setDate} /> : null}
      <div className={styles.header}>
        <div>
          <div className={styles.kicker}>NEARBY CINEMAS</div>
          <h1>{movieId ? "选择影院" : "附近的影院"}</h1>
          <p>
            {movieId ? `${city} · ${dateValue} 可售场次` : `当前定位：${city}`}
          </p>
        </div>
      </div>
      {query.isLoading || movieQuery.isLoading ? (
        <Card className={styles.stateCard}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={3} animated />
        </Card>
      ) : null}
      {query.isError ? (
        <ErrorBlock
          status="default"
          title="影院服务暂时不可用"
          description="请稍后重试，或返回影片详情。"
        />
      ) : null}
      {!query.isLoading && !query.isError && !cinemas.length ? (
        <Card className={styles.emptyCard}>
          <strong>{movieId ? "当天暂无可售场次" : "附近暂时没有影院"}</strong>
          <p>
            {movieId
              ? "可以切换日期查看其他场次。"
              : "请稍后刷新或扩大定位范围。"}
          </p>
        </Card>
      ) : null}
      <div className={styles.list}>
        {cinemas.map(({ cinema, showtimes }) => {
          const sortedShowtimes = [...showtimes].sort(
            (a, b) => dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
          );
          const minPrice = getPriceFen(sortedShowtimes, cinema.minPrice);
          const sessionPreview = sortedShowtimes
            .slice(0, 3)
            .map((showtime) => dayjs(showtime.startAt).format("HH:mm"));
          const cinemaPath = movieId
            ? `/cinemas/${cinema.id}/showtimes?movieId=${encodeURIComponent(
                movieId
              )}`
            : `/cinemas/${cinema.id}/showtimes`;

          return (
            <MobileCard
              key={cinema.id}
              title={cinema.name}
              meta={
                cinema.distance !== undefined
                  ? `${cinema.distance.toFixed(1)} km`
                  : "附近"
              }
              onClick={() => history.push(cinemaPath)}
            >
              <p>{cinema.address || cinema.district || "地址待更新"}</p>
              {movieId ? (
                <div className={styles.sessionSummary}>
                  <div>
                    <strong>{showtimes.length} 场可选</strong>
                    <span>{sessionPreview.join("  ·  ") || "场次加载中"}</span>
                  </div>
                  <em>
                    {minPrice
                      ? `¥${(minPrice / 100).toFixed(0)} 起`
                      : "价格待定"}
                  </em>
                </div>
              ) : (
                <div className={styles.tags}>
                  {(cinema.hallTypes || ["普通厅"]).map((type) => (
                    <span key={type}>{type}</span>
                  ))}
                </div>
              )}
            </MobileCard>
          );
        })}
      </div>
    </div>
  );
};

export default Cinemas;
