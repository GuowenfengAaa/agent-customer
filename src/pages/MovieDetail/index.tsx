import { Button, Card, Space, Toast } from "antd-mobile";
import { HeartOutline, RightOutline } from "antd-mobile-icons";
import { history, useParams } from "@umijs/max";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import { getPosterThumbnailUrl } from "@/utils/poster";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import styles from "./index.module.less";

const MovieDetail: React.FC = () => {
  const { movieId = "" } = useParams<{ movieId: string }>();
  const queryClient = useQueryClient();
  const [changingReviewId, setChangingReviewId] = React.useState<string>();
  const query = useQuery({
    queryKey: queryKeys.movie(movieId),
    queryFn: () => customerApi.getMovie(movieId),
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
  const wishlistMutation = useWishlistToggle(movieId, Boolean(movie.wanted));
  const reviewsQuery = useQuery({
    queryKey: queryKeys.movieReviews(movieId),
    queryFn: () => customerApi.listMovieReviews(movieId),
    enabled: Boolean(movieId),
  });
  const reviews = reviewsQuery.data?.records || [];

  const refreshReviews = () => queryClient.invalidateQueries({ queryKey: queryKeys.movieReviews(movieId) });

  const toggleLike = async (reviewId: string, liked: boolean) => {
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
          <div className={styles.kicker}>MOVIE INTRO</div>
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
          <Button
            className={`${styles.wantButton} ${movie.wanted ? styles.wantButtonActive : ""}`}
            fill="none"
            loading={wishlistMutation.isPending}
            onClick={(event) => {
              event.stopPropagation();
              wishlistMutation.mutate();
            }}
          >
            <HeartOutline />
            {movie.wanted ? "已想看" : "想看"}
          </Button>
        </div>

        <RightOutline className={styles.introArrow} />
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
            <Button size="small" color="primary" onClick={() => history.push(`/movies/${movieId}/review`)}>
              <span className={styles.reviewButtonText} style={{ color: "#fff", opacity: 1, fontWeight: 800 }}>去评价</span>
            </Button>
          </div>
        </div>

        {reviewsQuery.isLoading ? <div className={styles.reviewState}>影评加载中...</div> : null}
        {reviewsQuery.isError ? <div className={styles.reviewState}>影评加载失败，请稍后重试</div> : null}
        {!reviewsQuery.isLoading && !reviewsQuery.isError && !reviews.length ? (
          <div className={styles.reviewState}>还没有影评，来发表第一条吧</div>
        ) : null}
        <div className={styles.reviewList}>
          {reviews.map((review) => (
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
                  {review.mine ? (
                    <button type="button" disabled={changingReviewId === review.id} onClick={() => deleteReview(review.id)}>
                      删除
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MovieDetail;
