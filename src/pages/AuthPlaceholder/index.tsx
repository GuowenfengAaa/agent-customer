import { Button, Input, Toast } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline, LeftOutline, LockOutline, MailOutline, MovieOutline, UserOutline } from 'antd-mobile-icons';
import { history, useLocation } from '@umijs/max';
import React, { useEffect, useState } from 'react';
import { registerAccount, resetPassword, sendEmailCode } from '@/services/auth';
import styles from './index.module.less';

const AuthPlaceholder: React.FC = () => {
  const location = useLocation();
  const isRegister = location.pathname.endsWith('register');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    const normalizedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Toast.show({ content: '请输入正确的邮箱地址' });
      return;
    }
    setSendingCode(true);
    try {
      await sendEmailCode(normalizedEmail, isRegister ? 0 : 1);
      setCooldown(60);
      Toast.show({ content: '验证码已发送，请查收邮件（也请检查垃圾邮件）' });
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '验证码发送失败' });
    } finally {
      setSendingCode(false);
    }
  };

  const submit = async () => {
    if (!email.trim() || !code.trim() || !password.trim() || (isRegister && !phone.trim())) {
      Toast.show({ content: '请完整填写表单' });
      return;
    }
    setLoading(true);
    try {
      if (isRegister) {
        await registerAccount({ phone: phone.trim(), email: email.trim(), password, code: code.trim() });
        Toast.show({ content: '注册成功，请登录' });
      } else {
        await resetPassword({ email: email.trim(), code: code.trim(), newPassword: password });
        Toast.show({ content: '密码已重置，请登录' });
      }
      history.replace('/auth/login');
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '操作失败，请稍后重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={[styles.page, isRegister ? styles.registerPage : ''].filter(Boolean).join(' ')}>
      {!isRegister ? (
        <header className={styles.header}>
        <button className={styles.backButton} type="button" aria-label="返回登录" title="返回登录" onClick={() => history.push('/auth/login')}>
          <LeftOutline />
        </button>
        <span className={styles.appName}>光影票务</span>
        <span className={styles.headerSide} />
        </header>
      ) : null}
      <section className={[styles.brandPanel, isRegister ? styles.registerBrandPanel : ''].filter(Boolean).join(' ')}>
        <div className={styles.brandRow}>
          <span className={styles.logo}>{isRegister ? <MovieOutline /> : 'M'}</span>
          {isRegister ? (
            <span className={styles.brandName}>
              <strong>光影票务</strong>
              <small>MOVIE TICKET</small>
            </span>
          ) : <span className={styles.kicker}>RESET PASSWORD</span>}
        </div>
        {isRegister ? <span className={styles.heroEyebrow}>CREATE ACCOUNT</span> : null}
        <h1>{isRegister ? '加入光影票务' : '找回登录密码'}</h1>
        <p>{isRegister ? '完成注册后，随时保存想看的电影和座位。' : '验证邮箱后，为账户设置一个新的登录密码。'}</p>
        {isRegister ? (
          <div className={styles.cinemaStrip} aria-hidden="true">
            <span>01</span>
            <span className={styles.stripWide}>JOIN</span>
            <span>24</span>
          </div>
        ) : <div className={styles.ticketLine} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>}
      </section>
      <main className={[styles.sheet, isRegister ? styles.registerSheet : ''].filter(Boolean).join(' ')}>
        {!isRegister ? <span className={styles.handle} aria-hidden="true" /> : null}
        <div className={styles.sheetHeading}>
          {isRegister ? <span className={styles.welcomeMark}>CREATE ACCOUNT</span> : null}
          <h2>{isRegister ? '创建账户' : '重置密码'}</h2>
          <p>{isRegister ? '填写信息后即可开始选片和购票。' : '输入邮箱验证码，保护你的账户安全。'}</p>
        </div>
        <div className={styles.form}>
          {isRegister ? (
            <label className={styles.field}>
              <span className={styles.fieldIcon}><UserOutline /></span>
              <Input className={styles.input} placeholder="请输入手机号" value={phone} onChange={setPhone} type="tel" maxLength={11} />
            </label>
          ) : null}
          <label className={styles.field}>
            <span className={styles.fieldIcon}><MailOutline /></span>
            <Input className={styles.input} placeholder="请输入邮箱地址" value={email} onChange={setEmail} type="email" />
          </label>
          <div className={styles.codeRow}>
            <label className={styles.field}>
              <span className={styles.fieldIcon}><MailOutline /></span>
              <Input className={styles.input} placeholder="邮箱验证码" value={code} onChange={setCode} inputMode="numeric" maxLength={6} />
            </label>
            <Button
              className={styles.codeButton}
              fill="outline"
              loading={sendingCode}
              disabled={sendingCode || cooldown > 0}
              onClick={requestCode}
            >
              {cooldown > 0 ? `${cooldown}s 后重发` : '获取验证码'}
            </Button>
          </div>
          <label className={`${styles.field} ${styles.passwordField}`}>
            <span className={styles.fieldIcon}><LockOutline /></span>
            <Input
              className={styles.input}
              placeholder={isRegister ? '设置登录密码' : '设置新密码'}
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
          <p className={styles.passwordHint}>密码需为 8-32 位，并同时包含字母和数字</p>
          <Button className={styles.submit} color="primary" block loading={loading} onClick={submit}>
            {isRegister ? '注册并登录' : '重置密码'}
          </Button>
        </div>
        <button className={styles.loginLink} type="button" onClick={() => history.push('/auth/login')}>
          {isRegister ? '已有账号，去登录' : '想起密码了，返回登录'}
        </button>
        <p className={styles.policy}>{isRegister ? '注册即表示你同意《用户协议》和《隐私政策》' : '验证码仅用于本次密码重置操作'}</p>
      </main>
    </div>
  );
};

export default AuthPlaceholder;
