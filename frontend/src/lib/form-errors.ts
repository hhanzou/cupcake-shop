import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiError } from './api'

type Detail = { path?: string; message?: string }

/** Extrai os `details[]` ({ path, message }) de um VALIDATION_ERROR ou ORDER_INVALID_ADDRESS. */
export function getFieldDetails(error: unknown): { path: string; message: string }[] {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return []
  return (error.details as Detail[])
    .filter((d): d is { path: string; message: string } => typeof d?.path === 'string' && typeof d?.message === 'string')
    .map((d) => ({ path: d.path, message: d.message }))
}

/**
 * Marca nos campos do formulário os erros devolvidos pela API.
 * `fields` lista os campos conhecidos; retorna true se algum foi marcado.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
): boolean {
  let applied = false
  for (const { path, message } of getFieldDetails(error)) {
    if (fields.includes(path)) {
      setError(path as Path<T>, { type: 'server', message })
      applied = true
    }
  }
  return applied
}
