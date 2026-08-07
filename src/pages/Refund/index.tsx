import { Button, Dialog, ErrorBlock, NavBar, Skeleton, Tag, Toast } from 'antd-mobile';
import { history, useParams } from '@umijs/max';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { queryKeys } from '@/query/keys';
import { customerApi } from '@/services/customerApi';
import type { RefundResult } from '@/types/domain';
import { getPosterThumbnailUrl } from '@/utils/poster';
import styles from './index.module.less';

const isValidOrderId = (orderId: string) => /^\d+$/.test(orderId);

const Refund: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [refundResult, setRefundResult] = useState<RefundResult>();
  const redirectingRef = useRef(false);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => customerApi.getOrder(orderId),
    enabled: isValidOrderId(orderId),
  });
  const order = orderQuery.data;

  const refundStatusQuery = useQuery({
    queryKey: ['refundStatus', orderId],
    queryFn: () => customerApi.getRefundStatus(orderId),
    enabled: isValidOrderId(orderId)
      && (order?.status === 'REFUND_PENDING' || refundResult?.status === 'PENDING'),
    refetchInterval: (query) => (
      polling && query.state.data?.status === 'PENDING' ? 2000 : false
    ),
  });

  const title = order?.movie?.name || order?.movieName || '影片信息待更新';
  const posterUrl = order?.movie?.posterUrl || order?.moviePoster;
  const seats = order?.items
    ?.filter((item) => item.rowNo !== undefined && item.seatNo !== undefined)
    .map((item) => `${item.rowNo}排${item.seatNo}座`)
    .join('、') || order?.seatSummary || '座位信息待更新';
  const ticketAmount = order?.items?.reduce((total, item) => total + (item.unitPrice || 0), 0) ?? 0;
  const snackAmount = order?.snacks?.reduce((total, item) => total + (item.amount || 0), 0) ?? 0;
  const showtimeStarted = order?.startAt ? !dayjs(order.startAt).isAfter(dayjs()) : true;
  const status = refundResult?.status;
  const processing = order?.status === 'REFUND_PENDING' || status === 'PENDING';
  const success = order?.status === 'REFUNDED' || status === 'SUCCESS';
  const failed = status === 'FAIL';
  const canRefund = order?.status === 'TICKETED' && !showtimeStarted && !submitting && !processing && !success;

  useEffect(() => {
    if (order?.status === 'REFUND_PENDING' || refundResult?.status === 'PENDING') {
      setPolling(true);
    }
  }, [order?.status, refundResult?.status]);

  useEffect(() => {
    if (!polling) return undefined;
    const timeout = window.setTimeout(() => setPolling(false), 60000);
    return () => window.clearTimeout(timeout);
  }, [polling]);

  useEffect(() => {
    const result = refundStatusQuery.data;
    if (!result) return;
    setRefundResult(result);
    if (result.status === 'SUCCESS' && !redirectingRef.current) {
      redirectingRef.current = true;
      setPolling(false);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['showtimes'] }),
        queryClient.invalidateQueries({ queryKey: ['seatLayout'] }),
      ]).then(() => {
        Toast.show({ icon: 'success', content: '退款成功，电子票已失效' });
        history.replace(`/orders/${orderId}/detail`);
      });
    }
  }, [orderId, queryClient, refundStatusQuery.data]);

  const submitRefund = async () => {
    if (!canRefund) return;
    const confirmed = await Dialog.confirm({
      title: '确认整单退款',
      content: '退款会同时处理电影票和已购买的零食，电子票会暂时冻结。是否继续？',
      cancelText: '暂不退款',
      confirmText: '确认退款',
    });
    if (!confirmed || submitting) return;

    setSubmitting(true);
    try {
      const result = await customerApi.refundOrder(orderId);
      setRefundResult(result);
      if (result.status === 'SUCCESS') {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) }),
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
          queryClient.invalidateQueries({ queryKey: ['showtimes'] }),
          queryClient.invalidateQueries({ queryKey: ['seatLayout'] }),
        ]);
        Toast.show({ icon: 'success', content: '退款成功，电子票已失效' });
        history.replace(`/orders/${orderId}/detail`);
      } else if (result.status === 'PENDING') {
        setPolling(true);
        Toast.show({ content: '退款处理中，请稍后查看结果' });
        await orderQuery.refetch();
      } else {
        Toast.show({ content: result.message || '退款失败，可稍后重试' });
        await orderQuery.refetch();
      }
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '退款请求失败，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshRefundStatus = async () => {
    setPolling(true);
    await refundStatusQuery.refetch();
    await orderQuery.refetch();
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.back()}>申请退款</NavBar>
      <main className={styles.content}>
        {orderQuery.isLoading ? (
          <div className={styles.loading}>
            <Skeleton.Title animated />
            <Skeleton.Paragraph lineCount={8} animated />
          </div>
        ) : orderQuery.isError || !order ? (
          <ErrorBlock status="default" title="订单信息加载失败" description="请检查网络后重新加载">
            <Button size="small" onClick={() => { void orderQuery.refetch(); }}>重新加载</Button>
          </ErrorBlock>
        ) : (
          <>
            <section className={styles.moviePanel}>
              <div className={styles.poster}>
                <strong>{title.slice(0, 2)}</strong>
                {posterUrl ? (
                  <img
                    src={getPosterThumbnailUrl(posterUrl)}
                    alt={`${title}海报`}
                    loading="eager"
                    decoding="async"
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
              </div>
              <div className={styles.movieInfo}>
                <Tag color={success ? 'danger' : processing ? 'warning' : canRefund ? 'success' : 'default'} fill="outline">
                  {success ? '已退款' : processing ? '退款处理中' : order.statusDesc || order.status}
                </Tag>
                <h1>{title}</h1>
                <p>{order.cinema?.name || order.cinemaName || '影院信息待更新'} · {order.hallName || '影厅信息待更新'}</p>
                <strong>{order.startAt ? dayjs(order.startAt).format('YYYY年M月D日 HH:mm') : '场次时间待更新'}</strong>
              </div>
            </section>

            <section className={styles.refundPanel}>
              <div className={styles.panelTitle}>
                <div><span>REFUND DETAILS</span><h2>退款明细</h2></div>
                <em>整单退款</em>
              </div>
              <div className={styles.detailRow}><span>座位</span><strong>{seats}</strong></div>
              <div className={styles.detailRow}><span>电影票</span><strong>¥{ticketAmount.toFixed(2)}</strong></div>
              {order.snacks?.filter((item) => item.quantity > 0).map((snack) => (
                <div className={styles.detailRow} key={snack.snackId}>
                  <span>{snack.name} × {snack.quantity}</span>
                  <strong>¥{snack.amount.toFixed(2)}</strong>
                </div>
              ))}
              {snackAmount > 0 ? (
                <div className={styles.detailRow}><span>零食合计</span><strong>¥{snackAmount.toFixed(2)}</strong></div>
              ) : null}
              <div className={styles.amountRow}><span>退款金额</span><strong>¥{order.amount.toFixed(2)}</strong></div>
            </section>

            <section className={styles.rules}>
              <h2>退款须知</h2>
              <p>本次将整单退款，电影票和已购买的零食一起处理，不支持部分退款。</p>
              <p>退款处理中会暂时冻结电子票和座位，支付宝确认成功后座位与零食库存才会释放。</p>
              <p>实际退款到账时间和状态以支付宝沙箱返回结果为准。</p>
            </section>

            {processing ? (
              <div className={styles.pendingNotice}>
                <strong>退款处理中</strong>
                <span>{refundResult?.message || '系统正在向支付宝确认退款结果，请勿重复提交。'}</span>
                {refundStatusQuery.isError ? <span>状态查询暂时失败，请点击下方刷新。</span> : null}
              </div>
            ) : null}
            {failed ? (
              <div className={styles.failedNotice}>
                <strong>退款未完成</strong>
                <span>{refundResult?.message || '支付宝未完成本次退款，订单仍保持已出票。'}</span>
              </div>
            ) : null}
            {success ? (
              <div className={styles.successNotice}>
                <strong>退款成功</strong>
                <span>电子票已失效，座位和零食库存已释放。</span>
              </div>
            ) : null}
            {!canRefund && !processing && !success && !failed ? (
              <div className={styles.unavailable}>
                {order.status !== 'TICKETED'
                  ? `当前订单状态为“${order.statusDesc || order.status}”，不能申请退款。`
                  : '该场次已经开始，不能申请退款。'}
              </div>
            ) : null}
          </>
        )}
      </main>
      {order ? (
        <div className={styles.actionBar}>
          {processing ? (
            <Button color="primary" block loading={refundStatusQuery.isFetching} onClick={() => { void refreshRefundStatus(); }}>
              {polling ? '刷新退款状态' : '查询退款状态'}
            </Button>
          ) : success ? (
            <Button color="primary" block onClick={() => history.replace(`/orders/${orderId}/detail`)}>查看订单详情</Button>
          ) : (
            <Button color="danger" block loading={submitting} disabled={!canRefund || submitting} onClick={submitRefund}>
              {canRefund ? (failed ? '重新申请退款' : '确认整单退款') : '当前订单不可退款'}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Refund;
