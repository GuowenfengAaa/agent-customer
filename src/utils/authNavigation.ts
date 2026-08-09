import { Dialog } from 'antd-mobile';
import { history } from '@umijs/max';
import { getToken } from '@/services/storage';

let pendingLoginConfirmation: Promise<boolean> | null = null;

export function getCurrentPath() {
  return window.location.pathname + window.location.search;
}

export function getLoginPath(redirect = getCurrentPath()) {
  return `/auth/login?redirect=${encodeURIComponent(redirect)}`;
}

export function confirmLogin(): Promise<boolean> {
  if (getToken()) return Promise.resolve(true);

  if (!pendingLoginConfirmation) {
    pendingLoginConfirmation = Dialog.confirm({
      title: '需要登录',
      content: '登录后才能继续此操作',
      confirmText: '去登录',
      cancelText: '取消',
    }).finally(() => {
      pendingLoginConfirmation = null;
    });
  }

  return pendingLoginConfirmation;
}

export async function runAuthenticated(
  action: () => void | Promise<void>,
  redirect = getCurrentPath(),
) {
  if (getToken()) {
    await action();
    return;
  }

  if (await confirmLogin()) history.push(getLoginPath(redirect));
}

export function navigateAuthenticated(path: string) {
  void runAuthenticated(() => {
    history.push(path);
  }, path);
}
