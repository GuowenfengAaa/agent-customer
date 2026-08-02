import { request as umiRequest } from '@umijs/max';
import { clearSession, getToken } from './storage';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

/** OpenAPI 生成代码使用的请求适配层。 */
export default async function openapiRequest<T>(url: string, options: Record<string, unknown> = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers((options.headers as HeadersInit | undefined) || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const result = await umiRequest<T>(`${API_BASE_URL}${url}`, {
    ...options,
    headers: Object.fromEntries(headers.entries()),
  });
  const businessResult = result as T & { code?: number; msg?: string };

  if (businessResult?.code === 1 || businessResult?.code === 0) return result;
  if (businessResult?.code === 401) clearSession();

  const error = new Error(businessResult?.msg || '请求失败') as Error & { code?: number };
  error.code = businessResult?.code;
  throw error;
}
