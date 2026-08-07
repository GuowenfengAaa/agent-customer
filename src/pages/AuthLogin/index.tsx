import { Button, Input, Toast } from 'antd-mobile';
import {
  EyeInvisibleOutline,
  EyeOutline,
  LockOutline,
  MailOutline,
  MovieOutline,
  UserOutline,
} from 'antd-mobile-icons';
import { history } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { login, loginByEmail, sendEmailCode } from '@/services/auth';
import styles from './index.module.less';

type LoginMode = 'password' | 'email';

const AuthLogin: React.FC = () => {
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const normalizedEmail = email.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const requestCode = async () => {
    if (!isValidEmail) {
      Toast.show({ content: '请输入正确的邮箱地址' });
      return;
    }

    setSendingCode(true);
    try {
      await sendEmailCode(normalizedEmail, 2);
      setCooldown(60);
      Toast.show({ content: '验证码已发送，请查收邮件' });
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '验证码发送失败，请稍后重试' });
    } finally {
      setSendingCode(false);
    }
  };

  const submit = async () => {
    if (!agreed) {
      Toast.show({ content: '请先同意《用户协议》和《隐私政策》' });
      return;
    }

    if (mode === 'password') {
      if (!/^1\d{10}$/.test(phone.trim())) {
        Toast.show({ content: '请输入正确的手机号' });
        return;
      }
      if (!password.trim()) {
        Toast.show({ content: '请输入密码' });
        return;
      }
    } else {
      if (!isValidEmail) {
        Toast.show({ content: '请输入正确的邮箱地址' });
        return;
      }
      if (!/^\d{6}$/.test(code.trim())) {
        Toast.show({ content: '请输入 6 位邮箱验证码' });
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'password') {
        await login(phone.trim(), password);
      } else {
        await loginByEmail(normalizedEmail, code.trim());
      }
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      history.replace(redirect ? decodeURIComponent(redirect) : '/home');
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '登录失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.brandPanel}>
        <div className={styles.brandRow}>
          <span className={styles.logo}><MovieOutline /></span>
          <span className={styles.brandName}>
            <strong>光影票务</strong>
            <small>MOVIE TICKET</small>
          </span>
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>NOW SHOWING</span>
          <h1>把今晚，<br />留给好电影</h1>
          <p>登录后继续你的观影旅程</p>
        </div>
        <div className={styles.cinemaStrip} aria-hidden="true">
          <span>01</span>
          <span className={styles.stripWide}>LIGHT</span>
          <span>24</span>
        </div>
      </section>
      <main className={styles.sheet}>
        <div className={styles.sheetHeading}>
          <div>
            <span className={styles.welcomeMark}>WELCOME BACK</span>
            <h2>欢迎回来</h2>
            <p>{mode === 'password' ? '使用手机号和密码登录' : '使用已注册邮箱快捷登录'}</p>
          </div>
        </div>

        <div className={styles.modeSwitch} role="tablist" aria-label="登录方式">
          <button
            className={mode === 'password' ? styles.modeActive : ''}
            type="button"
            role="tab"
            aria-selected={mode === 'password'}
            onClick={() => setMode('password')}
          >
            密码登录
          </button>
          <button
            className={mode === 'email' ? styles.modeActive : ''}
            type="button"
            role="tab"
            aria-selected={mode === 'email'}
            onClick={() => setMode('email')}
          >
            邮箱登录
          </button>
        </div>

        <div className={styles.form}>
          {mode === 'password' ? (
            <>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>手机号</span>
                <label className={styles.field}>
                  <span className={styles.fieldIcon}><UserOutline /></span>
                  <Input
                    className={styles.input}
                    placeholder="请输入 11 位手机号"
                    value={phone}
                    onChange={setPhone}
                    clearable
                    type="tel"
                    maxLength={11}
                  />
                </label>
              </div>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabelRow}>
                  <span className={styles.fieldLabel}>密码</span>
                  <button type="button" onClick={() => history.push('/auth/forgot-password')}>忘记密码？</button>
                </div>
                <label className={[styles.field, styles.passwordField].join(' ')}>
                  <span className={styles.fieldIcon}><LockOutline /></span>
                  <Input
                    className={styles.input}
                    placeholder="请输入登录密码"
                    value={password}
                    onChange={setPassword}
                    type={visible ? 'text' : 'password'}
                  />
                  <button
                    className={styles.eye}
                    type="button"
                    title={visible ? '隐藏密码' : '显示密码'}
                    aria-label={visible ? '隐藏密码' : '显示密码'}
                    onClick={() => setVisible((value) => !value)}
                  >
                    {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
                  </button>
                </label>
              </div>
            </>
          ) : (
            <>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>邮箱</span>
                <label className={styles.field}>
                  <span className={styles.fieldIcon}><MailOutline /></span>
                  <Input
                    className={styles.input}
                    placeholder="请输入已注册邮箱"
                    value={email}
                    onChange={setEmail}
                    clearable
                    type="email"
                  />
                </label>
              </div>
              <div className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>邮箱验证码</span>
                <div className={styles.codeRow}>
                  <label className={styles.field}>
                    <span className={styles.fieldIcon}><LockOutline /></span>
                    <Input
                      className={styles.input}
                      placeholder="请输入 6 位验证码"
                      value={code}
                      onChange={setCode}
                      inputMode="numeric"
                      maxLength={6}
                    />
                  </label>
                  <Button
                    className={styles.codeButton}
                    fill="outline"
                    loading={sendingCode}
                    disabled={sendingCode || cooldown > 0}
                    onClick={requestCode}
                  >
                    {cooldown > 0 ? cooldown + 's 后重发' : '获取验证码'}
                  </Button>
                </div>
              </div>
            </>
          )}

          <label className={styles.agreement}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            <span className={styles.checkbox} aria-hidden="true" />
            <span className={styles.agreementText}>
              我已阅读并同意
              <a
                href="/legal/terms"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  history.push('/legal/terms');
                }}
              >
                《用户协议》
              </a>
              和
              <a
                href="/legal/privacy"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  history.push('/legal/privacy');
                }}
              >
                《隐私政策》
              </a>
            </span>
          </label>

          <Button className={styles.submit} color="primary" block loading={loading} onClick={submit}>
            登录
          </Button>
        </div>

        <div className={styles.links}>
          <span>还没有光影票务账号？</span>
          <button type="button" onClick={() => history.push('/auth/register')}>
            立即注册
          </button>
        </div>
      </main>
    </div>
  );
};

export default AuthLogin;
