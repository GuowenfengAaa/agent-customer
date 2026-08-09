import { Button, Card, TextArea, Toast } from "antd-mobile";
import { history, useLocation, useParams } from "@umijs/max";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { queryKeys } from "@/query/keys";
import { customerApi } from "@/services/customerApi";
import styles from "./index.module.less";

const reviewTemplates = ["剧情紧凑", "演员出彩", "视效震撼", "值得推荐"];

const MovieReview: React.FC = () => {
  const { movieId = "" } = useParams<{ movieId: string }>();
  const location = useLocation();
  const replyTo = new URLSearchParams(location.search).get("replyTo") || undefined;
  const replyName = new URLSearchParams(location.search).get("name") || "这条影评";
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
      await customerApi.createMovieReview(movieId, value, replyTo);
      await queryClient.invalidateQueries({ queryKey: queryKeys.movieReviews(movieId) });
      Toast.show({ content: "影评已发布" });
      history.replace(`/movies/${movieId}`);
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : "发布失败，请稍后重试" });
    } finally {
      setSubmitting(false);
    }
  };

  const addTemplate = (template: string) => {
    setContent((current) => {
      if (current.includes(template)) return current;
      return current.trim() ? `${current.trim()}，${template}` : template;
    });
  };

  return (
    <div className={styles.page}>
      <Card className={styles.card}>
        <div className={styles.intro}>{replyTo ? "REPLY REVIEW" : "MOVIE REVIEW"}</div>
        <div className={styles.movieName}>{movieQuery.data?.title || "这部影片"}</div>
        <p>{replyTo ? `回复 @${replyName}` : "记录此刻的观影感受"}</p>
        <TextArea
          value={content}
          onChange={setContent}
          placeholder={replyTo ? "写下你的回复" : "写下你的观后感，让更多人了解这部电影"}
          maxLength={500}
          showCount
          autoSize={{ minRows: 8, maxRows: 12 }}
        />
        <div className={styles.templateTags} aria-label="常用评价标签">
          {reviewTemplates.map((template) => (
            <button key={template} type="button" onClick={() => addTemplate(template)}>
              {template}
            </button>
          ))}
        </div>
        <Button color="primary" block loading={submitting} onClick={submit}>
          发布影评
        </Button>
      </Card>
    </div>
  );
};

export default MovieReview;
