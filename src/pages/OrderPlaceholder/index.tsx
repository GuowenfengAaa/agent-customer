import { Button, Card, Dialog, NavBar, Space, Tag, Toast } from 'antd-mobile';
import { history, useLocation, useParams } from '@umijs/max';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useRef, useState } from 'react';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { OrderDetail, OrderSummary } from '@/types/domain';
import { getPosterThumbnailUrl } from '@/utils/poster';
import styles from './index.module.less';

const isPending = (status: string) => status === 'PAYMENT_PENDING' || status === 'PENDING';
const isTicketViewable = (status: string) => status === 'PAID' || status === 'TICKETED';

function submitAlipayForm(markup: string) {
  const paymentContent = markup.trim();
  if (/^https:\/\//i.test(paymentContent)) {
    window.location.assign(paymentContent);
    return;
  }

  const parsed = new DOMParser().parseFromString(paymentContent, 'text/html');
  const source = parsed.querySelector('form');
  if (!source) throw new Error('支付宝支付表单无效，请稍后重试');

  const action = source.getAttribute('action') || '';
  if (!/^https:\/\//i.test(action)) throw new Error('支付宝收银台地址无效，请稍后重试');

  const form = document.createElement('form');
  form.method = source.getAttribute('method') || 'post';
  form.action = action;
  form.target = source.getAttribute('target') || '_self';
  source.querySelectorAll('input').forEach((input) => {
    const field = document.createElement('input');
    field.type = 'hidden';
    field.name = input.name;
    field.value = input.value;
    form.appendChild(field);
  });
  document.body.appendChild(form);
  HTMLFormElement.prototype.submit.call(form);
}

const OrderMovieSummary: React.FC<{ order?: OrderDetail; compact?: boolean }> = ({ order, compact = false }) => {
  const title = order?.movie?.name || order?.movieName || '影片信息待更新';
  const posterUrl = order?.movie?.posterUrl || order?.moviePoster;
  const cinema = order?.cinema?.name || order?.cinemaName || '影院待更新';
  const hall = order?.hallName || '影厅待更新';
  const startAt = order?.startAt ? dayjs(order.startAt).format('MM月DD日 HH:mm') : '场次时间待更新';

  return (
    <div className={`${styles.flowMovie} ${compact ? styles.flowMovieCompact : ''}`}>
      <div className={styles.flowMoviePoster}>
        <strong>{title.slice(0, 2)}</strong>
        {posterUrl ? (
          <img
            src={getPosterThumbnailUrl(posterUrl)}
            alt={`${title}海报`}
            loading="eager"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
      </div>
      <div className={styles.flowMovieInfo}>
        <strong>{title}</strong>
        <span>{cinema} · {hall}</span>
        <span>{startAt}</span>
      </div>
    </div>
  );
};

const OrderItem: React.FC<{
  order: OrderSummary;
  posterUrl?: string;
  cancelling: boolean;
  onCancel: (order: OrderSummary) => void;
}> = ({ order, posterUrl, cancelling, onCancel }) => {
  const pending = isPending(order.status);
  const canCancel = order.status === 'PAYMENT_PENDING';
  const canViewTicket = isTicketViewable(order.status);
  const cancelled = order.status === 'CANCELLED';
  const expired = order.status === 'EXPIRED';
  const canViewOrderDetail = cancelled || expired;
  const title = order.movieName || '影片信息待更新';
  return (
    <Card className={styles.orderItem}>
      <div className={styles.orderHead}>
        <strong>{pending ? '待支付订单' : cancelled ? '已取消订单' : expired ? '已过期订单' : '购票订单'}</strong>
        <span className={pending ? styles.statusPending : cancelled || expired ? styles.statusClosed : styles.statusPaid}>
          {order.statusDesc || (pending ? '待支付' : cancelled ? '已取消' : expired ? '已过期' : '已完成')}
        </span>
      </div>
      <div className={styles.orderMain}>
        <div className={`${styles.orderPoster} ${pending ? styles.posterWarm : styles.posterCool}`}>
          <strong>{title.slice(0, 2)}</strong>
          {posterUrl ? (
            <img
              src={getPosterThumbnailUrl(posterUrl)}
              alt={`${title}海报`}
              loading="lazy"
              decoding="async"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
        </div>
        <div>
          <h3>{title}</h3>
          <p>{order.startAt ? dayjs(order.startAt).format('MM月DD日 HH:mm') : '场次时间待更新'}</p>
          <p>{order.cinemaName || '影院待更新'} · {order.hallName || '影厅待更新'} · {order.seatSummary || '座位待更新'}</p>
        </div>
      </div>
      <div className={styles.orderActions}>
        <strong className={styles.orderPrice}>¥{order.amount.toFixed(2)}</strong>
        <div className={styles.orderActionButtons}>
          {canCancel ? (
            <Button
              className={styles.cancelOrderButton}
              size="small"
              color="danger"
              fill="outline"
              loading={cancelling}
              disabled={cancelling}
              onClick={() => onCancel(order)}
            >
              取消订单
            </Button>
          ) : null}
          {pending ? (
            <Button
              size="small"
              color="primary"
              disabled={cancelling}
              onClick={() => history.push(`/orders/${order.id}/pay`)}
            >
              去支付
            </Button>
          ) : canViewTicket ? (
            <Button size="small" color="default" onClick={() => history.push(`/orders/${order.id}/tickets`)}>查看详情</Button>
          ) : canViewOrderDetail ? (
            <Button size="small" color="default" onClick={() => history.push(`/orders/${order.id}/detail`)}>查看详情</Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

const OrderPlaceholder: React.FC = () => {
  const location = useLocation();
  const { orderId = 'demo-order' } = useParams<{ orderId: string }>();
  const isOrderFlow = location.pathname.includes('/orders/') && /^\d+$/.test(orderId);
  const isPaymentResult = location.pathname.endsWith('/pay/result');
  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => customerApi.getOrder(orderId),
    enabled: isOrderFlow,
  });
  const queryClient = useQueryClient();
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders({ page: 1, size: 20 }),
    queryFn: () => customerApi.listOrders({ page: 1, size: 20 }),
    enabled: location.pathname === '/me/orders',
  });
  const records = ordersQuery.data?.records ?? [];
  const orderDetailQueries = useQueries({
    queries: records.map((item) => ({
      queryKey: queryKeys.order(item.id),
      queryFn: () => customerApi.getOrder(item.id),
      enabled: Boolean(item.id),
      staleTime: 5 * 60 * 1000,
    })),
  });
  const posterByOrderId = new Map(
    records.map((item, index) => [
      item.id,
      item.moviePoster || orderDetailQueries[index]?.data?.movie?.posterUrl,
    ]),
  );
  const [paying, setPaying] = useState(false);
  const paymentIdempotencyKeyRef = useRef(`customer-${orderId}-${Date.now()}`);
  const [cancellingOrderIds, setCancellingOrderIds] = useState<Set<string>>(() => new Set());
  const cancellingOrderIdsRef = useRef<Set<string>>(new Set());
  const order = orderQuery.data;
  const paymentFailed = order?.payment?.status === 'FAIL' || order?.payment?.status === 'CLOSED';
  const paymentTerminal = order?.status === 'TICKETED'
    || order?.status === 'CANCELLED'
    || order?.status === 'EXPIRED'
    || paymentFailed;

  useEffect(() => {
    if (!isPaymentResult || paymentTerminal || paymentTimedOut) return undefined;
    setPaymentTimedOut(false);
    const interval = window.setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
    }, 2000);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setPaymentTimedOut(true);
    }, 60000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isPaymentResult, orderId, paymentTerminal, paymentTimedOut, queryClient]);

  useEffect(() => {
    if (isPaymentResult && order?.status === 'TICKETED') {
      history.replace(`/orders/${orderId}/tickets`);
    }
  }, [isPaymentResult, order?.status, orderId]);

  const cancelOrder = async (targetOrder: OrderSummary) => {
    if (
      targetOrder.status !== 'PAYMENT_PENDING'
      || cancellingOrderIds.has(targetOrder.id)
      || cancellingOrderIdsRef.current.has(targetOrder.id)
    ) return;

    const confirmed = await Dialog.confirm({
      title: '取消订单',
      content: '取消后座位将立即释放，是否继续？',
      cancelText: '暂不取消',
      confirmText: '确认取消',
    });
    if (!confirmed) return;

    // Reserve the order after confirmation so repeated taps cannot submit twice.
    if (cancellingOrderIdsRef.current.has(targetOrder.id)) return;
    cancellingOrderIdsRef.current.add(targetOrder.id);

    setCancellingOrderIds((current) => new Set(current).add(targetOrder.id));
    try {
      await customerApi.cancelOrder(targetOrder.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.order(targetOrder.id) }),
      ]);
      Toast.show({ icon: 'success', content: '订单已取消，座位已释放' });
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '取消订单失败，请稍后重试' });
    } finally {
      cancellingOrderIdsRef.current.delete(targetOrder.id);
      setCancellingOrderIds((current) => {
        const next = new Set(current);
        next.delete(targetOrder.id);
        return next;
      });
    }
  };

  const pay = async () => {
    setPaying(true);
    try {
      const result = await customerApi.payOrder(orderId, paymentIdempotencyKeyRef.current);
      if (result.paymentStatus === 'SUCCESS') {
        history.replace(`/orders/${orderId}/tickets`);
        return;
      }
      if (!result.payForm) throw new Error('支付宝支付表单为空，请稍后重试');
      submitAlipayForm(result.payForm);
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '支付失败，请稍后重试' });
    } finally {
      setPaying(false);
    }
  };

  if (location.pathname.endsWith('/confirm')) {
    const seats = order?.items?.map((item) => `${item.rowNo}排${item.seatNo}座`).join('、') || '座位信息待更新';
    return (
      <div className={styles.page}>
        <NavBar onBack={() => history.back()}>订单确认</NavBar>
        <Card className={styles.orderCard}>
          <Tag color="warning">{order?.statusDesc || '待确认'}</Tag>
          <OrderMovieSummary order={order} />
          <h1>确认你的观影计划</h1>
          <div className={styles.summary}><span>{order?.movie?.name || order?.movieName || '影片待更新'} · {order?.hallName || '影厅待更新'}</span><strong>{order?.startAt ? dayjs(order.startAt).format('HH:mm') : '--:--'}</strong></div>
          <div className={styles.summary}><span>座位</span><strong>{seats}</strong></div>
          <div className={styles.total}><span>应付金额</span><strong>¥{(order?.amount ?? 0).toFixed(2)}</strong></div>
          <Button color="primary" block loading={orderQuery.isLoading} onClick={() => history.push(`/orders/${orderId}/pay`)}>确认订单</Button>
        </Card>
      </div>
    );
  }

  if (location.pathname.endsWith('/pay')) {
    return (
      <div className={styles.page}>
        <NavBar onBack={() => history.push(`/orders/${orderId}/confirm`)}>确认支付</NavBar>
        <Card className={styles.orderCard}>
          <Tag color="primary">支付宝沙箱</Tag>
          <OrderMovieSummary order={order} compact />
          <h1>确认支付</h1>
          <p>点击确认后将跳转支付宝沙箱收银台，支付完成后请等待订单状态同步。</p>
          <div className={styles.paymentAmount}>¥{(order?.amount ?? 0).toFixed(2)}</div>
          <Space direction="vertical" block>
            <Button color="primary" block loading={paying} onClick={pay}>确认支付</Button>
            <Button block onClick={() => history.push('/me/orders')}>暂不支付</Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (location.pathname.endsWith('/detail')) {
    const seats = order?.items?.map((item) => (
      item.rowNo !== undefined && item.seatNo !== undefined
        ? `${item.rowNo}排${item.seatNo}座`
        : '座位信息待更新'
    )).join('、') || order?.seatSummary || '座位信息待更新';
    const isCancelledOrder = order?.status === 'CANCELLED';
    const isExpiredOrder = order?.status === 'EXPIRED';

    return (
      <div className={`${styles.page} ${styles.orderDetailPage}`}>
        <NavBar onBack={() => history.push('/me/orders')}>订单详情</NavBar>
        <main className={styles.orderDetailContent}>
          {orderQuery.isLoading ? <div className={styles.emptyTicket}>正在加载订单详情...</div> : null}
          {orderQuery.isError ? <div className={styles.emptyTicket}>订单详情加载失败，请稍后重试</div> : null}
          {order ? (
            <Card className={styles.orderDetailCard}>
              <div className={styles.detailStatusRow}>
                <div>
                  <span>订单状态</span>
                  <strong>{order.statusDesc || order.status}</strong>
                </div>
                <Tag color={isCancelledOrder ? 'danger' : isExpiredOrder ? 'default' : 'primary'}>
                  {order.statusDesc || order.status}
                </Tag>
              </div>

              <OrderMovieSummary order={order} />

              <div className={styles.detailRows}>
                <div className={styles.detailRow}>
                  <span>座位</span>
                  <strong>{seats}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>订单编号</span>
                  <strong>{order.orderNo || '--'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>下单时间</span>
                  <strong>{order.createTime ? dayjs(order.createTime).format('YYYY-MM-DD HH:mm') : '--'}</strong>
                </div>
                {order.expiresAt ? (
                  <div className={styles.detailRow}>
                    <span>锁座截止</span>
                    <strong>{dayjs(order.expiresAt).format('YYYY-MM-DD HH:mm')}</strong>
                  </div>
                ) : null}
              </div>

              <div className={styles.detailAmount}>
                <span>订单金额</span>
                <strong>¥{order.amount.toFixed(2)}</strong>
              </div>

              {isCancelledOrder || isExpiredOrder ? (
                <div className={styles.detailNotice}>
                  {isCancelledOrder
                    ? '该订单已取消，锁定座位已释放。'
                    : '该订单已超时关闭，锁定座位已释放。'}
                </div>
              ) : null}
            </Card>
          ) : null}
        </main>
      </div>
    );
  }

  if (isPaymentResult) {
    const closed = order?.status === 'CANCELLED' || order?.status === 'EXPIRED';
    const failed = paymentFailed && !closed;
    return (
      <div className={styles.page}>
        <NavBar onBack={() => history.push('/me/orders')}>支付结果</NavBar>
        <Card className={styles.paymentResultCard}>
          <div className={`${styles.paymentResultIcon} ${closed || failed ? styles.paymentResultIconClosed : ''}`}>
            {closed || failed || orderQuery.isError ? '!' : '✓'}
          </div>
          <h1>
            {closed
              ? '订单已关闭'
              : failed
                ? '支付未完成'
                : orderQuery.isError
                  ? '状态查询失败'
                  : paymentTimedOut
                    ? '仍在等待支付结果'
                    : '正在确认支付'}
          </h1>
          <p>
            {closed
              ? '该订单已取消或过期，座位已释放。'
              : failed
                ? '支付宝交易已关闭或失败，请返回订单列表重新发起支付。'
                : orderQuery.isError
                  ? '网络暂时不可用，请稍后重新查询。'
                  : paymentTimedOut
                    ? '如果支付宝已经扣款，请稍后在订单列表查看状态。'
                    : '支付宝正在通知系统，订单出票后会自动展示电子票。'}
          </p>
          <div className={styles.paymentResultOrder}>订单号：{order?.orderNo || orderId}</div>
          <Space direction="vertical" block>
            <Button color="primary" block loading={orderQuery.isFetching} onClick={() => { void orderQuery.refetch(); }}>
              重新查询
            </Button>
            <Button block onClick={() => history.push('/me/orders')}>返回订单列表</Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (location.pathname.endsWith('/tickets')) {
    const tickets = order?.tickets || [];
    const title = order?.movie?.name || order?.movieName || '影片信息待更新';
    const posterUrl = order?.movie?.posterUrl || order?.moviePoster;
    const cinema = order?.cinema?.name || order?.cinemaName || '影院待更新';
    const hall = order?.hallName || '影厅待更新';
    const showtime = order?.startAt ? dayjs(order.startAt).format('MM月DD日 HH:mm') : '场次时间待更新';
    return (
      <div className={`${styles.page} ${styles.ticketPage}`}>
        <NavBar onBack={() => history.push('/me/orders')}>电子票</NavBar>
        <main className={styles.ticketContent}>
          <section className={styles.ticketSheet}>
            <div className={styles.ticketStatusRow}>
              <Tag color="success">{order?.statusDesc || '已出票'}</Tag>
              <span>电子票</span>
            </div>

            <div className={styles.ticketMovie}>
              <div className={styles.ticketMoviePoster}>
                <strong>{title.slice(0, 2)}</strong>
                {posterUrl ? (
                  <img
                    src={getPosterThumbnailUrl(posterUrl)}
                    alt={`${title}海报`}
                    loading="eager"
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
              </div>
              <div className={styles.ticketMovieInfo}>
                <h1>{title}</h1>
                <p>{cinema} · {hall}</p>
                <p>{showtime}</p>
              </div>
            </div>

            <div className={styles.ticketDivider} aria-hidden="true" />

            <div className={styles.ticketMeta}>
              <div>
                <span>座位</span>
                <strong>
                  {tickets.length
                    ? tickets.map((ticket) => ticket.rowNo !== undefined ? `${ticket.rowNo}排${ticket.seatNo}座` : '座位').join('、')
                    : '座位信息待更新'}
                </strong>
              </div>
              <div className={styles.ticketOrderNo}>
                <span>订单号</span>
                <strong>{order?.orderNo || '--'}</strong>
              </div>
            </div>

            {tickets.length ? (
              <div className={styles.ticketPasses}>
                {tickets.map((ticket, index) => (
                  <article className={styles.ticketPass} key={ticket.ticketCode || `${order?.id}-${index}`}>
                    <strong className={styles.ticketSeatLabel}>
                      {ticket.rowNo !== undefined ? `${ticket.rowNo}排${ticket.seatNo}座` : `第${index + 1}张电子票`}
                    </strong>
                    <div className={styles.qrFrame}>
                      <QRCodeSVG
                        value={ticket.qrContent || ticket.ticketCode || `${order?.id}-${index}`}
                        size={172}
                        bgColor="#ffffff"
                        fgColor="#102c25"
                        level="M"
                        includeMargin
                        role="img"
                        aria-label={`${title}第${index + 1}张电子票二维码`}
                      />
                    </div>
                    <p className={styles.qrHint}>入场时请向影院工作人员出示此二维码</p>
                    <div className={styles.ticketCodeRow}>
                      <span>取票码</span>
                      <strong>{ticket.ticketCode || '--'}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyTicket}>出票信息会在支付完成后显示</div>
            )}
          </section>
          <Button className={styles.ticketBackButton} color="primary" block onClick={() => history.push('/me/orders')}>返回订单</Button>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeading}>
        <div className={styles.kicker}>ORDERS</div>
        <h1>购票记录</h1>
        <p>订单状态和出票信息会与服务端实时同步</p>
      </div>
      {ordersQuery.isLoading ? <div className={styles.emptyTicket}>正在加载订单...</div> : null}
      {ordersQuery.isError ? <div className={styles.emptyTicket}>订单服务暂时不可用，请稍后刷新</div> : null}
      {!ordersQuery.isLoading && !ordersQuery.isError && records?.length === 0 ? <div className={styles.emptyTicket}>暂无购票记录</div> : null}
      <div className={styles.orderList}>
        {records.map((item) => (
          <OrderItem
            key={item.id}
            order={item}
            posterUrl={posterByOrderId.get(item.id)}
            cancelling={cancellingOrderIds.has(item.id)}
            onCancel={cancelOrder}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderPlaceholder;
