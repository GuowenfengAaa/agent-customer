import { Button, Card, Input, NavBar, Toast } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { history } from '@umijs/max';
import React, { useState } from 'react';
import { login } from '@/services/auth';
import styles from './index.module.less';

const AuthLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!/^1\d{10}$/.test(phone.trim())) {
      Toast.show({ content: '请输入正确的手机号' });
      return;
    }
    if (!password.trim()) {
      Toast.show({ content: '请输入密码' });
      return;
    }

    setLoading(true);
    try {
      await login(phone.trim(), password);
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      history.replace(redirect ? decodeURIComponent(redirect) : '/home');
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '登录失败，请稍后再试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <NavBar className={styles.navBar}>登录</NavBar>
      <div className={styles.hero}>
        <div className={styles.logo}>M</div>
        <div>
          <div className={styles.kicker}>MOVIE TICKET</div>
          <h1>把好电影，留给好心情</h1>
          <p>选片、找影院、挑座位，一次完成。</p>
        </div>
      </div>
      <Card className={styles.card}>
        <div className={styles.cardTitle}>欢迎回来</div>
        <div className={styles.cardHint}>使用手机号登录你的观影账户</div>
        <div className={styles.form}>
          <Input
            className={styles.input}
            placeholder="手机号"
            value={phone}
            onChange={setPhone}
            clearable
            type="tel"
            maxLength={11}
          />
          <div className={styles.passwordRow}>
            <Input
              className={styles.input}
              placeholder="密码"
              value={password}
              onChange={setPassword}
              type={visible ? 'text' : 'password'}
            />
            <button className={styles.eye} type="button" onClick={() => setVisible((value) => !value)}>
              {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
            </button>
          </div>
          <Button color="primary" block loading={loading} onClick={submit}>
            登录
          </Button>
        </div>
        <div className={styles.links}>
          <button type="button" onClick={() => history.push('/auth/forgot-password')}>
            忘记密码
          </button>
          <button type="button" onClick={() => history.push('/auth/register')}>
            注册账号
          </button>
        </div>
      </Card>
      <div className={styles.footer}>安全登录 · 购票信息仅用于本次服务</div>
    </div>
  );
};

export default AuthLogin;
