import { Button, Card, Input, NavBar, Space, Toast } from 'antd-mobile';
import { history, useLocation } from '@umijs/max';
import React, { useState } from 'react';
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

  const requestCode = async () => {
    if (!email.trim()) {
      Toast.show({ content: '请先填写邮箱' });
      return;
    }
    try {
      await sendEmailCode(email.trim(), isRegister ? 0 : 1);
      Toast.show({ content: '验证码已发送，请查收邮件（也请检查垃圾邮件）' });
    } catch (error) {
      Toast.show({ content: error instanceof Error ? error.message : '验证码发送失败' });
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
    <div className={styles.page}>
      <NavBar onBack={() => history.push('/auth/login')}>智能购票</NavBar>
      <Card className={styles.card}>
        <div className={styles.kicker}>{isRegister ? 'CREATE ACCOUNT' : 'RESET PASSWORD'}</div>
        <h1>{isRegister ? '注册账号' : '找回密码'}</h1>
        <p>{isRegister ? '使用手机号和邮箱验证码创建观影账户。' : '通过邮箱验证码设置新的登录密码。'}</p>
        <Space direction="vertical" block className={styles.form}>
          {isRegister ? <Input className={styles.input} placeholder="手机号" value={phone} onChange={setPhone} type="tel" maxLength={11} /> : null}
          <Input className={styles.input} placeholder="邮箱" value={email} onChange={setEmail} type="email" />
          <div className={styles.codeRow}>
            <Input className={styles.input} placeholder="邮箱验证码" value={code} onChange={setCode} />
            <Button fill="outline" onClick={requestCode}>获取验证码</Button>
          </div>
          <Input className={styles.input} placeholder={isRegister ? '密码（8-32位，含字母和数字）' : '新密码（8-32位，含字母和数字）'} value={password} onChange={setPassword} type="password" />
          <Button color="primary" block loading={loading} onClick={submit}>{isRegister ? '注册并登录' : '重置密码'}</Button>
          <Button fill="none" block onClick={() => history.push('/auth/login')}>返回登录</Button>
        </Space>
      </Card>
    </div>
  );
};

export default AuthPlaceholder;
