import {
  AppOutline,
  EnvironmentOutline,
  MessageOutline,
  MovieOutline,
  ShopbagOutline,
  UserOutline,
} from 'antd-mobile-icons';
import { history, Outlet, useLocation } from '@umijs/max';
import React from 'react';
import { useAppStore } from '@/stores/useAppStore';
import styles from './index.module.less';

const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const city = useAppStore((state) => state.city);
  const path = location.pathname;
  const active = path === '/home' || path.startsWith('/movies')
    ? 'movies'
    : path.startsWith('/cinemas') || path.startsWith('/showtimes')
      ? 'cinemas'
      : path.startsWith('/me/orders') || path.startsWith('/orders')
        ? 'orders'
        : path.startsWith('/agent')
          ? 'agent'
          : 'profile';
  const hideBottomNav = path.startsWith('/movies/')
    || path.startsWith('/cinemas/')
    || path.startsWith('/showtimes/')
    || path.startsWith('/orders/');

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.topRow}>
          <button className={styles.cityButton} type="button" aria-label="选择城市">
            <span>{city}</span>
            <span className={styles.chevron}>⌄</span>
          </button>
          <div className={styles.brand}>光影票务</div>
          <button className={styles.orderEntry} type="button" onClick={() => history.push('/me/orders')}>
            <span className={styles.ticketMark}><ShopbagOutline /></span>
            <span>消息</span>
          </button>
        </div>
      </header>
      <main className={`${styles.content} ${hideBottomNav ? styles.contentStandalone : ''}`}>
        <Outlet />
      </main>
      <nav className={`${styles.bottomNav} ${hideBottomNav ? styles.hidden : ''}`} aria-label="主导航">
        <button className={`${styles.navTab} ${active === 'movies' ? styles.active : ''}`} type="button" onClick={() => history.push('/home')}>
          <span className={styles.navIcon}><MovieOutline /></span>
          <span>电影</span>
        </button>
        <button className={`${styles.navTab} ${active === 'cinemas' ? styles.active : ''}`} type="button" onClick={() => history.push('/cinemas')}>
          <span className={styles.navIcon}><EnvironmentOutline /></span>
          <span>影院</span>
        </button>
        <button className={`${styles.aiEntry} ${active === 'agent' ? styles.aiActive : ''}`} type="button" onClick={() => history.push('/agent')}>
          <span className={styles.aiCircle}><MessageOutline /></span>
          <span>妙语</span>
        </button>
        <button className={`${styles.navTab} ${active === 'orders' ? styles.active : ''}`} type="button" onClick={() => history.push('/me/orders')}>
          <span className={styles.navIcon}><AppOutline /></span>
          <span>订单</span>
        </button>
        <button className={`${styles.navTab} ${active === 'profile' ? styles.active : ''}`} type="button" onClick={() => history.push('/me')}>
          <span className={styles.navIcon}><UserOutline /></span>
          <span>我的</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerLayout;
