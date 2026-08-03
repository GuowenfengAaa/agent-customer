import { LeftOutline } from 'antd-mobile-icons';
import { history, useLocation } from '@umijs/max';
import React from 'react';
import styles from './index.module.less';

const Legal: React.FC = () => {
  const location = useLocation();
  const isPrivacy = location.pathname.endsWith('privacy');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          type="button"
          aria-label="返回登录"
          title="返回登录"
          onClick={() => history.push('/auth/login')}
        >
          <LeftOutline />
        </button>
        <span className={styles.title}>{isPrivacy ? '隐私政策' : '用户协议'}</span>
        <span className={styles.headerSide} />
      </header>
      <main className={styles.content}>
        <p className={styles.updated}>更新日期：2026年8月3日</p>
        {isPrivacy ? (
          <>
            <h1>隐私政策</h1>
            <p>光影票务重视你的个人信息安全。本政策用于说明我们在登录、注册和购票过程中如何使用相关信息。</p>
            <h2>我们收集的信息</h2>
            <p>为了完成账户注册和订单服务，我们可能收集手机号、邮箱地址、登录凭证以及你主动保存的观影偏好。</p>
            <h2>信息的使用</h2>
            <p>这些信息仅用于身份验证、发送验证码、处理订单和改善购票体验。我们不会将个人信息出售给无关的第三方。</p>
            <h2>你的选择</h2>
            <p>你可以通过退出登录、修改资料或联系客服来管理自己的账户信息。涉及订单履约所必需的信息，会在法律允许的期限内保存。</p>
          </>
        ) : (
          <>
            <h1>用户协议</h1>
            <p>欢迎使用光影票务。注册或登录前，请阅读并理解本协议。点击“登录”或“注册并登录”即表示你接受本协议内容。</p>
            <h2>账户使用</h2>
            <p>你应当使用真实、有效的信息创建账户，并妥善保管登录密码和验证码。因账户保管不善造成的风险，由账户使用者承担。</p>
            <h2>购票服务</h2>
            <p>影片、影院、场次和票价以页面展示及实际库存为准。订单提交后，请按照页面提示完成支付和取票。</p>
            <h2>合理使用</h2>
            <p>请勿利用本服务从事违法活动、恶意占座、批量请求或干扰系统正常运行。违反约定时，我们可能限制相关账户的使用。</p>
          </>
        )}
      </main>
    </div>
  );
};

export default Legal;
