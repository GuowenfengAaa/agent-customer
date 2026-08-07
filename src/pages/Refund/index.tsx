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

const DAY_IN_MINUTES = 24 * 60;
const REFUND_CUTOFF_MINUTES = 30;

type RefundFeeRuleId = 'early' | 'standard' | 'unavailable' | 'unknown';

type RefundFeeRule = {
  id: RefundFeeRuleId;
  rate: number;
  refundable: boolean;
  title: string;
  description: string;
};

const REFUND_FEE_RULES: Array<{ id: Exclude<RefundFeeRuleId, 'unknown'>; time: string; charge: string }> = [
  { id: 'early', time: '不少于 24 小时', charge: '订单金额的 5%' },
  { id: 'standard', time: '不少于 30 分钟且不足 24 小时', charge: '订单金额的 10%' },
  { id: 'unavailable', time: '不足 30 分钟', charge: '不支持退票' },
];

// 当前规则仅用于提交前预估，提交后始终展示后端保存的实际退款金额与手续费。
const getRefundFeeRule = (minutesUntilStart?: number): RefundFeeRule => {
  if (minutesUntilStart === undefined || !Number.isFinite(minutesUntilStart)) {
    return {
      id: 'unknown',
      rate: 0,
      refundable: false,
      title: '场次时间待确认',
      description: '暂时无法计算退票手续费，请稍后重试。',
    };
  }

  if (minutesUntilStart >= DAY_IN_MINUTES) {
    return {
      id: 'early',
      rate: 0.05,
      refundable: true,
      title: '距开场不少于 24 小时',
      description: '本次退票按订单总额（含零食）的 5% 收取手续费。',
    };
  }

  if (minutesUntilStart >= REFUND_CUTOFF_MINUTES) {
    return {
      id: 'standard',
      rate: 0.1,
      refundable: true,
      title: '距开场不少于 30 分钟',
      description: '本次退票按订单总额（含零食）的 10% 收取手续费。',
    };
  }

  return {
    id: 'unavailable',
    rate: 0,
    refundable: false,
    title: '距开场不足 30 分钟',
    description: '距离电影开场不足 30 分钟，暂不支持退票。',
  };
};

const estimateRefund = (amount: number, rate: number) => {
  const amountFen = Math.max(0, Math.round(amount * 100));
  const feePercent = Math.round(rate * 100);
  // 与后端一致：手续费按分四舍五入，实际退款金额由原金额减手续费得到。
  const serviceFeeFen = Math.floor((amountFen * feePercent + 50) / 100);
  return {
    serviceFee: serviceFeeFen / 100,
    refundAmount: (amountFen - serviceFeeFen) / 100,
  };
};

