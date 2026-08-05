import { Avatar, Button, Input, NavBar, Stepper, Toast } from 'antd-mobile';
import {
  BillOutline,
  CameraOutline,
  CheckShieldOutline,
  EnvironmentOutline,
  EyeInvisibleOutline,
  EyeOutline,
  HeartOutline,
  LockOutline,
  MailOutline,
  RightOutline,
  StarOutline,
} from 'antd-mobile-icons';
import { history, useLocation } from '@umijs/max';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
import { queryKeys } from '@/query/keys';
import { currentSession, logout } from '@/services/auth';
import { customerApi } from '@/services/customerApi';
import { updateSessionEmail } from '@/services/storage';
import type { UserProfile } from '@/types/domain';
import { getAvatarThumbnailUrl } from '@/utils/avatar';
import styles from './index.module.less';

const DISTRICTS = ['涧西区', '西工区', '老城区', '洛龙区'];
const HALL_TYPES = ['IMAX', '杜比', '数字', '4DX', '普通'];
const SEAT_ZONES = [
  { value: 'FRONT', label: '前排' },
  { value: 'MIDDLE', label: '中区' },
  { value: 'BACK', label: '后排' },
  { value: 'COUPLE', label: '情侣座' },
];

const ChoiceGroup: React.FC<{
  value: string;
  options: Array<string | { value: string; label: string }>;
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
  <div className={styles.choiceGrid}>
    {options.map((option) => {
      const item = typeof option === 'string' ? { value: option, label: option } : option;
      return (
        <button
          className={`${styles.choiceButton} ${value === item.value ? styles.choiceButtonActive : ''}`}
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      );
    })}
  </div>
);

