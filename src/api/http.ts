// =====================================================================
// src/api/http.ts — helper unwrap ApiResponse<T>
// =====================================================================
import { apiClient } from './client';
import type { ApiResponse } from './types';
import type { AxiosRequestConfig } from 'axios';

/** Gọi API và trả thẳng phần `data` đã unwrap khỏi ApiResponse, hỗ trợ cả API trả trực tiếp object không bọc. */
export async function unwrap<T>(p: Promise<{ data: ApiResponse<T> | T }>): Promise<T> {
  const res = await p;
  if (res.data && typeof res.data === 'object' && 'data' in (res.data as any) && ('code' in (res.data as any) || 'status' in (res.data as any))) {
    return (res.data as ApiResponse<T>).data;
  }
  return res.data as T;
}



export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(apiClient.get(url, config)),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => unwrap<T>(apiClient.post(url, body, config)),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => unwrap<T>(apiClient.put(url, body, config)),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) => unwrap<T>(apiClient.patch(url, body, config)),
  del: <T>(url: string, config?: AxiosRequestConfig) => unwrap<T>(apiClient.delete(url, config)),
};
