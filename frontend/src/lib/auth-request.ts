'use client'

import { ApiError, request, type RequestOptions } from './api'
import { useSession } from '@/stores/session'

/** Envolve `request` com o token da sessão. Em 401 com token enviado, limpa a sessão. */
export async function authRequest<T>(
  path: string,
  options: Omit<RequestOptions, 'token'> = {},
): Promise<T> {
  const token = useSession.getState().token
  try {
    return await request<T>(path, { ...options, token })
  } catch (error) {
    if (token && error instanceof ApiError && error.status === 401) {
      useSession.getState().clear()
    }
    throw error
  }
}
