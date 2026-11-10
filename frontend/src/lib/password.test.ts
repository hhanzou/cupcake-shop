import { describe, expect, it } from 'vitest'
import { checkPassword, isStrongPassword } from './password'

const failing = (password: string) =>
  checkPassword(password)
    .filter((r) => !r.ok)
    .map((r) => r.id)

describe('senha forte', () => {
  it('aceita senha com todas as exigências', () => {
    expect(isStrongPassword('Senha@12345')).toBe(true)
    expect(failing('Senha@12345')).toEqual([])
  })

  it('aponta exatamente as exigências que faltam', () => {
    expect(failing('')).toEqual(['length', 'upper', 'lower', 'number', 'special'])
    expect(failing('senha@12345')).toEqual(['upper'])
    expect(failing('SENHA@12345')).toEqual(['lower'])
    expect(failing('Senha@abcde')).toEqual(['number'])
    expect(failing('Senha12345')).toEqual(['special'])
    expect(failing('Se@1')).toEqual(['length'])
  })

  it('espaço não conta como caractere especial', () => {
    expect(failing('Senha 12345')).toEqual(['special'])
  })

  it('aceita letras acentuadas', () => {
    expect(isStrongPassword('Ébano#2026çã')).toBe(true)
  })

  it('recusa senha acima de 72 caracteres', () => {
    expect(isStrongPassword(`Aa1@${'x'.repeat(69)}`)).toBe(false)
  })
})
