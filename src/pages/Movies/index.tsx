import {
  Button,
  ErrorBlock,
  NavBar,
  SearchBar,
  Skeleton,
  Tag,
} from "antd-mobile";
import { history, useLocation } from "@umijs/max";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import type { MovieSummary } from "@/types/domain";
import { getPosterThumbnailUrl } from "@/utils/poster";
import styles from "./index.module.less";

const MoviePoster: React.FC<{ movie: MovieSummary; index: number }> = ({
  movie,
  index,
}) => (
  <div
    className={[styles.moviePoster, styles["posterTone" + (index % 4)]].join(
      " ",
    )}
  >
    <div className={styles.posterFallback}>
      <strong>{movie.title.slice(0, 2)}</strong>
      <small>{movie.genre?.split(" / ")[0] || "影片"}</small>
    </div>
    {movie.posterUrl ? (
      <img
        src={getPosterThumbnailUrl(movie.posterUrl)}
        alt={movie.title + "海报"}
        loading={index < 2 ? "eager" : "lazy"}
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    ) : null}
  </div>
);

const formatReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) return "上映日期待定";
  const [year, month, day] = releaseDate.slice(0, 10).split("-");
  if (!year || !month || !day) return releaseDate;
  return `${year}年${Number(month)}月${Number(day)}日上映`;
};

const Movies: React.FC = () => {
  const location = useLocation();
  const [keyword, setKeyword] = useState("");
  const requestedStatus = new URLSearchParams(location.search).get("status");
  const isUpcoming = requestedStatus === "COMING_SOON";
  const status = isUpcoming ? "COMING_SOON" : "NOW_SHOWING";
  const sortBy = isUpcoming ? "releaseDate" : "rating";
  const sortOrder = isUpcoming ? "asc" : "desc";
  const pageTitle = isUpcoming ? "待上映" : "正在热映";

  const query = useQuery({
    queryKey: queryKeys.movies({
      keyword,
      status,
      sortBy,
      sortOrder,
      page: 1,
      size: 20,
    }),
    queryFn: () =>
      customerApi.listMovies({
        keyword,
        status,
        sortBy,
        sortOrder,
        page: 1,
        size: 20,
      }),
  });
  const movies = query.data?.records ?? [];
  const total = query.data?.total ?? 0;
  const openMovie = (movieId: string) => history.push("/movies/" + movieId);
  const openCinemaSelection = (movieId: string) =>
    history.push(`/cinemas?movieId=${encodeURIComponent(movieId)}`);

  return (
    <div className={styles.page}>
      <NavBar className={styles.navBar} onBack={() => history.push("/home")}>
        {pageTitle}
      </NavBar>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <div>
            <div className={styles.kicker}>
              {isUpcoming ? "COMING SOON" : "NOW PLAYING"}
            </div>
            <h1>{pageTitle}</h1>
          </div>
          <span className={styles.movieCount}>{total} 部</span>
        </div>
        <SearchBar
          className={styles.search}
          value={keyword}
          onChange={setKeyword}
          placeholder={isUpcoming ? "搜索待上映影片" : "搜索正在热映影片"}
          clearable
        />
      </header>

      {query.isLoading ? (
        <div className={styles.loadingList}>
          <Skeleton.Title animated />
          <Skeleton.Paragraph lineCount={5} animated />
        </div>
      ) : query.isError ? (
        <ErrorBlock
          status="default"
          title="暂时无法连接影片服务"
          description="接口恢复后会自动刷新影片列表。"
        />
      ) : !movies.length ? (
        <ErrorBlock
          status="empty"
          title={`暂无${pageTitle}影片`}
          description={keyword ? "没有找到符合搜索条件的影片。" : "影片上新后会显示在这里。"}
        />
      ) : null}

      {movies.length ? (
        <section className={styles.list} aria-label={`${pageTitle}电影列表`}>
          {movies.map((movie, index) => (
            <article
              className={styles.movieRow}
              key={movie.id}
              role="button"
              tabIndex={0}
              onClick={() => openMovie(movie.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  openMovie(movie.id);
                }
              }}
            >
              <MoviePoster movie={movie} index={index} />

              <div className={styles.movieInfo}>
                <div className={styles.movieTitleRow}>
                  <h2>{movie.title}</h2>
                  <Tag
                    className={styles.statusTag}
                    color={isUpcoming ? "warning" : "success"}
                    fill="outline"
                  >
                    {movie.status || (isUpcoming ? "即将上映" : "热映中")}
                  </Tag>
                </div>
                <p>{movie.genre || "类型待更新"}</p>
                <p>
                  {movie.durationMinutes
                    ? movie.durationMinutes + " 分钟"
                    : "时长待更新"}
                </p>
                {movie.cast ? <p className={styles.cast}>主演：{movie.cast}</p> : null}
                <span className={styles.showtimeHint}>
                  {isUpcoming
                    ? formatReleaseDate(movie.releaseDate)
                    : movie.cinemaCount
                      ? movie.cinemaCount + " 家影院"
                      : "多家影院上映"}
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
                  className={isUpcoming ? styles.detailButton : styles.buyButton}
                  size="mini"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isUpcoming) {
                      openMovie(movie.id);
                    } else {
                      openCinemaSelection(movie.id);
                    }
                  }}
                >
                  {isUpcoming ? "查看详情" : "购票"}
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
};

export default Movies;
