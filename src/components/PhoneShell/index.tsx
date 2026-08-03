import React, { useEffect, useState } from 'react';
import styles from './index.module.less';

const formatTime = (date: Date) =>
  String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');

const PhoneShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(formatTime(new Date())), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.phone}>
        <span className={styles.sideButtonTop} aria-hidden="true" />
        <span className={styles.sideButtonMiddle} aria-hidden="true" />
        <span className={styles.sideButtonBottom} aria-hidden="true" />
        <div className={styles.screen}>
          <div className={styles.statusBar} aria-label="设备状态栏">
            <time className={styles.time}>{currentTime}</time>
            <span className={styles.dynamicIsland} aria-hidden="true">
              <span className={styles.islandCamera} />
            </span>
            <span className={styles.statusIndicators} aria-hidden="true">
              <span className={styles.signalBars}>
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className={styles.network}>5G</span>
              <span className={styles.battery}>
                <span className={styles.batteryLevel} />
              </span>
            </span>
          </div>
          <div className={styles.pageViewport}>{children}</div>
          <span className={styles.homeIndicator} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

export default PhoneShell;
