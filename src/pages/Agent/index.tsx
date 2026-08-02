import { Button, Card, NavBar, Space, Tag, TextArea, Toast } from 'antd-mobile';
import { history } from '@umijs/max';
import React, { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import styles from './index.module.less';

const Agent: React.FC = () => {
  const { setMode, setAgentContext } = useAppStore();
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!message.trim()) return;
    setMode('AI');
    setAgentContext({ sessionId: 'pending-session', draftId: 'pending-draft' });
    setSent(true);
    Toast.show({ content: '已记录你的需求，SSE 对话接口接入后将开始实时响应' });
    setMessage('');
  };

  return (
    <div className={styles.page}>
      <NavBar onBack={() => history.push('/home')}>AI 智能购票</NavBar>
      <div className={styles.hero}>
        <div className={styles.avatar}>✦</div>
        <div><div className={styles.kicker}>MOVIE AGENT</div><h1>告诉我你的观影计划</h1><p>我会帮你查找影片、影院和合适的场次。</p></div>
      </div>
      <div className={styles.progress}><span className={styles.done}>选片</span><i /><span>选影院</span><i /><span>选场次</span><i /><span>选座</span></div>
      <div className={styles.messages}>
        <Card className={styles.agentMessage}>你好，我可以帮你找附近的电影票。比如：<strong>“今晚国贸附近，两张 IMAX”</strong></Card>
        {sent ? <Card className={styles.userMessage}>我想找一场合适的电影。</Card> : null}
        <Tag color="warning">当前为 AI 模式</Tag>
      </div>
      <div className={styles.composer}>
        <TextArea value={message} onChange={setMessage} placeholder="描述你的观影需求" autoSize={{ minRows: 2, maxRows: 5 }} />
        <Space justify="between" block align="center">
          <span className={styles.tip}>支持自然语言，也可以随时切换到自己挑选</span>
          <Button color="primary" size="small" onClick={send}>发送</Button>
        </Space>
      </div>
    </div>
  );
};

export default Agent;