const Refund: React.FC = () => {
  const { orderId = '' } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [polling, setPolling] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [refundResult, setRefundResult] = useState<RefundResult>();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
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
  const snackItemsAmount = order?.snacks?.reduce((total, item) => total + (item.amount || 0), 0) ?? 0;
  const snackAmount = snackItemsAmount || order?.snackAmount || 0;
  const itemTicketAmount = order?.items?.reduce((total, item) => total + (item.unitPrice || 0), 0) ?? 0;
  const ticketAmount = itemTicketAmount || Math.max(0, (order?.amount || 0) - snackAmount);
  const minutesUntilStart = order?.startAt && dayjs(order.startAt).isValid()
    ? dayjs(order.startAt).diff(currentTime, 'minute', true)
    : undefined;
  const refundFeeRule = getRefundFeeRule(minutesUntilStart);
  const refundEstimate = refundFeeRule.refundable
    ? estimateRefund(order?.amount || 0, refundFeeRule.rate)
    : undefined;
  const returnedServiceFee = refundResult?.serviceFee;
  const returnedRefundAmount = refundResult?.amount;
  const hasBackendRefundAmounts = returnedServiceFee !== undefined && returnedRefundAmount !== undefined;
  const refundFee = hasBackendRefundAmounts ? returnedServiceFee : refundEstimate?.serviceFee ?? 0;
  const estimatedRefundAmount = hasBackendRefundAmounts ? returnedRefundAmount : refundEstimate?.refundAmount ?? 0;
  const hasRefundAmountToDisplay = refundFeeRule.refundable || hasBackendRefundAmounts;
  const status = refundResult?.status;
  const processing = order?.status === 'REFUND_PENDING' || status === 'PENDING';
  const success = order?.status === 'REFUNDED' || status === 'SUCCESS';
  const failed = status === 'FAIL';
  const canRefund = order?.status === 'TICKETED'
    && refundFeeRule.refundable
    && !submitting
    && !processing
    && !success;

  useEffect(() => {
    // 停留在退款页时定期刷新时间，避免临近开场后仍显示可退票。
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

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
      content: `预计退票手续费为 ¥${refundFee.toFixed(2)}，预计退款 ¥${estimatedRefundAmount.toFixed(2)}。退款会同时处理电影票和已购买的零食，电子票会暂时冻结，实际金额以实际退款到账为准。是否继续？`,
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
    if (refreshingStatus) return;
    setPolling(true);
    setRefreshingStatus(true);
    try {
      await Promise.all([
        refundStatusQuery.refetch(),
        orderQuery.refetch(),
      ]);
    } finally {
      setRefreshingStatus(false);
    }
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.back()}>申请退票</NavBar>
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
              <div className={styles.detailRow}>
                <span>{hasBackendRefundAmounts ? '退票手续费' : '预计退票手续费'}</span>
                <strong className={hasRefundAmountToDisplay ? styles.feeDeduction : styles.feeUnavailable}>
                  {hasRefundAmountToDisplay ? `-¥${refundFee.toFixed(2)}` : '暂不可退'}
                </strong>
              </div>
              <div className={styles.amountRow}>
                <span>{hasBackendRefundAmounts ? '实际退款金额' : '预计退款金额'}</span>
                <strong>{hasRefundAmountToDisplay ? `¥${estimatedRefundAmount.toFixed(2)}` : '--'}</strong>
              </div>
            </section>

            <section className={styles.feePanel} aria-labelledby="refund-fee-title">
              <div className={styles.feeHeader}>
                <div>
                  <span>REFUND FEE</span>
                  <h2 id="refund-fee-title">退票手续费</h2>
                </div>
                <b className={refundFeeRule.refundable ? styles.feeRate : styles.feeRateUnavailable}>
                  {refundFeeRule.refundable ? `费率 ${Math.round(refundFeeRule.rate * 100)}%` : '暂不可退'}
                </b>
              </div>
              <div className={styles.feeCurrent}>
                <div>
                  <strong>{refundFeeRule.title}</strong>
                  <span>{refundFeeRule.description}</span>
                </div>
                <b>{refundFeeRule.refundable ? `¥${refundFee.toFixed(2)}` : '--'}</b>
              </div>
              <div className={styles.feeTable}>
                <div className={styles.feeTableHead}>
                  <span>申请退票距开场时间</span>
                  <span>手续费</span>
                </div>
                {REFUND_FEE_RULES.map((rule) => (
                  <div
                    className={[styles.feeRuleRow, refundFeeRule.id === rule.id ? styles.feeRuleActive : ''].filter(Boolean).join(' ')}
                    key={rule.id}
                  >
                    <span>{rule.time}</span>
                    <strong>{rule.charge}</strong>
                  </div>
                ))}
              </div>
              <p className={styles.feeHint}>手续费按订单总额计算，已购买的零食也会计入退款金额和手续费。</p>
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
                  : refundFeeRule.description}
              </div>
            ) : null}
          </>
        )}
      </main>
      {order ? (
        <div className={styles.actionBar}>
          {processing ? (
            <Button
              color="primary"
              block
              loading={refreshingStatus}
              disabled={refreshingStatus}
              onClick={() => { void refreshRefundStatus(); }}
            >
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
