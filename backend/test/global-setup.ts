import { execSync } from 'node:child_process'

export default function setup() {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error('TEST_DATABASE_URL não está definida')
  }

  const dbName = new URL(url).pathname.replace(/^\//, '')
  if (dbName !== 'cupcake_test') {
    throw new Error(`Os testes só podem rodar no banco "cupcake_test" (recebido: "${dbName}")`)
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  })
}
