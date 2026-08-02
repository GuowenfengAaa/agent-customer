import { Button, Card, NavBar, Space, Tag, Toast } from 'antd-mobile';
import { history, useLocation, useParams } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import type { OrderSummary } from '@/types/domain';
import styles from './index.module.less';

const isPending = (status: string) => status === 'PAYMENT_PENDING' || status === 'PENDING';

const OrderItem: React.FC<{ order: OrderSummary }> = ({ order }) => {
  const pending = isPending(order.status);
  const title = order.movieName || '影片信息待更新';
  return (
    <Card className={styles.orderItem}>
      <div className={styles.orderHead}>
        <strong>{pending ? '待支付订单' : '购票订单'}</strong>
        <span className={pending ? styles.statusPending : styles.statusPaid}>{order.statusDesc || (pending ? '待支付' : '已完成')}</span>
      </div>
      <div className={styles.orderMain}>
        <div className={`${styles.orderPoster} ${pending ? styles.posterWarm : styles.posterCool}`}><strong>{title.slice(0, 2)}</strong></div>
        <div>
          <h3>{title}</h3>
          <p>{order.startAt ? dayjs(order.startAt).format('MM月DD日 HH:mm') : '场次时间待更新'}</p>
          <p>{order.cinemaName || '影院待更新'} · {order.hallName || '影厅待更新'} · {order.seatSummary || '座位待更新'}</p>
        </div>
      </div>
      <div className={styles.orderActions}>
        <strong className={styles.orderPrice}>¥{order.amount.toFixed(2)}</strong>
        <Button size="small" color={pending ? 'primary' : 'default'} onClick={() => history.push(pending ? `/orders/${order.id}/pay` : `/orders/${order.id}/tickets`)}>{pending ? '去支付' : '查看详情'}</Button>
      </div>
    </Card>
  );
};

const OrderPlaceholder: React.FC = () => {
  const location = useLocation();
  const { orderId = 'demo-order' } = useParams<{ orderId: string }>();
  const isOrderFlow = location.pathname.includes('/orders/') && /^\d+$/.test(orderId);
  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => customerApi.getOrder(orderId),
    enabled: isOrderFlow,
  });
  const queryClient = useQueryClient();
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders({ page: 1, size: 20 }),
    queryFn: () => customerApi.listOrders({ page: 1, size: 20 }),
    enabled: location.pathname === '/me/orders',
  });
  const [paying, setPaying] = useState(false);
  const order = orderQuery.data;

  const pay = async () => {
    setPaying(true);
    try {
      await customerApi.payOrder(orderId, `customer-${orderId}-${Date.now()}`);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      history.push(`/orders/${orderId}/tickets`);
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
          <Tag color="primary">PAYMENT</Tag>
          <h1>模拟收银台</h1>
          <p>支付请求会提交到后端，并使用幂等键避免重复扣款。</p>
          <div className={styles.paymentAmount}>¥{(order?.amount ?? 0).toFixed(2)}</div>
          <Space direction="vertical" block>
            <Button color="primary" block loading={paying} onClick={pay}>确认支付</Button>
            <Button block onClick={() => history.push('/me/orders')}>暂不支付</Button>
          </Space>
        </Card>
      </div>
    );
  }

  if (location.pathname.endsWith('/tickets')) {
    const tickets = order?.tickets || [];
    return (
      <div className={styles.page}>
        <NavBar onBack={() => history.push('/me/orders')}>电子票</NavBar>
        <Card className={styles.ticketCard}>
          <Tag color="success">{order?.statusDesc || '已出票'}</Tag>
          <h1>{order?.movie?.name || order?.movieName || '电子票'}</h1>
          <p>{order?.cinema?.name || order?.cinemaName || '影院待更新'} · {order?.hallName || '影厅待更新'}</p>
          {tickets.length ? tickets.map((ticket) => <div className={styles.ticketRow} key={ticket.ticketCode}><strong>{ticket.rowNo !== undefined ? `${ticket.rowNo}排${ticket.seatNo}座` : '座位'}</strong><span>{ticket.ticketCode}</span></div>) : <div className={styles.emptyTicket}>出票信息会在支付完成后显示</div>}
          <Button color="primary" block onClick={() => history.push('/me/orders')}>返回订单</Button>
        </Card>
      </div>
    );
  }

  const records = ordersQuery.data?.records;
  return (
    <div className={styles.page}>
      <NavBar back={null}>我的订单</NavBar>
      <div className={styles.pageHeading}>
        <div className={styles.kicker}>ORDERS</div>
        <h1>购票记录</h1>
        <p>订单状态和出票信息会与服务端实时同步</p>
      </div>
      {ordersQuery.isLoading ? <div className={styles.emptyTicket}>正在加载订单...</div> : null}
      {ordersQuery.isError ? <div className={styles.emptyTicket}>订单服务暂时不可用，请稍后刷新</div> : null}
      {!ordersQuery.isLoading && !ordersQuery.isError && records?.length === 0 ? <div className={styles.emptyTicket}>暂无购票记录</div> : null}
      <div className={styles.orderList}>
        {(records || []).map((item) => <OrderItem key={item.id} order={item} />)}
      </div>
    </div>
  );
};

export default OrderPlaceholder;
