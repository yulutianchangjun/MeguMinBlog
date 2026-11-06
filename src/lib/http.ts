import axios, { type AxiosResponse } from 'axios'
import { progress } from './progress'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** 是否已配置后端；未配置时前端保持只读降级（使用构建期 Markdown） */
export const apiReady = API_BASE.length > 0

const TOKEN_KEY = 'mgm:api-token'

export const tokenStore = {
  get(): string {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? ''
    } catch {
      return ''
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      /* noop */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* noop */
    }
  },
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  progress.start()
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    progress.done()
    return response
  },
  (error) => {
    progress.done(false)
    return Promise.reject(error)
  },
)

function toError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data as { message?: string } | undefined
    if (body?.message) return new ApiError(body.message, status)
    if (status === 0) return new ApiError('服务器异常，请联系博主', 0)
    return new ApiError(`请求失败（${status}）`, status)
  }
  return new ApiError(error instanceof Error ? error.message : '请求失败')
}

async function unwrap<T>(request: Promise<AxiosResponse<ApiEnvelope<T>>>): Promise<T> {
  try {
    const response = await request
    const body = response.data
    if (body && typeof body.code === 'number' && body.code !== 0) {
      throw new ApiError(body.message || '请求失败', response.status)
    }
    return body?.data as T
  } catch (error) {
    throw toError(error)
  }
}

export const http = {
  get: <T>(url: string, params?: Record<string, unknown>) => unwrap<T>(client.get(url, { params })),
  post: <T>(url: string, body?: unknown) => unwrap<T>(client.post(url, body)),
  put: <T>(url: string, body?: unknown) => unwrap<T>(client.put(url, body)),
  patch: <T>(url: string, body?: unknown, params?: Record<string, unknown>) =>
    unwrap<T>(client.patch(url, body, { params })),
  del: <T>(url: string, params?: Record<string, unknown>) => unwrap<T>(client.delete(url, { params })),
  upload: <T>(url: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return unwrap<T>(
      client.post(url, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          // 上传阶段注入真实进度；封顶 95%，剩余留给服务端落盘与响应
          if (event.total) progress.set((event.loaded / event.total) * 95)
        },
      }),
    )
  },
}
