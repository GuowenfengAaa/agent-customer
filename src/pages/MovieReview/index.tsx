import { Button, Card, TextArea, Toast } from "antd-mobile";
import { history, useParams } from "@umijs/max";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { queryKeys } from "@/query/keys";
import { customerApi } from "@/services/customerApi";
import styles from "./index.module.less";

const MovieReview: React.FC = () => {
  const { movieId = "" } = useParams<{ movieId: string }>();
  const queryClient = useQueryClient();
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const movieQuery = useQuery({
    queryKey: queryKeys.movie(movieId),
    queryFn: () => customerApi.getMovie(movieId),
    enabled: Boolean(movieId),
  });

  const submit = async () => {
    const value = content.trim();
    if (!value) {
      Toast.show({ content: "请输入影评内容" });
      return;
    }
    setSubmitting(true);
    try {
      await customerApi.createMovieReview(movieId, value);
      await queryClient.invalidateQueries({ queryKey: queryKeys.movieReviews(movieId) });
      Toast.show({ content: "影评已发布" });
      history.replace(`/movies/${movieId}`);
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : "发布失败，请稍后重试" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.movieName}>{movieQuery.data?.title || "这部影片"}</div>
        <p>分享你的真实观影感受</p>
        <TextArea
          value={content}
          onChange={setContent}
          placeholder="写下你的观后感，让更多人了解这部电影"
          maxLength={500}
          showCount
          autoSize={{ minRows: 8, maxRows: 12 }}
        />
        <Button color="primary" block loading={submitting} onClick={submit}>
          发布影评
        </Button>
      </Card>
    </div>
  );
};

export default MovieReview;
