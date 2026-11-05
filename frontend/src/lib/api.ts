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
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    throw new Error('A variável NEXT_PUBLIC_API_URL não está definida. Veja o arquivo .env.example.')
  }
  return url.replace(/\/$/, '')
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, formData, cache } = options
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

  let response: Response
  try {
    response = await fetch(url, { method, headers, body: payload, cache })
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Não foi possível falar com o servidor. Verifique sua conexão e tente novamente.',
    )
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
