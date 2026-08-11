import { Button, Card, Space, Toast } from "antd-mobile";
import { HeartOutline, LeftOutline, RightOutline } from "antd-mobile-icons";
import { history, useParams } from "@umijs/max";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import { getPosterThumbnailUrl } from "@/utils/poster";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import { getToken } from "@/services/storage";
import { navigateAuthenticated, runAuthenticated } from "@/utils/authNavigation";
import styles from "./index.module.less";

const movieCarouselFilters = {
  page: 1,
  size: 100,
  status: "NOW_SHOWING" as const,
  sortBy: "releaseDate" as const,
  sortOrder: "desc" as const,
};

const MovieDetail: React.FC = () => {
  const { movieId = "" } = useParams<{ movieId: string }>();
  const queryClient = useQueryClient();
  const isLoggedIn = Boolean(getToken());
  const [changingReviewId, setChangingReviewId] = React.useState<string>();
  const [togglingWatched, setTogglingWatched] = React.useState(false);
  const query = useQuery({
    queryKey: queryKeys.movie(movieId),
    queryFn: () => customerApi.getMovie(movieId),
    enabled: Boolean(movieId),
  });
  const moviesQuery = useQuery({
    queryKey: queryKeys.movies(movieCarouselFilters),
    queryFn: () => customerApi.listMovies(movieCarouselFilters),
    enabled: Boolean(movieId),
  });
  const movie = query.data || {
    title: "影片详情",
    genre: "类型待更新",
    durationMinutes: 0,
    score: undefined,
    posterUrl: undefined,
    description: undefined,
    cast: undefined,
    releaseDate: undefined,
    status: undefined,
    wanted: false,
  };
  const genreTags = (movie.genre || "类型待更新")
    .split(/\s*[\/·,，]\s*/)
    .filter(Boolean)
    .slice(0, 3);
  const castMembers = (movie.cast || "")
    .split(/\s*[,，]\s*/)
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 12);
  const releaseDate = movie.releaseDate
    ? dayjs(movie.releaseDate).format("YYYY-MM-DD")
    : "上映日期待定";
  const duration = movie.durationMinutes || 120;
  const introSubtitle =
    movie.status === "即将上映" || movie.status === "COMING_SOON"
      ? "COMING SOON"
      : "NOW SHOWING";
  const carouselMovies = React.useMemo(() => {
    const records = moviesQuery.data?.records || [];
    const currentMovie = query.data;
    if (currentMovie && !records.some((item) => item.id === currentMovie.id)) {
      return [currentMovie, ...records];
    }
    return records;
  }, [moviesQuery.data?.records, query.data]);
  const matchedMovieIndex = carouselMovies.findIndex((item) => item.id === movieId);
  const currentMovieIndex = matchedMovieIndex >= 0 ? matchedMovieIndex : 0;
  const canSwitchMovie = carouselMovies.length > 1;

  const switchMovie = (direction: -1 | 1) => {
    if (!canSwitchMovie) return;
    const nextIndex = (currentMovieIndex + direction + carouselMovies.length) % carouselMovies.length;
    const nextMovie = carouselMovies[nextIndex];
    if (nextMovie && nextMovie.id !== movieId) {
      history.replace(`/movies/${encodeURIComponent(nextMovie.id)}`);
    }
  };
  const wishlistMutation = useWishlistToggle(movieId, Boolean(movie.wanted));
  const watchedQuery = useQuery({
    queryKey: queryKeys.movieWatched(movieId),
    queryFn: () => customerApi.isMovieWatched(movieId),
    enabled: Boolean(movieId) && isLoggedIn,
  });
  const reviewsQuery = useQuery({
    queryKey: queryKeys.movieReviews(movieId),
    queryFn: () => customerApi.listMovieReviews(movieId),
    enabled: Boolean(movieId),
  });
  const reviews = reviewsQuery.data?.records || [];
  const rootReviews = reviews.filter((review) => !review.parentId);
  const repliesByParent = reviews.reduce<Record<string, typeof reviews>>((result, review) => {
    if (review.parentId) (result[review.parentId] ||= []).push(review);
    return result;
  }, {});

  const refreshReviews = () => queryClient.invalidateQueries({ queryKey: queryKeys.movieReviews(movieId) });

  const toggleWatched = async () => {
    if (!isLoggedIn) {
      await runAuthenticated(async () => undefined);
      return;
    }
    if (togglingWatched) return;
    setTogglingWatched(true);
    try {
      await customerApi.toggleMovieWatched(movieId, Boolean(watchedQuery.data));
      await queryClient.invalidateQueries({ queryKey: queryKeys.movieWatched(movieId) });
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : "操作失败，请稍后重试" });
    } finally {
      setTogglingWatched(false);
    }
  };

  const toggleLike = async (reviewId: string, liked: boolean) => {
    if (!isLoggedIn) {
      await runAuthenticated(async () => undefined);
      return;
    }
    setChangingReviewId(reviewId);
    try {
      await customerApi.toggleMovieReviewLike(movieId, reviewId, liked);
      await refreshReviews();
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : "操作失败，请稍后重试" });
    } finally {
      setChangingReviewId(undefined);
    }
  };

  const deleteReview = async (reviewId: string) => {
    setChangingReviewId(reviewId);
    try {
      await customerApi.deleteMovieReview(movieId, reviewId);
      await refreshReviews();
      Toast.show({ content: "影评已删除" });
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : "删除失败，请稍后重试" });
    } finally {
      setChangingReviewId(undefined);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.movieIntro} aria-label="影片信息">
        <button
          className={styles.carouselArrow}
          type="button"
          aria-label="上一部影片"
          title="上一部影片"
          disabled={!canSwitchMovie}
          onClick={() => switchMovie(-1)}
        >
          <LeftOutline />
        </button>
        <div className={styles.introPoster}>
          <div className={styles.introFallback}>
            {movie.title.slice(0, 1) || "影"}
          </div>
          {movie.posterUrl ? (
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

        <div className={styles.introContent}>
          <div className={styles.kickerRow}>
            <div className={styles.kicker}>MOVIE INTRO</div>
            {carouselMovies.length ? <span>{currentMovieIndex + 1}/{carouselMovies.length}</span> : null}
          </div>
          <h1>{movie.title}</h1>
          <p className={styles.introSubtitle}>{introSubtitle}</p>
          <div className={styles.genreTags}>
            {genreTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <p className={styles.releaseMeta}>
            {releaseDate} · {duration} 分钟
          </p>
          <div className={styles.ratingLine}>
            <strong>
              {movie.score?.toFixed(1) || "—"}
              <small>分</small>
            </strong>
            <span>观众评分</span>
          </div>
          <div className={styles.movieActions}>
            <Button
              className={`${styles.wantButton} ${movie.wanted ? styles.wantButtonActive : ""}`}
              fill="none"
              loading={wishlistMutation.isPending}
              onClick={(event) => {
                event.stopPropagation();
                void runAuthenticated(() => {
                  wishlistMutation.mutate();
                });
              }}
            >
              <HeartOutline />
              {movie.wanted ? "已想看" : "想看"}
            </Button>
            <Button
              className={`${styles.watchedButton} ${watchedQuery.data ? styles.watchedButtonActive : ""}`}
              fill="none"
              loading={togglingWatched}
              disabled={watchedQuery.isLoading || togglingWatched}
              onClick={toggleWatched}
            >
              {watchedQuery.data ? "已看过" : "看过"}
            </Button>
          </div>
        </div>

        <button
          className={styles.carouselArrow}
          type="button"
          aria-label="下一部影片"
          title="下一部影片"
          disabled={!canSwitchMovie}
          onClick={() => switchMovie(1)}
        >
          <RightOutline />
        </button>
      </section>

      <section className={styles.castSection} aria-label="演职人员">
        <div className={styles.castHeading}>
          <strong>演职人员</strong>
          <span>{castMembers.length ? "影片主创" : "信息待补充"}</span>
        </div>
        {castMembers.length ? (
          <div className={styles.castList}>
            {castMembers.map((name) => (
              <div className={styles.castItem} key={name}>
                <div className={styles.castAvatar}>{name.slice(0, 1)}</div>
                <span>{name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.castEmpty}>暂无演职人员信息</div>
        )}
      </section>

      <Card className={styles.card}>
        <Space direction="vertical" block>
          <div className={styles.sectionTitle}>影片简介</div>
          <p className={styles.copy}>
            {movie.description || "暂无影片简介，先看看当前影院的可售场次吧。"}
          </p>
          <Button
            color="primary"
            block
            className={styles.buyTicketButton}
            onClick={() =>
              history.push(`/cinemas?movieId=${encodeURIComponent(movieId)}`)
            }
          >
            选择影院和场次
          </Button>
        </Space>
      </Card>

      <section className={styles.reviewSection} aria-label="影片影评">
        <div className={styles.reviewHeading}>
          <strong>影片影评</strong>
          <div>
            <span>{reviewsQuery.data?.total || 0} 条</span>
            <Button size="small" color="primary" onClick={() => navigateAuthenticated(`/movies/${movieId}/review`)}>
              <span className={styles.reviewButtonText} style={{ color: "#fff", opacity: 1, fontWeight: 800 }}>去评价</span>
            </Button>
          </div>
        </div>

        {reviewsQuery.isLoading ? <div className={styles.reviewState}>影评加载中...</div> : null}
        {reviewsQuery.isError ? <div className={styles.reviewState}>影评加载失败，请稍后重试</div> : null}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && !rootReviews.length ? (
          <div className={styles.reviewState}>还没有影评，来发表第一条吧</div>
        ) : null}
        <div className={styles.reviewList}>
          {rootReviews.map((review) => (
            <article className={styles.reviewItem} key={review.id}>
              <div className={styles.reviewAvatar}>
                {review.authorAvatarUrl ? <img src={review.authorAvatarUrl} alt="" /> : review.authorName.slice(0, 1)}
              </div>
              <div className={styles.reviewBody}>
                <div className={styles.reviewAuthor}>
                  <strong>{review.authorName}</strong>
                  <span>{review.createTime ? dayjs(review.createTime).format("YYYY-MM-DD HH:mm") : "刚刚"}</span>
                </div>
                <p>{review.content}</p>
                <div className={styles.reviewActions}>
                  <button
                    className={review.liked ? styles.reviewLiked : ""}
                    type="button"
                    disabled={changingReviewId === review.id}
                    onClick={() => toggleLike(review.id, review.liked)}
                  >
                    <HeartOutline /> {review.liked ? "已赞" : "点赞"}{review.likeCount ? ` ${review.likeCount}` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateAuthenticated(`/movies/${movieId}/review?replyTo=${review.id}&name=${encodeURIComponent(review.authorName)}`)}
                  >
                    回复
                  </button>
                  {review.mine ? (
                    <button type="button" disabled={changingReviewId === review.id} onClick={() => deleteReview(review.id)}>
                      删除
                    </button>
                  ) : null}
                </div>
                {(repliesByParent[review.id] || []).map((reply) => (
                  <div className={styles.reviewReply} key={reply.id}>
                    <div className={styles.replyAuthor}>
                      <strong>{reply.authorName}</strong>
                      <span>{reply.createTime ? dayjs(reply.createTime).format("MM-DD HH:mm") : "刚刚"}</span>
                    </div>
                    <p>{reply.content}</p>
                    <div className={styles.reviewActions}>
                      <button
                        className={reply.liked ? styles.reviewLiked : ""}
                        type="button"
                        disabled={changingReviewId === reply.id}
                        onClick={() => toggleLike(reply.id, reply.liked)}
                      >
                        <HeartOutline /> {reply.liked ? "已赞" : "点赞"}{reply.likeCount ? ` ${reply.likeCount}` : ""}
                      </button>
                      {reply.mine ? (
                        <button type="button" disabled={changingReviewId === reply.id} onClick={() => deleteReview(reply.id)}>
                          删除
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MovieDetail;
