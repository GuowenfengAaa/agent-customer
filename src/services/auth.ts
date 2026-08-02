import type { LoginResponse, UserSession } from '@/types/domain';
import generatedApi from '@/api';
import { clearSession, getSession, saveSession } from './storage';

const unwrap = <T,>(result: { data?: T }) => result.data as T;

export async function login(phone: string, password: string): Promise<UserSession> {
  const response = unwrap<LoginResponse>(await generatedApi.authController.login({ phone, password }) as unknown as { data?: LoginResponse });

  const roleCode = Number(response.user.role);
  const session: UserSession = {
    token: response.token,
    userId: String(response.user.id),
    phone: response.user.phone,
    email: response.user.email,
    roleCode,
    role: roleCode === 1 ? 'ADMIN' : 'USER',
    loggedInAt: new Date().toISOString(),
  };
  saveSession(session);
  return session;
}

export function sendEmailCode(email: string, purpose: 0 | 1) {
  return generatedApi.authController.sendCode({ email, purpose }).then(() => undefined);
}

export function registerAccount(payload: { phone: string; email: string; password: string; code: string }) {
  return generatedApi.authController.register(payload).then(() => undefined);
}

export function resetPassword(payload: { email: string; code: string; newPassword: string }) {
  return generatedApi.authController.resetPassword(payload).then(() => undefined);
}

export function currentSession() {
  return getSession();
}

export function logout() {
  clearSession();
}
