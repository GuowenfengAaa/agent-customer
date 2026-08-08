import { Button, Card, ErrorBlock, NavBar, Space, Tag } from "antd-mobile";
import { HeartOutline, LeftOutline, RightOutline } from "antd-mobile-icons";
import { history, useLocation, useParams } from "@umijs/max";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import BookingDateTabs from "@/components/BookingDateTabs";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import type { ShowtimeSummary } from "@/types/domain";
import { getPosterThumbnailUrl } from "@/utils/poster";
import styles from "./index.module.less";

const movieCarouselFilters = {
  page: 1,
  size: 100,
  status: "NOW_SHOWING",
  sortBy: "releaseDate" as const,
  sortOrder: "desc" as const,
};

const CinemaShowtimes: React.FC = () => {
  const { cinemaId = "" } = useParams<{ cinemaId: string }>();
  const location = useLocation();
  const movieId = new URLSearchParams(location.search).get("movieId") || "";
  const validMovieId = /^\d+$/.test(movieId) ? movieId : undefined;
  const [date, setDate] = useState(new Date());
  const [now, setNow] = useState(() => Date.now());
  const dateValue = dayjs(date).format("YYYY-MM-DD");
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const moviesQuery = useQuery({
    queryKey: queryKeys.movies(movieCarouselFilters),
    queryFn: () => customerApi.listMovies(movieCarouselFilters),
  });
  const carouselMovies = React.useMemo(
    () => moviesQuery.data?.records || [],
    [moviesQuery.data?.records]
  );
  const matchedMovieIndex = carouselMovies.findIndex(
    (item) => item.id === validMovieId
  );
  const currentMovieIndex = matchedMovieIndex >= 0 ? matchedMovieIndex : 0;
  const activeMovieId = validMovieId || carouselMovies[0]?.id;
  const canSwitchMovie = carouselMovies.length > 1;
  const query = useQuery({
    queryKey: queryKeys.showtimes({
      cinemaId,
      movieId: activeMovieId,
      date: dateValue,
    }),
    queryFn: () =>
      customerApi.listShowtimes({
        cinemaId,
        movieId: activeMovieId,
        date: dateValue,
      }),
    enabled: /^\d+$/.test(cinemaId) && Boolean(activeMovieId),
  });
  const showtimes = [...(query.data?.showtimes || [])]
    .filter((showtime) => dayjs(showtime.startAt).valueOf() > now)
    .sort(
      (a: ShowtimeSummary, b: ShowtimeSummary) =>
        dayjs(a.startAt).valueOf() - dayjs(b.startAt).valueOf()
    );
  const cinemaName = query.data?.cinema?.name || "影院场次";
  const movie = validMovieId
    ? carouselMovies[matchedMovieIndex]
    : carouselMovies[0];
  const wishlistMutation = useWishlistToggle(
    movie?.id || activeMovieId || "",
    Boolean(movie?.wanted),
  );
  const movieName = movie?.title || query.data?.movie?.name;
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
  const switchMovie = (direction: -1 | 1) => {
    if (!canSwitchMovie) return;
    const nextIndex =
      (currentMovieIndex + direction + carouselMovies.length) %
      carouselMovies.length;
    const nextMovie = carouselMovies[nextIndex];
    if (!nextMovie) return;

    const searchParams = new URLSearchParams(location.search);
    searchParams.set("movieId", nextMovie.id);
    history.replace(
      `/cinemas/${cinemaId}/showtimes?${searchParams.toString()}`
    );
  };
  const backPath = activeMovieId
    ? `/cinemas?movieId=${encodeURIComponent(activeMovieId)}`
    : "/cinemas";

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push(backPath)}>场次选择</NavBar>
      {activeMovieId ? (
        <section className={styles.movieSummary} aria-label="影片轮播">
          <button className={styles.carouselArrow} type="button" aria-label="Previous movie" title="Previous movie" disabled={!canSwitchMovie} onClick={() => switchMovie(-1)}>
            <LeftOutline />
          </button>
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
            <div className={styles.movieKickerRow}>
              <div className={styles.movieKicker}>MOVIE INTRO</div>
              {carouselMovies.length ? (
                <span>{currentMovieIndex + 1}/{carouselMovies.length}</span>
              ) : null}
            </div>
            <strong>{movieName || "正在加载影片"}</strong>
            <span className={styles.movieSubtitle}>{movieIntroSubtitle}</span>
            <div className={styles.movieGenreTags}>
              {movieGenreTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <p>
              {movieReleaseDate} - {movie?.durationMinutes || query.data?.movie?.durationMinutes || 120} &#20998;&#38047;
            </p>
            <div className={styles.movieRating}>
              <em>
                {movie?.score?.toFixed(1) || "--"}
                <small>&#20998;</small>
              </em>
              <span>&#35266;&#20247;&#35780;&#20998;</span>
            </div>
            <Button
              className={`${styles.wantButton} ${movie?.wanted ? styles.wantButtonActive : ""}`}
              fill="none"
              loading={wishlistMutation.isPending}
              disabled={!activeMovieId}
              onClick={(event) => {
                event.stopPropagation();
                wishlistMutation.mutate();
              }}
            >
              <HeartOutline />
              {movie?.wanted ? "已想看" : "想看"}
            </Button>
          </div>
          <button className={styles.carouselArrow} type="button" aria-label="Next movie" title="Next movie" disabled={!canSwitchMovie} onClick={() => switchMovie(1)}>
            <RightOutline />
          </button>
        </section>
      ) : null}
      <BookingDateTabs value={date} onChange={setDate} />
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
      {query.isLoading || moviesQuery.isLoading ? (
        <Card className={styles.stateCard}>
          <strong>正在加载可售场次</strong>
          <p>只展示当前影院实际存在的影厅和时间。</p>
        </Card>
      ) : null}
      {query.isError || moviesQuery.isError ? (
        <ErrorBlock
          status="default"
          title="场次暂时无法加载"
          description="请稍后重试，或返回影院列表切换日期。"
        />
      ) : null}
      {!query.isLoading && !moviesQuery.isLoading && !query.isError && !moviesQuery.isError && !showtimes.length ? (
        <Card className={styles.emptyCard}>
          <strong>{movieName ? `当天暂无${movieName}可售场次` : "当天暂无可售场次"}</strong>
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
                    activeMovieId
                      ? `/showtimes/${showtime.id}/seats?movieId=${encodeURIComponent(activeMovieId)}`
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
