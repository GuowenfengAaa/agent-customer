import { ErrorBlock, NavBar, SearchBar, Skeleton } from "antd-mobile";
import { history } from "@umijs/max";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import type { MovieSummary } from "@/types/domain";
import { getPosterThumbnailUrl } from "@/utils/poster";
import styles from "./index.module.less";

const PosterImage: React.FC<{
  movie: MovieSummary;
  className?: string;
  priority?: boolean;
}> = ({ movie, className, priority = false }) => (
  <div className={`${styles.poster} ${className || ""}`}>
    <div className={styles.posterFallback}>
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
  </div>
);

const Search: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: queryKeys.searchHistory(10),
    queryFn: () => customerApi.listSearchHistory(10),
  });

  const recordHistoryMutation = useMutation({
    mutationFn: (value: string) => customerApi.recordSearchHistory(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["searchHistory"] });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => customerApi.clearSearchHistory(),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.searchHistory(10), []);
    },
  });

  const historyKeywords = useMemo(
    () => (historyQuery.data || []).map((item) => item.keyword).filter(Boolean).slice(0, 6),
    [historyQuery.data],
  );

  const topQuery = useQuery({
    queryKey: queryKeys.movies({
      section: "search-top10",
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

  const searchQuery = useQuery({
    queryKey: queryKeys.movies({
      section: "search-result",
      keyword: submittedKeyword,
      page: 1,
      size: 10,
    }),
    queryFn: () =>
      customerApi.listMovies({
        keyword: submittedKeyword,
        sortBy: "rating",
        sortOrder: "desc",
        page: 1,
        size: 10,
      }),
    enabled: Boolean(submittedKeyword),
  });

  const topMovies = topQuery.data?.records || [];
  const searchMovies = searchQuery.data?.records || [];
  const popularKeywords = useMemo(
    () => topMovies.slice(0, 6).map((movie) => movie.title),
    [topMovies],
  );

  const submit = (value = keyword) => {
    const nextKeyword = value.trim();
    setKeyword(nextKeyword);
    setSubmittedKeyword(nextKeyword);
    if (!nextKeyword) return;

    recordHistoryMutation.mutate(nextKeyword);
  };

  const clearHistory = () => {
    clearHistoryMutation.mutate();
  };

  const openMovie = (movieId: string) => history.push(`/movies/${movieId}`);

  return (
    <div className={styles.page}>
      <NavBar className={styles.navBar} onBack={() => history.push("/home")}>
        电影搜索
      </NavBar>

      <header className={styles.searchHeader}>
        <div className={styles.searchRow}>
          <SearchBar
            className={styles.searchBar}
            value={keyword}
            onChange={setKeyword}
            onSearch={submit}
            placeholder="搜索影片、类型或影院"
            clearable
          />
          <button
            className={styles.submitButton}
            type="button"
            onClick={() => submit()}
          >
            搜索
          </button>
        </div>
        <p>找到你想看的电影，直接查看详情或购票</p>
      </header>

      {!submittedKeyword ? (
        <section className={styles.discoverySection}>
          {historyKeywords.length ? (
            <div className={styles.keywordGroup}>
              <div className={styles.groupTitle}>
                <strong>搜索历史</strong>
                <button type="button" onClick={clearHistory}>清空</button>
              </div>
              <div className={styles.keywordList}>
                {historyKeywords.map((item) => (
                  <button key={item} type="button" onClick={() => submit(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className={styles.keywordGroup}>
            <div className={styles.groupTitle}><strong>大家都在搜</strong></div>
            <div className={styles.keywordList}>
              {(popularKeywords.length
                ? popularKeywords
                : ["正在热映", "高分电影", "待上映"]
              ).map((item) => (
                <button key={item} type="button" onClick={() => submit(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {submittedKeyword ? (
        <section className={styles.resultSection}>
          <div className={styles.sectionTitle}>
            <div>
              <span className={styles.eyebrow}>SEARCH RESULTS</span>
              <h1>“{submittedKeyword}”</h1>
            </div>
            <span>{searchQuery.data?.total || 0} 部</span>
          </div>
          {searchQuery.isLoading ? (
            <div className={styles.loadingCard}>
              <Skeleton.Title animated />
              <Skeleton.Paragraph lineCount={2} animated />
            </div>
          ) : searchQuery.isError ? (
            <ErrorBlock status="default" title="搜索暂时不可用" description="请稍后再试。" />
          ) : !searchMovies.length ? (
            <div className={styles.emptyCard}>没有找到匹配的影片，试试其他关键词。</div>
          ) : (
            <div className={styles.searchScroller}>
              {searchMovies.map((movie, index) => (
                <button
                  key={movie.id}
                  type="button"
                  className={styles.searchMovie}
                  onClick={() => openMovie(movie.id)}
                >
                  <PosterImage movie={movie} priority={index < 2} />
                  <strong>{movie.title}</strong>
                  {movie.score ? <span>{movie.score.toFixed(1)} 分</span> : <span>暂无评分</span>}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className={styles.topSection}>
        <div className={styles.sectionTitle}>
          <div>
            <span className={styles.eyebrow}>TOP RATED</span>
            <h1>评分最高的 10 部电影</h1>
          </div>
          <span className={styles.fireMark}>TOP 10</span>
        </div>
        {topQuery.isLoading ? (
          <div className={styles.loadingCard}>
            <Skeleton.Title animated />
            <Skeleton.Paragraph lineCount={5} animated />
          </div>
        ) : topQuery.isError ? (
          <ErrorBlock status="default" title="榜单暂时不可用" description="影片服务恢复后会自动更新。" />
        ) : (
          <div className={styles.topList}>
            {topMovies.map((movie, index) => (
              <button
                key={movie.id}
                type="button"
                className={styles.topRow}
                onClick={() => openMovie(movie.id)}
              >
                <span className={`${styles.rank} ${index < 3 ? styles.rankHighlight : ""}`}>
                  {index + 1}
                </span>
                <PosterImage movie={movie} priority={index < 2} className={styles.topPoster} />
                <span className={styles.topInfo}>
                  <strong>{movie.title}</strong>
                  <small>{movie.genre || "类型待更新"}</small>
                  <small>{movie.durationMinutes ? `${movie.durationMinutes} 分钟` : "时长待更新"}</small>
                </span>
                <span className={styles.topScore}>{movie.score ? movie.score.toFixed(1) : "--"}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Search;
