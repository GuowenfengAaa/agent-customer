import {
  CouponOutline,
  EnvironmentOutline,
  FireFill,
  MovieOutline,
  UnorderedListOutline,
  UserSetOutline,
} from "antd-mobile-icons";
import { SearchBar } from "antd-mobile";
import { history } from "@umijs/max";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useAppStore } from "@/stores/useAppStore";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import type { MovieSummary } from "@/types/domain";
import { getPosterThumbnailUrl } from "@/utils/poster";
import styles from "./index.module.less";

const fallbackPromoMovies: MovieSummary[] = [
  {
    id: "demo-1",
    title: "流浪地球 3",
    genre: "科幻 / 冒险",
    score: 9.2,
  },
  {
    id: "demo-2",
    title: "夏日放映厅",
    genre: "剧情 / 爱情",
    score: 8.6,
  },
  {
    id: "demo-3",
    title: "午夜列车",
    genre: "悬疑 / 惊悚",
    score: 8.1,
  },
];

const Poster: React.FC<{
  movie: MovieSummary;
  index: number;
  compact?: boolean;
  priority?: boolean;
  showScore?: boolean;
}> = ({ movie, index, compact, priority = false, showScore = true }) => (
  <div className={compact ? styles.compactPoster : styles.poster}>
    <div className={`${styles.posterArt} ${styles[`posterTone${index % 4}`]}`}>
      <strong>{movie.title.slice(0, 2)}</strong>
      <small>{movie.genre?.split(" / ")[0] || "影片"}</small>
    </div>
    {movie.posterUrl ? (
      <img
        src={getPosterThumbnailUrl(movie.posterUrl)}
        alt={`${movie.title}海报`}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    ) : null}
    {showScore && movie.score ? (
      <span className={styles.posterScore}>{movie.score.toFixed(1)}</span>
    ) : null}
  </div>
);

const MovieSectionState: React.FC<{
  loading?: boolean;
  error?: boolean;
  emptyText: string;
}> = ({ loading, error, emptyText }) => (
  <div className={`${styles.sectionState} ${loading ? styles.sectionLoading : ""}`}>
    {loading ? "影片加载中..." : error ? "影片服务暂时不可用" : emptyText}
  </div>
);

const formatReleaseDate = (releaseDate?: string) => {
  if (!releaseDate) return "上映日期待定";
  const [, month, day] = releaseDate.slice(0, 10).split("-");
  if (!month || !day) return releaseDate;
  return `${Number(month)}月${Number(day)}日上映`;
};

const getWelcomeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  return "晚上好";
};

