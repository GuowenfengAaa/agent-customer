import {
  AppOutline,
  EnvironmentOutline,
  LeftOutline,
  MessageOutline,
  MovieOutline,
  UserOutline,
} from "antd-mobile-icons";
import { history, Outlet, useLocation } from "@umijs/max";
import React, { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import styles from "./index.module.less";

const CustomerLayout: React.FC = () => {
  const location = useLocation();
  const city = useAppStore((state) => state.city);
  const locationStatus = useAppStore((state) => state.locationStatus);
  const locateCurrentPosition = useAppStore(
    (state) => state.locateCurrentPosition
  );
  const path = location.pathname;
  const isCinemaBooking =
    path === "/cinemas" &&
    new URLSearchParams(location.search).has("movieId");
  const isCinemaShowtimes = /^\/cinemas\/[^/]+\/showtimes$/.test(path);
  const isSeatSelection = /^\/showtimes\/[^/]+\/seats$/.test(path);
  const isOrderConfirmation = /^\/orders\/[^/]+\/confirm$/.test(path);
  const isOrderPayment = /^\/orders\/[^/]+\/pay$/.test(path);
  const isOrderTickets = /^\/orders\/[^/]+\/tickets$/.test(path);
  const isOrderRefund = /^\/orders\/[^/]+\/refund$/.test(path);
  const isMovieList = path === "/movies";
  const active =
    path === "/home" || path.startsWith("/movies") || path.startsWith("/search")
      ? "movies"
      : path.startsWith("/cinemas") || path.startsWith("/showtimes")
      ? "cinemas"
      : path.startsWith("/me/orders") || path.startsWith("/orders")
      ? "orders"
      : path.startsWith("/agent")
      ? "agent"
      : "profile";
  const hideBottomNav =
    path.startsWith("/search") ||
    path.startsWith("/movies/") ||
    path.startsWith("/cinemas/") ||
    path.startsWith("/showtimes/") ||
    path.startsWith("/orders/") ||
    isCinemaBooking ||
    path === "/me/preferences" ||
    path.startsWith("/me/security");
  const hideGlobalHeader =
    path === "/me/preferences" ||
    path.startsWith("/me/security") ||
    path.startsWith("/agent") ||
    isCinemaShowtimes ||
    isSeatSelection ||
    isOrderConfirmation ||
    isOrderPayment ||
    isOrderTickets ||
    isOrderRefund ||
    isMovieList;
  const headerTitle = path === "/me/orders"
    ? "我的订单"
    : path === "/me/wishlist"
    ? "想看的电影"
    : path === "/cinemas"
    ? isCinemaBooking ? "选择影院" : "影院"
    : path === "/me"
    ? "我的"
    : "";

  useEffect(() => {
    if (locationStatus === "idle") locateCurrentPosition();
  }, [locateCurrentPosition, locationStatus]);

  const locationTitle =
    locationStatus === "denied"
      ? "定位权限已关闭，点击重新定位"
      : locationStatus === "unsupported"
      ? "当前浏览器不支持定位"
      : locationStatus === "error"
      ? "定位失败，点击重试"
      : "点击重新定位";

  return (
    <div className={styles.app}>
      {path !== "/home" && !path.startsWith("/search") && !hideGlobalHeader ? (
        <header className={styles.header}>
          <div className={`${styles.topRow} ${headerTitle ? styles.topRowWithTitle : ""}`}>
            {isCinemaBooking ? (
              <button
                className={styles.backButton}
                type="button"
                aria-label="返回上一页"
                title="返回上一页"
                onClick={() => history.replace('/home')}
              >
                <LeftOutline />
              </button>
            ) : (
              <button
                className={styles.cityButton}
                type="button"
                aria-label="重新定位"
                aria-busy={locationStatus === "locating"}
                title={locationTitle}
                onClick={locateCurrentPosition}
              >
                <span>{locationStatus === "locating" ? "定位中" : city}</span>
                <span className={styles.chevron}>⌄</span>
              </button>
            )}
            {headerTitle ? <strong className={styles.pageTitle}>{headerTitle}</strong> : null}
            {headerTitle ? <span className={styles.topRowSpacer} aria-hidden="true" /> : null}
          </div>
        </header>
      ) : null}
      <main
        className={`${styles.content} ${
          hideBottomNav ? styles.contentStandalone : ""
        }`}
      >
        <Outlet />
      </main>
      <nav
        className={`${styles.bottomNav} ${hideBottomNav ? styles.hidden : ""}`}
        aria-label="主导航"
      >
        <button
          className={`${styles.navTab} ${
            active === "movies" ? styles.active : ""
          }`}
          type="button"
          onClick={() => history.push("/home")}
        >
          <span className={styles.navIcon}>
            <MovieOutline />
          </span>
          <span>电影</span>
        </button>
        <button
          className={`${styles.navTab} ${
            active === "cinemas" ? styles.active : ""
          }`}
          type="button"
          onClick={() => history.push("/cinemas")}
        >
          <span className={styles.navIcon}>
            <EnvironmentOutline />
          </span>
          <span>影院</span>
        </button>
        <button
          className={`${styles.aiEntry} ${
            active === "agent" ? styles.aiActive : ""
          }`}
          type="button"
          onClick={() => history.push("/agent")}
        >
          <span className={styles.aiCircle}>
            <MessageOutline />
          </span>
          <span>妙语</span>
        </button>
        <button
          className={`${styles.navTab} ${
            active === "orders" ? styles.active : ""
          }`}
          type="button"
          onClick={() => history.push("/me/orders")}
        >
          <span className={styles.navIcon}>
            <AppOutline />
          </span>
          <span>订单</span>
        </button>
        <button
          className={`${styles.navTab} ${
            active === "profile" ? styles.active : ""
          }`}
          type="button"
          onClick={() => history.push("/me")}
        >
          <span className={styles.navIcon}>
            <UserOutline />
          </span>
          <span>我的</span>
        </button>
      </nav>
    </div>
  );
};

export default CustomerLayout;
