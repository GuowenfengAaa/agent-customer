import { Button, Card, NavBar, Space, Tag } from "antd-mobile";
import { HeartOutline, RightOutline } from "antd-mobile-icons";
import { history, useParams } from "@umijs/max";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import React from "react";
import { customerApi } from "@/services/customerApi";
import { queryKeys } from "@/query/keys";
import { getPosterThumbnailUrl } from "@/utils/poster";
import { useWishlistToggle } from "@/hooks/useWishlistToggle";
import styles from "./index.module.less";

const MovieDetail: React.FC = () => {
  const { movieId = "" } = useParams<{ movieId: string }>();
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
    releaseDate: undefined,
    status: undefined,
    wanted: false,
  };
  const genreTags = (movie.genre || "类型待更新")
    .split(/\s*[\/·,，]\s*/)
    .filter(Boolean)
    .slice(0, 3);
  const releaseDate = movie.releaseDate
    ? dayjs(movie.releaseDate).format("YYYY-MM-DD")
    : "上映日期待定";
  const duration = movie.durationMinutes || 120;
  const introSubtitle =
    movie.status === "即将上映" || movie.status === "COMING_SOON"
      ? "COMING SOON"
      : "NOW SHOWING";
  const wishlistMutation = useWishlistToggle(movieId, Boolean(movie.wanted));

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push("/home")}>影片详情</NavBar>

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
          <Tag color="warning">支持 AI 帮你筛选</Tag>
        </Space>
      </Card>
    </div>
  );
};

export default MovieDetail;
