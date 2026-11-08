import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown[]

  constructor(status: number, code: string, message: string, details?: unknown[]) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string | null
  formData?: FormData
  cache?: RequestCache
  /** Aborta a requisição após esse tempo e lança ApiError(0, 'TIMEOUT'). */
  timeoutMs?: number
  /** Não dispara o aviso global de API lenta (usado pela tela "acordando a API"). */
  quiet?: boolean
}

export const API_SLOW_EVENT = 'api:slow'
export const API_DONE_EVENT = 'api:done'
const SLOW_AFTER_MS = 4000

/** True quando a API provavelmente está dormindo (cold start): sem resposta ou 502/503/504. */
export function isApiAsleep(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || [502, 503, 504].includes(error.status))
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error('A variável NEXT_PUBLIC_API_URL não está definida. Veja o arquivo .env.example.')
  }
  return url.replace(/\/$/, '')
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, formData, cache, timeoutMs, quiet } = options
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`

  let payload: BodyInit | undefined
  if (formData) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const url = `${baseUrl()}${path}`

  // No navegador, avisa a interface quando a resposta demora (API acordando).
  const inBrowser = typeof window !== 'undefined' && !quiet
  let slowFired = false
  const slowTimer = inBrowser
    ? setTimeout(() => {
        slowFired = true
        window.dispatchEvent(new Event(API_SLOW_EVENT))
      }, SLOW_AFTER_MS)
    : undefined

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: payload,
      cache,
      signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new ApiError(0, 'TIMEOUT', 'O servidor demorou demais para responder. Tente novamente.')
    }
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.',
    )
  } finally {
    if (slowTimer) clearTimeout(slowTimer)
    if (slowFired) window.dispatchEvent(new Event(API_DONE_EVENT))
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : undefined
  } catch {
    data = undefined
  }

  if (!response.ok) {
    const error = (data as ApiErrorBody | undefined)?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Algo deu errado. Tente novamente.',
      error?.details,
    )
  }

  return data as T
}
