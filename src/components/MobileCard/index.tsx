import { Card } from 'antd-mobile';
import React from 'react';
import styles from './index.module.less';

interface MobileCardProps {
  title: string;
  meta?: string;
  media?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
}

const MobileCard: React.FC<MobileCardProps> = ({ title, meta, media, children, onClick }) => (
  <Card className={`${styles.card} ${media ? styles.cardWithMedia : ''}`} onClick={onClick}>
    {media ? <div className={styles.media}>{media}</div> : null}
    <div className={styles.content}>
      <div className={styles.header}>
        <strong>{title}</strong>
        {meta ? <span>{meta}</span> : null}
      </div>
      {children ? <div className={styles.body}>{children}</div> : null}
    </div>
  </Card>
);

export default MobileCard;
