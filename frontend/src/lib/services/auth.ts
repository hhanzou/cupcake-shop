import { request } from '../api'
import { authRequest } from '../auth-request'
import type { Session, User } from '../types'

export const login = (body: { email: string; password: string }) =>
  request<Session>('/auth/login', { method: 'POST', body })

export const register = (body: { name: string; email: string; password: string }) =>
  request<Session>('/auth/register', { method: 'POST', body })

export const getMe = () => authRequest<{ user: User }>('/auth/me')
