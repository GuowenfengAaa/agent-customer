import { Avatar, Button, Card, List, NavBar, Space, Tag } from 'antd-mobile';
import { history, useLocation } from '@umijs/max';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { currentSession, logout } from '@/services/auth';
import { customerApi } from '@/services/customerApi';
import { queryKeys } from '@/query/keys';
import PagePlaceholder from '@/components/PagePlaceholder';
import styles from './index.module.less';

const Me: React.FC = () => {
  const location = useLocation();
  const session = currentSession();
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => customerApi.getProfile(),
    enabled: location.pathname === '/me',
  });

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      history.replace('/auth/login');
    }
  };

  if (location.pathname !== '/me') {
    return <PagePlaceholder eyebrow="ACCOUNT" title="账号设置" description="偏好设置和安全管理会在这里逐步接入当前后端的个人中心接口。" primaryLabel="返回我的" primaryPath="/me" />;
  }

  return (
    <div className={styles.page}>
      <NavBar back={null}>我的</NavBar>
      <Card className={styles.profile}>
        <Avatar className={styles.avatar} src="" fallback={profileQuery.data?.phone?.slice(-2) || session?.phone?.slice(-2) || '我'} />
        <div className={styles.profileText}>
          <h1>{profileQuery.data?.phone || session?.phone || '观影用户'}</h1>
          <p>{profileQuery.data?.email || session?.email || '登录后同步你的订单和观影偏好'}</p>
        </div>
        <Tag color="primary">已登录</Tag>
      </Card>
      <div className={styles.stats}>
        <div><strong>{profileQuery.data?.stats?.totalOrders ?? '--'}</strong><span>历史订单</span></div>
        <div><strong>{profileQuery.data?.stats ? `¥${profileQuery.data.stats.totalSpent.toFixed(0)}` : '--'}</strong><span>累计消费</span></div>
        <div><strong>{profileQuery.data?.preference?.hallType || '未设置'}</strong><span>偏好影厅</span></div>
      </div>
      <List className={styles.list} header="购票服务">
        <List.Item arrow onClick={() => history.push('/me/orders')}>我的订单</List.Item>
        <List.Item arrow onClick={() => history.push('/me/preferences')}>{profileQuery.data?.preference?.district || '观影偏好'}</List.Item>
        <List.Item arrow onClick={() => history.push('/me/security')}>账号安全</List.Item>
      </List>
      <Button className={styles.logout} block onClick={handleLogout}>退出登录</Button>
      <Space justify="center" block className={styles.note}>当前会话由后端 Token 管理</Space>
    </div>
  );
};

export default Me;