const Home: React.FC = () => {
  const { city, setMode, locationStatus, locateCurrentPosition } = useAppStore();
  const hotQuery = useQuery({
    queryKey: queryKeys.movies({
      section: "hot",
      status: "NOW_SHOWING",
      sortBy: "rating",
      sortOrder: "desc",
      page: 1,
      size: 10,
    }),
    queryFn: () =>
      customerApi.listMovies({
        status: "NOW_SHOWING",
        sortBy: "rating",
        sortOrder: "desc",
        page: 1,
        size: 10,
      }),
  });
  const upcomingQuery = useQuery({
    queryKey: queryKeys.movies({
      section: "upcoming",
      status: "COMING_SOON",
      sortBy: "releaseDate",
      sortOrder: "asc",
      page: 1,
      size: 10,
    }),
    queryFn: () =>
      customerApi.listMovies({
        status: "COMING_SOON",
        sortBy: "releaseDate",
        sortOrder: "asc",
        page: 1,
        size: 10,
      }),
  });
  const mustSeeQuery = useQuery({
    queryKey: queryKeys.movies({
      section: "must-see",
      status: "NOW_SHOWING",
      sortBy: "releaseDate",
      sortOrder: "desc",
      page: 1,
      size: 3,
    }),
    queryFn: () =>
      customerApi.listMovies({
        status: "NOW_SHOWING",
        sortBy: "releaseDate",
        sortOrder: "desc",
        page: 1,
        size: 3,
      }),
  });
  const cinemaQuery = useQuery({
    queryKey: queryKeys.cinemas({ city }),
    queryFn: () => customerApi.listCinemas({ page: 1, size: 20 }),
  });

  const hotMovies = hotQuery.data?.records ?? [];
  const upcomingMovies = upcomingQuery.data?.records ?? [];
  const mustSeeMovies = mustSeeQuery.data?.records ?? [];
  const promoMovies = hotMovies.length ? hotMovies : fallbackPromoMovies;
  const hotTotal = hotQuery.data?.total ?? 0;
  const upcomingTotal = upcomingQuery.data?.total ?? 0;
  const cinemas = cinemaQuery.data?.records?.length
    ? cinemaQuery.data.records.slice(0, 2)
    : [];
  const nearby = cinemas.length
    ? cinemas
    : [
        {
          id: "cinema-1",
          name: "万达影城 · 五角场店",
          address: "IMAX · 杜比",
          distance: 2.1,
          minPrice: 45,
        },
        {
          id: "cinema-2",
          name: "百丽宫影城 · 环贸店",
          address: "杜比 · 情侣厅",
          distance: 3.1,
          minPrice: 39,
        },
      ];

  const goAgent = () => {
    setMode("AI");
    history.push("/agent");
  };
  const openMovie = (movieId: string) => history.push(`/movies/${movieId}`);
  const buyMovie = (movieId: string) => {
    history.push(`/cinemas?movieId=${encodeURIComponent(movieId)}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.homeSearchRow}>
        <button
          className={styles.homeCity}
          type="button"
          aria-label="重新定位"
          aria-busy={locationStatus === "locating"}
          title="点击重新定位"
          onClick={locateCurrentPosition}
        >
          <span>{locationStatus === "locating" ? "定位中" : city}</span>
          <span className={styles.homeCityChevron}>⌄</span>
        </button>
        <SearchBar
          placeholder="搜索影片、类型或影院"
          className={styles.search}
          onFocus={() => history.push("/search")}
        />
      </div>

      <section className={styles.homePromo} aria-label="首页欢迎">
        <div className={styles.welcomeCopy}>
          <span>WELCOME</span>
          <strong>{getWelcomeGreeting()}，今天想看什么？</strong>
          <small>
            {hotTotal > 0
              ? `${city}正在热映 ${hotTotal} 部好片`
              : "热门影片与附近影院已经为你准备好"}
          </small>
        </div>
        <div className={styles.promoPosters} aria-hidden="true">
          {promoMovies.slice(0, 3).map((movie, index) => (
            <Poster
              key={movie.id}
              movie={movie}
              index={index}
              compact
              priority={index < 2}
            />
          ))}
        </div>
      </section>

      <div className={styles.serviceGrid}>
        <button
          type="button"
          onClick={() =>
            document.getElementById("hotBand")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <span><FireFill /></span>
          热映
        </button>
        <button
          type="button"
          onClick={() =>
            document.getElementById("upcomingBand")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <span><CouponOutline /></span>
          待上映
        </button>
        <button type="button" onClick={() => history.push("/cinemas")}>
          <span><EnvironmentOutline /></span>
          附近影院
        </button>
        <button type="button" onClick={() => history.push("/me/orders")}>
          <span><UnorderedListOutline /></span>
          我的订单
        </button>
        <button type="button" onClick={() => history.push("/me")}>
          <span><UserSetOutline /></span>
          个人信息
        </button>
      </div>

      <section className={styles.homeBand} id="hotBand">
        <div className={styles.bandHead}>
          <div>
            <h2>正在热映</h2>
            <p>今天 {city} · 按评分推荐</p>
          </div>
          <button
            type="button"
            onClick={() => history.push("/movies?status=NOW_SHOWING")}
          >
            全部 {hotTotal} 部 ›
          </button>
        </div>
        {hotQuery.isLoading || hotQuery.isError || !hotMovies.length ? (
          <MovieSectionState
            loading={hotQuery.isLoading}
            error={hotQuery.isError}
            emptyText="暂无正在热映的影片"
          />
        ) : (
          <div className={styles.posterScroller}>
            {hotMovies.map((movie, index) => (
              <div key={movie.id} className={styles.compactMovie}>
                <button
                  type="button"
                  className={styles.compactMovieMain}
                  onClick={() => openMovie(movie.id)}
                >
                  <Poster movie={movie} index={index} priority={index < 2} />
                  <strong>{movie.title}</strong>
                  <span>¥{movie.score ? Math.round(movie.score * 5) : 35} 起</span>
                </button>
                <button
                  type="button"
                  className={styles.posterBuyButton}
                  onClick={() => buyMovie(movie.id)}
                >
                  购票
                </button>
              </div>
            ))}
            {hotTotal > hotMovies.length ? (
              <button
                type="button"
                className={styles.viewAllMovie}
                onClick={() => history.push("/movies?status=NOW_SHOWING")}
                aria-label={`查看全部 ${hotTotal} 部正在热映电影`}
              >
                <span className={styles.viewAllPoster}>
                  <strong>查看全部</strong>
                  <small>{hotTotal} 部</small>
                  <i>›</i>
                </span>
                <strong>更多热映电影</strong>
                <span>完整片单</span>
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className={styles.homeBand} id="upcomingBand">
        <div className={styles.bandHead}>
          <div>
            <h2>待上映</h2>
            <p>即将与大银幕见面</p>
          </div>
          <button
            type="button"
            onClick={() => history.push("/movies?status=COMING_SOON")}
          >
            全部 {upcomingTotal} 部 ›
          </button>
        </div>
        {upcomingQuery.isLoading || upcomingQuery.isError || !upcomingMovies.length ? (
          <MovieSectionState
            loading={upcomingQuery.isLoading}
            error={upcomingQuery.isError}
            emptyText="暂无待上映影片"
          />
        ) : (
          <div className={styles.posterScroller}>
            {upcomingMovies.map((movie, index) => (
              <div key={movie.id} className={styles.compactMovie}>
                <button
                  type="button"
                  className={styles.compactMovieMain}
                  onClick={() => openMovie(movie.id)}
                >
                  <Poster
                    movie={movie}
                    index={index}
                    priority={index < 2}
                    showScore={false}
                  />
                  <strong>{movie.title}</strong>
                  <span className={styles.releaseDate}>{formatReleaseDate(movie.releaseDate)}</span>
                </button>
                <button
                  type="button"
                  className={styles.posterDetailButton}
                  onClick={() => openMovie(movie.id)}
                >
                  查看详情
                </button>
              </div>
            ))}
            {upcomingTotal > upcomingMovies.length ? (
              <button
                type="button"
                className={styles.viewAllMovie}
                onClick={() => history.push("/movies?status=COMING_SOON")}
                aria-label={`查看全部 ${upcomingTotal} 部待上映电影`}
              >
                <span className={styles.viewAllPoster}>
                  <strong>查看全部</strong>
                  <small>{upcomingTotal} 部</small>
                  <i>›</i>
                </span>
                <strong>更多待上映电影</strong>
                <span>上映日历</span>
              </button>
            ) : null}
          </div>
        )}
      </section>

      <section className={styles.homeBand} id="mustSeeBand">
        <div className={styles.bandHead}>
          <div>
            <h2>必看电影</h2>
            <p>最新上映的三部佳片</p>
          </div>
          <span>每日更新</span>
        </div>
        {mustSeeQuery.isLoading || mustSeeQuery.isError || !mustSeeMovies.length ? (
          <MovieSectionState
            loading={mustSeeQuery.isLoading}
            error={mustSeeQuery.isError}
            emptyText="暂无必看影片"
          />
        ) : (
          <div className={`${styles.posterScroller} ${styles.mustSeeScroller}`}>
            {mustSeeMovies.map((movie, index) => (
              <div
                key={movie.id}
                className={`${styles.compactMovie} ${styles.mustSeeMovie}`}
              >
                <button
                  type="button"
                  className={styles.compactMovieMain}
                  onClick={() => openMovie(movie.id)}
                >
                  <Poster movie={movie} index={index} priority={index < 2} />
                  <strong>{movie.title}</strong>
                  <span>
                    {movie.score ? `${movie.score.toFixed(1)} 分` : "口碑待揭晓"} · {formatReleaseDate(movie.releaseDate).replace("上映", "")}
                  </span>
                </button>
                <div className={styles.mustSeeActionRow}>
                  <button type="button" onClick={() => openMovie(movie.id)}>详情</button>
                  <button type="button" onClick={() => buyMovie(movie.id)}>购票</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.homeBand}>
        <div className={styles.bandHead}>
          <div>
            <h2>附近影院</h2>
            <p>按当前位置由近到远</p>
          </div>
          <button type="button" onClick={() => history.push("/cinemas")}>查看全部 ›</button>
        </div>
        <div className={styles.nearbyList}>
          {nearby.map((cinema) => (
            <button
              className={styles.nearbyRow}
              key={cinema.id}
              type="button"
              onClick={() => history.push(`/cinemas/${cinema.id}/showtimes`)}
            >
              <div>
                <strong>{cinema.name}</strong>
                <span>
                  {cinema.address || "特色影厅"} · {cinema.distance ? `${cinema.distance} km` : "附近"}
                </span>
              </div>
              <em>¥{cinema.minPrice || 39} 起</em>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.homeBand}>
        <div className={styles.bandHead}>
          <h2>妙语智能购票</h2>
          <button type="button" onClick={goAgent}>进入对话 ›</button>
        </div>
        <button className={styles.aiBanner} type="button" onClick={goAgent}>
          <span className={styles.aiBannerIcon}><MovieOutline /></span>
          <span>
            <strong>把观影需求交给妙语</strong>
            <small>告诉我时间、位置和预算，帮你筛选合适场次</small>
          </span>
          <span>›</span>
        </button>
      </section>
    </div>
  );
};

export default Home;