const PreferencePage: React.FC<{ profile?: UserProfile; loading: boolean }> = ({ profile, loading }) => {
  const queryClient = useQueryClient();
  const [district, setDistrict] = useState('涧西区');
  const [hallType, setHallType] = useState('IMAX');
  const [seatZone, setSeatZone] = useState('MIDDLE');
  const [budget, setBudget] = useState(60);

  useEffect(() => {
    const preference = profile?.preference;
    if (!preference) return;
    if (preference.district) setDistrict(preference.district);
    if (preference.hallType) setHallType(preference.hallType);
    if (preference.seatZone) setSeatZone(preference.seatZone);
    if (preference.budgetRaw !== undefined) setBudget(Math.round(preference.budgetRaw / 100));
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => customerApi.savePreference({
      district,
      hallType,
      seatZone,
      budget: Math.round(budget * 100),
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      Toast.show({ icon: 'success', content: '观影偏好已保存' });
    },
    onError: (error) => {
      Toast.show({ content: error instanceof Error ? error.message : '保存失败，请稍后重试' });
    },
  });

  return (
    <div className={styles.subPage}>
      <NavBar className={styles.subNav} onBack={() => history.push('/me')}>观影偏好</NavBar>
      <main className={styles.settingsContent}>
        <header className={styles.settingsHeading}>
          <span>PERSONAL TASTE</span>
          <h1>让推荐更懂你的选择</h1>
          <p>偏好将用于影院、影厅和座位推荐。</p>
        </header>

        <section className={styles.settingsPanel} aria-busy={loading}>
          <div className={styles.settingField}>
            <div className={styles.fieldTitle}><strong>常去区域</strong><span>{district}</span></div>
            <ChoiceGroup value={district} options={DISTRICTS} onChange={setDistrict} />
          </div>
          <div className={styles.settingField}>
            <div className={styles.fieldTitle}><strong>偏好影厅</strong><span>{hallType}</span></div>
            <ChoiceGroup value={hallType} options={HALL_TYPES} onChange={setHallType} />
          </div>
          <div className={styles.settingField}>
            <div className={styles.fieldTitle}><strong>座位区域</strong><span>{SEAT_ZONES.find((item) => item.value === seatZone)?.label}</span></div>
            <ChoiceGroup value={seatZone} options={SEAT_ZONES} onChange={setSeatZone} />
          </div>
          <div className={`${styles.settingField} ${styles.budgetField}`}>
            <div>
              <strong>单票预算上限</strong>
              <span>推荐时优先匹配预算内场次</span>
            </div>
            <div className={styles.budgetControl}>
              <span>¥</span>
              <Stepper
                value={budget}
                min={20}
                max={300}
                step={10}
                onChange={(value) => setBudget(Number(value))}
              />
            </div>
          </div>
        </section>

        <Button
          className={styles.primaryAction}
          color="primary"
          block
          loading={saveMutation.isPending}
          disabled={loading}
          onClick={() => saveMutation.mutate()}
        >
          保存偏好
        </Button>
      </main>
    </div>
  );
};

const maskEmail = (email?: string) => {
  if (!email || !email.includes('@')) return '未绑定邮箱';
  const [name, domain] = email.split('@');
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${'*'.repeat(Math.max(3, name.length - visible.length))}@${domain}`;
};

const useCodeCountdown = () => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);
  return { seconds, start: () => setSeconds(60) };
};

const SecurityPage: React.FC<{ profile?: UserProfile }> = ({ profile }) => {
  const session = currentSession();
  const phone = profile?.phone || session?.phone || '--';
  const email = profile?.email || session?.email;
  return (
    <div className={styles.subPage}>
      <NavBar className={styles.subNav} onBack={() => history.push('/me')}>账号安全</NavBar>
      <main className={styles.settingsContent}>
        <section className={styles.securitySummary}>
          <span className={styles.securityBadge}><CheckShieldOutline /></span>
          <div><strong>账号保护正常</strong><p>重要操作将通过绑定邮箱进行身份验证</p></div>
        </section>
        <section className={styles.accountPanel}>
          <div><span>绑定手机</span><strong>{phone}</strong></div>
          <div><span>绑定邮箱</span><strong>{email || '未绑定邮箱'}</strong></div>
        </section>
        <section className={styles.securityActions}>
          <button type="button" onClick={() => history.push('/me/security/password')}>
            <span><strong>修改密码</strong><small>使用当前密码和邮箱验证码确认身份</small></span><RightOutline />
          </button>
          <button type="button" onClick={() => history.push('/me/security/email')}>
            <span><strong>换绑邮箱</strong><small>同时验证当前邮箱与新邮箱</small></span><RightOutline />
          </button>
        </section>
        {!email && <p className={styles.securityFootnote}>当前账号未绑定邮箱，请联系管理员处理</p>}
      </main>
    </div>
  );
};

const PasswordSecurityPage: React.FC<{ profile?: UserProfile }> = ({ profile }) => {
  const email = profile?.email || currentSession()?.email;
  const [oldPassword, setOldPassword] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const countdown = useCodeCountdown();
  const codeMutation = useMutation({
    mutationFn: customerApi.sendSecurityCode,
    onSuccess: () => { countdown.start(); Toast.show({ icon: 'success', content: '验证码已发送' }); },
    onError: (error) => Toast.show({ content: error instanceof Error ? error.message : '验证码发送失败' }),
  });
  const changeMutation = useMutation({
    mutationFn: () => customerApi.changePassword({ oldPassword, emailCode, newPassword }),
    onSuccess: () => { Toast.show({ icon: 'success', content: '密码修改成功' }); history.replace('/me/security'); },
    onError: (error) => Toast.show({ content: error instanceof Error ? error.message : '修改失败，请稍后重试' }),
  });
  const submit = () => {
    if (!oldPassword) { Toast.show({ content: '请输入当前密码' }); return; }
    if (!/^\d{6}$/.test(emailCode)) { Toast.show({ content: '请输入6位邮箱验证码' }); return; }
    if (!/^(?=.*[a-zA-Z])(?=.*\d).{8,32}$/.test(newPassword)) { Toast.show({ content: '新密码需8-32位且包含字母和数字' }); return; }
    if (newPassword !== confirmPassword) { Toast.show({ content: '两次输入的新密码不一致' }); return; }
    if (oldPassword === newPassword) { Toast.show({ content: '新密码不能与当前密码相同' }); return; }
    changeMutation.mutate();
  };
  return (
    <div className={styles.subPage}>
      <NavBar className={styles.subNav} onBack={() => history.push('/me/security')}>修改密码</NavBar>
      <main className={`${styles.settingsContent} ${styles.passwordContent}`}>
        <section className={styles.passwordHero}>
          <span className={styles.passwordHeroIcon}><CheckShieldOutline /></span>
          <div>
            <small>SECURITY CHECK</small>
            <h1>双重验证，更安心</h1>
            <p>完成密码与邮箱验证后即可设置新密码</p>
          </div>
        </section>
        <section className={`${styles.passwordPanel} ${styles.passwordForm}`}>
          <div className={styles.formSectionTitle}>
            <span>01</span>
            <div><strong>验证当前账号</strong><small>验证码将发送至 {maskEmail(email)}</small></div>
          </div>
          <label className={styles.inputField}>
            <span>当前密码</span>
            <span className={styles.passwordInputWrap}>
              <Input value={oldPassword} onChange={setOldPassword} type={oldPasswordVisible ? 'text' : 'password'} placeholder="请输入当前密码" maxLength={32} />
              <button className={styles.passwordVisibilityButton} type="button" title={oldPasswordVisible ? '隐藏密码' : '显示密码'} aria-label={oldPasswordVisible ? '隐藏当前密码' : '显示当前密码'} onClick={() => setOldPasswordVisible((visible) => !visible)}>
                {oldPasswordVisible ? <EyeOutline /> : <EyeInvisibleOutline />}
              </button>
            </span>
          </label>
          <div className={`${styles.codeField} ${styles.passwordCodeField}`}><span>邮箱验证码</span><Input value={emailCode} onChange={setEmailCode} placeholder="请输入6位验证码" maxLength={6} inputMode="numeric" /><Button size="small" loading={codeMutation.isPending} disabled={!email || countdown.seconds > 0} onClick={() => codeMutation.mutate()}>{countdown.seconds > 0 ? `${countdown.seconds}s` : '获取验证码'}</Button></div>
          <div className={styles.formSectionTitle}>
            <span>02</span>
            <div><strong>设置新密码</strong><small>请使用未在其他平台使用过的密码</small></div>
          </div>
          <label className={styles.inputField}>
            <span>新密码</span>
            <span className={styles.passwordInputWrap}>
              <Input value={newPassword} onChange={setNewPassword} type={newPasswordVisible ? 'text' : 'password'} placeholder="8-32位，包含字母和数字" maxLength={32} />
              <button className={styles.passwordVisibilityButton} type="button" title={newPasswordVisible ? '隐藏密码' : '显示密码'} aria-label={newPasswordVisible ? '隐藏新密码' : '显示新密码'} onClick={() => setNewPasswordVisible((visible) => !visible)}>
                {newPasswordVisible ? <EyeOutline /> : <EyeInvisibleOutline />}
              </button>
            </span>
          </label>
          <label className={styles.inputField}>
            <span>确认新密码</span>
            <span className={styles.passwordInputWrap}>
              <Input value={confirmPassword} onChange={setConfirmPassword} type={confirmPasswordVisible ? 'text' : 'password'} placeholder="再次输入新密码" maxLength={32} />
              <button className={styles.passwordVisibilityButton} type="button" title={confirmPasswordVisible ? '隐藏密码' : '显示密码'} aria-label={confirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'} onClick={() => setConfirmPasswordVisible((visible) => !visible)}>
                {confirmPasswordVisible ? <EyeOutline /> : <EyeInvisibleOutline />}
              </button>
            </span>
          </label>
          <div className={styles.passwordRules}><span>8-32 位</span><span>包含字母</span><span>包含数字</span></div>
        </section>
        <Button className={`${styles.primaryAction} ${styles.passwordSubmit}`} color="primary" block loading={changeMutation.isPending} onClick={submit}>确认修改密码</Button>
        <p className={styles.passwordNote}>修改成功后当前设备将继续保持登录</p>
      </main>
    </div>
  );
};

const EmailSecurityPage: React.FC<{ profile?: UserProfile }> = ({ profile }) => {
  const queryClient = useQueryClient();
  const currentEmail = profile?.email || currentSession()?.email;
  const [currentEmailCode, setCurrentEmailCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailCode, setNewEmailCode] = useState('');
  const currentCountdown = useCodeCountdown();
  const newCountdown = useCodeCountdown();
  const currentCodeMutation = useMutation({
    mutationFn: customerApi.sendSecurityCode,
    onSuccess: () => { currentCountdown.start(); Toast.show({ icon: 'success', content: '当前邮箱验证码已发送' }); },
    onError: (error) => Toast.show({ content: error instanceof Error ? error.message : '验证码发送失败' }),
  });
  const newCodeMutation = useMutation({
    mutationFn: () => customerApi.sendNewEmailCode(newEmail.trim()),
    onSuccess: () => { newCountdown.start(); Toast.show({ icon: 'success', content: '新邮箱验证码已发送' }); },
    onError: (error) => Toast.show({ content: error instanceof Error ? error.message : '验证码发送失败' }),
  });
  const changeMutation = useMutation({
    mutationFn: () => customerApi.changeEmail({ currentEmailCode, newEmail: newEmail.trim(), newEmailCode }),
    onSuccess: async () => {
      updateSessionEmail(newEmail.trim());
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      Toast.show({ icon: 'success', content: '邮箱换绑成功' });
      history.replace('/me/security');
    },
    onError: (error) => Toast.show({ content: error instanceof Error ? error.message : '换绑失败，请稍后重试' }),
  });
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());
  const sendNewCode = () => {
    if (!emailValid) { Toast.show({ content: '请输入正确的新邮箱' }); return; }
    if (newEmail.trim().toLowerCase() === currentEmail?.toLowerCase()) { Toast.show({ content: '新邮箱不能与当前邮箱相同' }); return; }
    newCodeMutation.mutate();
  };
  const submit = () => {
    if (!/^\d{6}$/.test(currentEmailCode)) { Toast.show({ content: '请输入当前邮箱的6位验证码' }); return; }
    if (!emailValid) { Toast.show({ content: '请输入正确的新邮箱' }); return; }
    if (!/^\d{6}$/.test(newEmailCode)) { Toast.show({ content: '请输入新邮箱的6位验证码' }); return; }
    changeMutation.mutate();
  };
  return (
    <div className={styles.subPage}>
      <NavBar className={styles.subNav} onBack={() => history.push('/me/security')}>换绑邮箱</NavBar>
      <main className={`${styles.settingsContent} ${styles.emailSecurityContent}`}>
        <section className={styles.emailHero}>
          <span className={styles.emailHeroIcon}><MailOutline /></span>
          <div className={styles.emailHeroCopy}>
            <small>EMAIL SECURITY</small>
            <h1>更换绑定邮箱</h1>
            <p>双重验证码确认，保障账号始终属于你</p>
          </div>
          <div className={styles.emailHeroAccount}>
            <span>当前绑定</span>
            <strong>{maskEmail(currentEmail)}</strong>
          </div>
        </section>

        <div className={styles.emailProgress} aria-label="换绑邮箱步骤">
          <div className={styles.emailProgressItem}>
            <span>1</span>
            <div><strong>验证身份</strong><small>确认当前邮箱</small></div>
          </div>
          <i />
          <div className={styles.emailProgressItem}>
            <span>2</span>
            <div><strong>绑定邮箱</strong><small>验证新邮箱</small></div>
          </div>
        </div>

        <section className={styles.emailStepCard}>
          <header className={styles.emailStepHeader}>
            <span className={styles.emailStepIcon}><LockOutline /></span>
            <div><strong>验证当前邮箱</strong><small>验证码将发送至 {maskEmail(currentEmail)}</small></div>
            <em>01</em>
          </header>
          <div className={styles.emailCodeRow}>
            <Input value={currentEmailCode} onChange={setCurrentEmailCode} placeholder="输入当前邮箱验证码" maxLength={6} inputMode="numeric" />
            <Button size="small" loading={currentCodeMutation.isPending} disabled={!currentEmail || currentCountdown.seconds > 0} onClick={() => currentCodeMutation.mutate()}>{currentCountdown.seconds > 0 ? `${currentCountdown.seconds}s` : '获取验证码'}</Button>
          </div>
        </section>

        <div className={styles.emailFlowLine}><span /></div>

        <section className={`${styles.emailStepCard} ${styles.emailStepCardAccent}`}>
          <header className={styles.emailStepHeader}>
            <span className={styles.emailStepIcon}><MailOutline /></span>
            <div><strong>绑定新邮箱</strong><small>填写新地址并完成邮箱验证</small></div>
            <em>02</em>
          </header>
          <label className={styles.emailInputRow}>
            <span>新邮箱</span>
            <Input value={newEmail} onChange={setNewEmail} placeholder="name@example.com" type="email" />
          </label>
          <div className={styles.emailCodeRow}>
            <Input value={newEmailCode} onChange={setNewEmailCode} placeholder="输入新邮箱验证码" maxLength={6} inputMode="numeric" />
            <Button size="small" loading={newCodeMutation.isPending} disabled={newCountdown.seconds > 0} onClick={sendNewCode}>{newCountdown.seconds > 0 ? `${newCountdown.seconds}s` : '获取验证码'}</Button>
          </div>
        </section>

        <Button className={`${styles.primaryAction} ${styles.emailSubmit}`} color="primary" block loading={changeMutation.isPending} onClick={submit}>确认换绑邮箱</Button>
        <p className={styles.emailNote}><CheckShieldOutline /> 换绑后，新邮箱将用于登录与账号安全验证</p>
      </main>
    </div>
  );
};

const Me: React.FC = () => {
  const location = useLocation();
  const session = currentSession();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => customerApi.getProfile(),
    enabled: location.pathname.startsWith('/me'),
  });
  const avatarMutation = useMutation({
    mutationFn: customerApi.updateAvatar,
    onSuccess: (avatarUrl) => {
      queryClient.setQueryData<UserProfile>(queryKeys.profile, (profile) => (
        profile ? { ...profile, avatarUrl } : profile
      ));
      Toast.show({ icon: 'success', content: '头像已更新' });
    },
    onError: (error) => {
      Toast.show({ content: error instanceof Error ? error.message : '头像上传失败，请稍后重试' });
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      Toast.show({ content: '请选择 JPG、PNG 或 WebP 图片' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      Toast.show({ content: '头像图片不能超过 5MB' });
      return;
    }
    avatarMutation.mutate(file);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      history.replace('/auth/login');
    }
  };

  if (location.pathname === '/me/preferences') {
    return <PreferencePage profile={profileQuery.data} loading={profileQuery.isLoading} />;
  }
  if (location.pathname === '/me/security') {
    return <SecurityPage profile={profileQuery.data} />;
  }
  if (location.pathname === '/me/security/password') {
    return <PasswordSecurityPage profile={profileQuery.data} />;
  }
  if (location.pathname === '/me/security/email') {
    return <EmailSecurityPage profile={profileQuery.data} />;
  }

  const phone = profileQuery.data?.phone || session?.phone || '观影用户';
  const email = profileQuery.data?.email || session?.email || '登录后同步订单与观影偏好';
  const district = profileQuery.data?.preference?.district;

  const services = [
    {
      title: '我的订单',
      description: '查看购票记录与电子票',
      path: '/me/orders',
      icon: <BillOutline />,
      tone: styles.orderIcon,
    },
    {
      title: '想看的电影',
      description: '收藏感兴趣的影片，随时回来查看',
      path: '/me/wishlist',
      icon: <HeartOutline />,
      tone: styles.wishlistIcon,
    },
    {
      title: '观影偏好',
      description: district ? `常去 ${district}` : '设置影院与座位偏好',
      path: '/me/preferences',
      icon: <StarOutline />,
      tone: styles.preferenceIcon,
    },
    {
      title: '账号安全',
      description: '管理登录与账户安全',
      path: '/me/security',
      icon: <CheckShieldOutline />,
      tone: styles.securityIcon,
    },
  ];

  return (
    <div className={styles.page}>
      <section className={styles.profilePanel}>
        <div className={styles.profileTop}>
          <div className={styles.avatarWrap}>
            <button
              className={styles.avatarButton}
              type="button"
              title="更换头像"
              aria-label="选择图片更换头像"
              disabled={avatarMutation.isPending}
              onClick={() => avatarInputRef.current?.click()}
            >
              <Avatar
                className={styles.avatar}
                src={getAvatarThumbnailUrl(profileQuery.data?.avatarUrl)}
                fallback={phone.slice(-2)}
              />
              <span className={styles.avatarEditBadge}><CameraOutline /></span>
              {avatarMutation.isPending && <span className={styles.avatarLoading} aria-label="正在上传头像" />}
            </button>
            <input
              ref={avatarInputRef}
              className={styles.avatarFileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
            />
          </div>
          <div className={styles.profileText}>
            <div className={styles.nameRow}>
              <h1>{phone}</h1>
              <span className={styles.loginStatus}>已登录</span>
            </div>
            <p>{email}</p>
          </div>
        </div>

        <div className={styles.stats}>
          <div>
            <strong>{profileQuery.data?.stats?.totalOrders ?? '--'}</strong>
            <span>历史订单</span>
          </div>
          <div>
            <strong>
              {profileQuery.data?.stats
                ? `¥${profileQuery.data.stats.totalSpent.toFixed(0)}`
                : '--'}
            </strong>
            <span>累计消费</span>
          </div>
          <div>
            <strong>{profileQuery.data?.preference?.hallType || '未设置'}</strong>
            <span>偏好影厅</span>
          </div>
        </div>
      </section>

      <section className={styles.serviceSection}>
        <div className={styles.sectionHeading}>
          <div>
            <span>购票服务</span>
            <small>常用功能</small>
          </div>
          {district && (
            <span className={styles.locationHint}>
              <EnvironmentOutline />
              {district}
            </span>
          )}
        </div>
        <div className={styles.serviceList}>
          {services.map((item) => (
            <button
              className={styles.serviceItem}
              key={item.path}
              type="button"
              onClick={() => history.push(item.path)}
            >
              <span className={`${styles.serviceIcon} ${item.tone}`}>{item.icon}</span>
              <span className={styles.serviceText}>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <RightOutline className={styles.arrow} />
            </button>
          ))}
        </div>
      </section>

      <Button className={styles.logout} block onClick={handleLogout}>
        退出登录
      </Button>
      <p className={styles.note}>账户登录状态已安全同步</p>
    </div>
  );
};

export default Me;
