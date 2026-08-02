import { Button, Card, Space } from 'antd-mobile';
import { history } from '@umijs/max';
import React from 'react';
import styles from './index.module.less';

interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel?: string;
  primaryPath?: string;
}

const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  eyebrow,
  title,
  description,
  primaryLabel = '返回首页',
  primaryPath = '/home',
}) => (
  <div className={styles.page}>
    <Card className={styles.card}>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
      <Space direction="vertical" block>
        <Button color="primary" block onClick={() => history.push(primaryPath)}>
          {primaryLabel}
        </Button>
        <Button fill="none" block onClick={() => history.back()}>
          返回上一页
        </Button>
      </Space>
    </Card>
  </div>
);

export default PagePlaceholder;
